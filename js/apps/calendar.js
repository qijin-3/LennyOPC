'use strict';

// CalendarApp — read-only timeline view of todos that have a scheduled week
const CalendarApp = {
  render(container) {
    this._container = container;
    this._draw(container);

    EventBus.on('todo:add', () => { if (container.isConnected) this._draw(container); });
    EventBus.on('state:changed', ({ key }) => {
      if (key === 'week' && container.isConnected) this._draw(container);
    });
  },

  _draw(container) {
    const currentWeek = GameState.get('week') || 1;
    const todos = (SaveSystem.load('todos') || []).filter(t => t.scheduledWeek || t.dueWeek);

    // Group by week
    const byWeek = {};
    todos.forEach(t => {
      const w = t.scheduledWeek || t.dueWeek;
      if (!byWeek[w]) byWeek[w] = [];
      byWeek[w].push(t);
    });

    // Show current week ± 3
    const weeksToShow = [];
    for (let w = Math.max(1, currentWeek - 1); w <= currentWeek + 4; w++) {
      weeksToShow.push(w);
    }

    container.innerHTML = `
      <div style="display:flex;flex-direction:column;height:100%;background:#f5f5f7;">
        <!-- Header -->
        <div style="padding:16px 20px 12px;background:rgba(255,255,255,0.95);border-bottom:1px solid var(--border);flex-shrink:0;">
          <div style="font-size:18px;font-weight:700;color:var(--text-primary);margin-bottom:2px;">
            ${t('app.calendar')} — ${t('week.label', { n: currentWeek })}
          </div>
          <div style="font-size:12px;color:var(--text-secondary);">
            ${t('cal.events_hint')}
          </div>
        </div>
        <!-- Timeline -->
        <div style="flex:1;overflow-y:auto;padding:16px 20px;" id="cal-timeline">
          ${weeksToShow.map(w => this._renderWeekBlock(w, byWeek[w] || [], currentWeek)).join('')}
          ${todos.length === 0 ? `
            <div style="text-align:center;padding:60px 0;color:var(--text-secondary);">
              <div style="font-size:40px;margin-bottom:12px;">📅</div>
              <div style="font-size:14px;font-weight:600;margin-bottom:6px;">${t('cal.no_events')}</div>
              <div style="font-size:12px;">${getLang() === 'en'
                ? 'Add a due date to your todos and they\'ll appear here'
                : '在待办事项中设置到期周，将会显示在这里'}</div>
            </div>` : ''}
        </div>
      </div>`;

    // Click on todo item → open Todo app
    container.querySelectorAll('[data-open-todo]').forEach(el => {
      el.onclick = () => DockManager.launchApp('todo');
    });
  },

  _renderWeekBlock(week, todos, currentWeek) {
    const isPast = week < currentWeek;
    const isCurrent = week === currentWeek;
    const dayLabels = getLang() === 'en'
      ? ['Mon','Tue','Wed','Thu','Fri']
      : ['周一','周二','周三','周四','周五'];

    const headerColor = isCurrent ? 'var(--accent)' : isPast ? 'var(--text-secondary)' : 'var(--text-primary)';
    const headerBg = isCurrent ? 'rgba(0,122,255,0.06)' : 'transparent';

    return `
      <div style="margin-bottom:20px;">
        <!-- Week label -->
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:10px;">
          <div style="font-size:13px;font-weight:700;color:${headerColor};
                      background:${headerBg};padding:4px 10px;border-radius:6px;
                      ${isCurrent ? 'border:1px solid rgba(0,122,255,0.2);' : ''}">
            ${t('week.label', { n: week })}
            ${isCurrent ? ` <span style="font-size:10px;background:var(--accent);color:#fff;padding:1px 6px;border-radius:10px;margin-left:4px;">${getLang() === 'en' ? 'NOW' : '本周'}</span>` : ''}
          </div>
          ${isPast ? `<div style="font-size:11px;color:var(--text-secondary);">${getLang() === 'en' ? 'Past' : '已过'}</div>` : ''}
        </div>
        <!-- Day grid -->
        <div style="display:grid;grid-template-columns:repeat(5,1fr);gap:6px;">
          ${dayLabels.map((day, dayIdx) => {
            // Distribute todos across Mon-Fri for visual representation
            const dayTodos = todos.filter((_, i) => i % 5 === dayIdx);
            return `
              <div style="background:#fff;border-radius:8px;border:1px solid ${isCurrent ? 'rgba(0,122,255,0.15)' : 'var(--border)'};
                          min-height:72px;padding:8px 8px 6px;position:relative;overflow:hidden;">
                <div style="font-size:10px;font-weight:600;color:var(--text-secondary);margin-bottom:6px;">${day}</div>
                ${dayTodos.map(td => this._renderTodoChip(td, isPast)).join('')}
              </div>`;
          }).join('')}
        </div>
        <!-- Also list todos below for clarity -->
        ${todos.length > 0 ? `
          <div style="margin-top:8px;display:flex;flex-direction:column;gap:4px;">
            ${todos.map(td => `
              <div data-open-todo="1" style="display:flex;align-items:center;gap:8px;padding:8px 12px;
                   background:#fff;border-radius:8px;border:1px solid var(--border);cursor:pointer;
                   opacity:${td.completed ? '0.5' : '1'};
                   border-left:3px solid ${this._priorityColor(td.priority)};">
                <span style="font-size:14px;">${td.completed ? '✅' : this._priorityIcon(td.priority)}</span>
                <div style="flex:1;min-width:0;">
                  <div style="font-size:13px;font-weight:600;text-decoration:${td.completed ? 'line-through' : 'none'};
                               white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${td.title}</div>
                  ${td.npcId ? `<div style="font-size:11px;color:var(--text-secondary);">🤝 ${getLang() === 'en' ? 'Promised to' : '承诺给'} ${this._getNpcName(td.npcId)}</div>` : ''}
                </div>
                ${isPast && !td.completed ? `<span style="font-size:11px;color:#ff3b30;font-weight:600;">⚠️ ${getLang() === 'en' ? 'Overdue' : '逾期'}</span>` : ''}
              </div>`).join('')}
          </div>` : ''}
      </div>`;
  },

  _renderTodoChip(td, isPast) {
    const overdue = isPast && !td.completed;
    return `
      <div data-open-todo="1" title="${td.title}" style="
        font-size:9px;padding:2px 5px;border-radius:4px;margin-bottom:2px;cursor:pointer;
        background:${overdue ? 'rgba(255,59,48,0.12)' : td.completed ? 'rgba(52,199,89,0.1)' : 'rgba(0,122,255,0.08)'};
        color:${overdue ? '#c00' : td.completed ? '#1a7a3f' : 'var(--accent)'};
        white-space:nowrap;overflow:hidden;text-overflow:ellipsis;line-height:1.4;
        border-left:2px solid ${this._priorityColor(td.priority)};">
        ${td.title.slice(0, 14)}${td.title.length > 14 ? '…' : ''}
      </div>`;
  },

  _priorityColor(p) {
    return p === 'high' ? '#ff3b30' : p === 'low' ? '#34c759' : '#ff9500';
  },

  _priorityIcon(p) {
    return p === 'high' ? '🔴' : p === 'low' ? '🟢' : '🟡';
  },

  _getNpcName(npcId) {
    if (npcId === 'wangzimo') return '王子墨';
    const expert = (typeof EXPERTS !== 'undefined') ? EXPERTS.find(e => e.id === npcId) : null;
    return expert?.name || npcId;
  }
};
