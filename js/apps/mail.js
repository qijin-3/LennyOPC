'use strict';

const MailApp = {
  _selectedId: null,

  render(container) {
    container.innerHTML = `
      <div class="mail-layout">
        <div class="mail-sidebar">
          <div class="mail-sidebar-header">${t('app.mail')}</div>
          <div class="mail-folder active">📥 ${t('mail.inbox')} <span class="folder-badge" id="mail-unread-badge">0</span></div>
          <div class="mail-folder">📤 ${t('mail.sent')}</div>
          <div class="mail-folder">🗑️ ${t('mail.trash')}</div>
        </div>
        <div class="mail-list" id="mail-list"></div>
        <div class="mail-detail" id="mail-detail">
          <div class="mail-empty"><div style="font-size:48px;">📭</div><div>${t('mail.no_select')}</div></div>
        </div>
      </div>`;
    this._refreshList(container);
    EventBus.on('state:changed', ({ key }) => {
      if (key === 'pendingEmails') this._refreshList(container);
    });
  },

  _refreshList(container) {
    const emails = GameState.get('pendingEmails') || [];
    const list = container.querySelector('#mail-list');
    const badge = container.querySelector('#mail-unread-badge');
    if (!list) return;
    const unread = emails.filter(e => !e.read).length;
    if (badge) badge.textContent = unread || '';

    list.innerHTML = emails.length === 0
      ? `<div class="mail-empty" style="height:100%;"><div style="font-size:32px;">📭</div><div>${t('mail.no_email')}</div></div>`
      : emails.map((e, i) => {
          const isExpired = e.expiresAfterWeek && e.received < GameState.get('week');
          return `
            <div class="mail-item ${e.read ? '' : 'unread'} ${this._selectedId === e.id ? 'selected' : ''}" data-idx="${i}">
              <div style="display:flex;justify-content:space-between;align-items:flex-start;">
                <div class="mail-item-from">${e.fromShort || e.from}</div>
                <div class="mail-item-date">${t('mail.week_label', { n: e.received })}</div>
              </div>
              <div class="mail-item-subject">${e.subject}${isExpired ? '<span class="mail-badge-expired"> ⏰</span>' : ''}</div>
              <div class="mail-item-preview">${(e.body || '').slice(0, 60)}...</div>
            </div>`;
        }).join('');

    list.querySelectorAll('.mail-item').forEach(item => {
      item.onclick = () => this._selectEmail(container, parseInt(item.dataset.idx));
    });
  },

  _selectEmail(container, idx) {
    const emails = GameState.get('pendingEmails') || [];
    const email = emails[idx];
    if (!email) return;
    this._selectedId = email.id;
    emails[idx].read = true;
    GameState.set('pendingEmails', emails);

    const detail = container.querySelector('#mail-detail');
    const expired = email.expiresAfterWeek && email.received < GameState.get('week');
    const playerName = GameState.get('playerName') || '创业者';

    detail.innerHTML = `
      <div class="mail-detail-header">
        <div class="mail-detail-subject">${email.subject}</div>
        <div class="mail-detail-meta">
          <div class="mail-detail-avatar">${email.avatar || '📧'}</div>
          <div class="mail-detail-meta-text">
            <div class="from">${email.from}</div>
            <div class="to">${t('mail.to', { name: playerName, email: 'me@opc.com' })} · ${t('mail.week_label', { n: email.received })}</div>
          </div>
        </div>
      </div>
      <div class="mail-body">${(email.body || '').replace(/\n/g, '<br>')}</div>
      ${email.type === 'A' && email.narrative ? `<div style="margin-top:16px;padding:10px 14px;background:rgba(52,199,89,0.08);border-radius:8px;font-size:13px;color:var(--text-secondary);">${email.narrative}</div>` : ''}
      ${email.requiresAck && !email.acknowledged ? `
        <div class="mail-actions">
          <div style="font-size:13px;color:var(--text-secondary);margin-bottom:10px;">${t('mail.ack_hint')}</div>
          <button class="mail-action-btn primary" id="mail-ack-btn">${t('mail.ack_btn')}</button>
        </div>` : ''}
      ${email.acknowledged ? `<div style="margin-top:12px;padding:10px 14px;background:rgba(52,199,89,0.08);border-radius:8px;font-size:13px;color:#1a7a3f;">${t('mail.ack_done')}</div>` : ''}
      ${(email.type === 'B' || email.type === 'C') && !email.requiresAck ? `
        <div class="mail-actions">
          ${expired
            ? `<div style="font-size:13px;color:var(--danger);">${t('mail.expired')}</div>`
            : (email.choices || []).map((c, ci) => `
                <button class="mail-action-btn ${ci === 0 ? 'primary' : 'secondary'}" data-choice="${ci}">${c.label}</button>`).join('')
          }
        </div>` : ''}`;

    if (email.requiresAck && !email.acknowledged) {
      detail.querySelector('#mail-ack-btn')?.addEventListener('click', () => {
        this._acknowledgeTermination(email.id, container);
      });
    }

    if (!expired && email.choices && !email.requiresAck) {
      detail.querySelectorAll('[data-choice]').forEach(btn => {
        btn.onclick = () => this._handleChoice(email.id, parseInt(btn.dataset.choice), container);
      });
    }
    this._refreshList(container);
  },

  _acknowledgeTermination(emailId, container) {
    const emails = GameState.get('pendingEmails') || [];
    const emailIdx = emails.findIndex(e => e.id === emailId);
    if (emailIdx < 0) return;

    GameState.set('cash', (GameState.get('cash') || 0) + 47200);
    emails[emailIdx].acknowledged = true;
    GameState.set('pendingEmails', emails);

    const ms = GameState.get('milestones');
    ms.terminationAcknowledged = true;
    GameState.set('milestones', ms);

    TodoApp.addTodo({
      title: getLang() === 'en' ? 'Think about what to do next' : '思考接下来做什么',
      source: 'system',
      priority: 'high'
    });

    NotificationSystem.show('💰', t('mail.cash_received'), 4000);

    setTimeout(() => {
      iMessageApp.triggerOnboarding();
    }, 2000);

    this._selectEmail(container, emailIdx);
    this._refreshList(container);
  },

  _handleChoice(emailId, choiceIdx, container) {
    const emails = GameState.get('pendingEmails') || [];
    const emailIdx = emails.findIndex(e => e.id === emailId);
    if (emailIdx < 0) return;
    const email = emails[emailIdx];
    const choice = email.choices?.[choiceIdx];
    if (!choice) return;

    const effect = choice.effect || {};
    Object.entries(effect).forEach(([k, v]) => {
      if (k === 'vcOffersDeclined') {
        const c = (GameState.get('vcOffersDeclined') || 0) + 1;
        GameState.set('vcOffersDeclined', c);
        if (c >= 3) {
          const ach = GameState.get('achievements');
          if (!ach.includes('断舍离')) {
            ach.push('断舍离');
            GameState.set('achievements', ach);
            NotificationSystem.show(t('notif.achievement'), t('ach.断舍离'), 5000);
          }
        }
      } else if (typeof v === 'number') {
        GameState.set(k, Math.max(0, (GameState.get(k) || 0) + v));
      }
    });

    if (choice.milestone) {
      const ms = GameState.get('milestones');
      ms[choice.milestone] = true;
      GameState.set('milestones', ms);
      NotificationSystem.show('🎉', getLang() === 'en' ? 'First paying client!' : '第一个付费客户！', 5000);
      if (!GameState.get('unlockedApps').includes('safari')) {
        DockManager.unlock('safari');
        NotificationSystem.show('🔓 Safari', t('notif.safari_unlocked'), 4000);
      }
    }

    const profile = GameState.get('playerProfile');
    profile.actions.push({ week: GameState.get('week'), type: choice.log, detail: choice.desc });
    GameState.set('playerProfile', profile);

    emails[emailIdx].choices = null;
    emails[emailIdx].body += `\n\n---\n${t('mail.you_chose', { label: choice.label })}\n${choice.desc}`;
    GameState.set('pendingEmails', emails);

    NotificationSystem.show('📧 Mail', choice.desc, 4000);
    this._selectEmail(container, emailIdx);
  }
};
