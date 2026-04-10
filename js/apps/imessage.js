'use strict';

// ===== 王子墨 system prompt (language-aware) =====
function getWangzimoSystem() {
  const playerName = GameState.get('playerName') || (getLang() === 'en' ? 'you' : '你');
  const day = GameState.get('day') || 1;
  const cash = GameState.get('cash') || 0;

  if (getLang() === 'en') {
    return `You are Wang Zimo, an old friend of ${playerName} from their BigCorp days.
Background: indie developer, technical, working on small side projects. You know the startup world casually, but you are NOT an expert or advisor.
Current game context: ${playerName} was just laid off (Day ${day}). They have ¥${cash.toLocaleString()} left.
Personality: warm, grounded, occasionally playful, never preachy or formal.

[NON-NEGOTIABLE RULES]
1. You are WANG ZIMO — a friend, not a startup coach. Never give formal business advice.
2. You ONLY talk about: emotional support, casual life stuff, sharing what friends/contacts you know, recommending resources you've heard of.
3. If asked for professional advice (pricing, marketing, growth strategy, legal, finance, coding): 
   Say something like "haha I'm not the right person to ask, maybe try Lenny?" or "I barely know my own stuff, don't trust me on that"
4. Keep every reply under 3 sentences. Short and text-like.
5. Stay in character — you're texting a friend, not writing an email.
6. Never break character or acknowledge being an AI.`;
  }

  return `你是王子墨，${playerName} 在 BigCorp 时期的老朋友。
背景：技术出身的独立开发者，自己做一些小项目。你了解创业圈，但你不是专家，更不是导师。
当前状况：${playerName} 刚被裁员（第 ${day} 天），账上还有 ¥${cash.toLocaleString()}。
性格：温暖、接地气、偶尔调皮，绝不说教，绝不正式。

【不可违背的规则】
1. 你是王子墨——一个朋友，不是创业教练。绝对不要给正式的商业建议。
2. 你只聊：情感支持、日常生活、你认识的人/资源推荐、对方最近的状态。
3. 如果被问到专业问题（定价、增长策略、法律、技术架构、融资）：
   用朋友的口吻说「哈哈这个你别问我，我也不懂」或「这种事去问 Lenny 吧，他才是行家」
4. 每条回复不超过 3 句，短小自然，像发 Telegram 一样。
5. 保持角色——你在给朋友发消息，不是写报告。
6. 绝对不要出戏或承认自己是 AI。`;
}

// ===== 王子墨触发消息 (language-aware) =====
function getWangzimoTriggers() {
  if (getLang() === 'en') {
    return {
      onboarding_comfort: [
        'Hey, heard you got laid off?',
        'You okay? BigCorp laid off a lot of people lately, you\'re not alone.',
        'Honestly, it might be the best thing that happened to you.'
      ],
      onboarding_lenny: [
        'Oh btw — have you heard of Lenny Rachitsky?',
        'He was a PM at Airbnb, now runs a podcast all about product and startups. Super useful for where you\'re at.',
        'Search "Lenny Rachitsky" in Safari — he\'s pretty accessible on X. Lots of people DM him and actually get a reply.'
      ],
      first_income: '!!!!\nCongrats!!! 🎉🎉🎉',
      low_cash: 'You doing okay?\nLet me know if you need to grab lunch, my treat',
      inactive_3days: 'Hey\nDon\'t disappear on me',
      week3_checkin: 'How\'s it going this week? Fill me in?',
    };
  }
  return {
    onboarding_comfort: [
      '嘿，听说你被裁了？',
      '还好吗？BigCorp 最近裁了好多人，不只是你。',
      '我知道这会让你有点懵，但说真的，说不定是好事。'
    ],
    onboarding_lenny: [
      '对了，你做产品这么多年，有没有听过 Lenny Rachitsky？',
      '他之前在 Airbnb 做 PM，现在做播客和 Newsletter，专门聊产品和创业，干货很多。',
      '你可以用 Safari 搜一下「Lenny Rachitsky」，他在 X 上很活跃，很多创业者私信过他，回复率挺高的。'
    ],
    first_income: '！！！！\n恭喜啊！！\n🎉🎉🎉',
    low_cash: '最近还好吗\n要不要出来吃个饭，我请',
    inactive_3days: '在吗\n别把自己搞消失了啊',
    week3_checkin: '这周进展怎么样，给我说说？',
  };
}

// ===== TelegramApp =====
const iMessageApp = {  // keep global name for compatibility
  _activeContactId: 'wangzimo',
  _container: null,

  _getWangzimoContact() {
    return {
      id: 'wangzimo',
      name: '王子墨',
      emoji: '👨‍💻',
      subtitle: getLang() === 'en' ? 'Old friend · Indie dev' : '老朋友 · 独立开发者',
      isAI: true,
      systemPrompt: getWangzimoSystem()
    };
  },

  _getExpertContacts() {
    const discovered = GameState.get('discoveredExperts') || {};
    const added = GameState.get('addedContacts') || [];
    return EXPERTS.filter(e =>
      added.includes(e.id) ||
      discovered[e.id]?.channel === 'imessage_referral' ||
      discovered[e.id]?.channel === 'referral'
    ).map(e => ({
      id: e.id,
      name: e.name,
      emoji: e.avatarEmoji || '👤',
      subtitle: e.title,
      isAI: true,
      isExpert: true
    }));
  },

  render(container) {
    this._container = container;
    const allContacts = [this._getWangzimoContact(), ...this._getExpertContacts()];

    container.innerHTML = `
      <div style="display:flex;height:100%;background:#f5f5f7;">
        <div style="width:240px;background:rgba(255,255,255,0.95);border-right:1px solid var(--border);display:flex;flex-direction:column;flex-shrink:0;">
          <div style="padding:14px 16px 10px;font-size:15px;font-weight:700;color:var(--text-primary);border-bottom:1px solid var(--border);">
            Telegram
          </div>
          <div style="flex:1;overflow-y:auto;" id="imsg-contact-list"></div>
        </div>
        <div style="flex:1;display:flex;flex-direction:column;" id="imsg-chat-area">
          <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;gap:10px;color:var(--text-secondary);">
            <div style="font-size:40px;">💬</div>
            <div style="font-size:14px;font-weight:600;">${t('tg.select_hint')}</div>
          </div>
        </div>
      </div>`;

    this._renderContacts(container, allContacts);

    const msgs = this._getMessages('wangzimo');
    if (msgs.length > 0) {
      this._activeContactId = 'wangzimo';
      this._renderContacts(container, allContacts);
      this._openChat(container, this._getWangzimoContact());
    }
  },

  _renderContacts(container, contacts) {
    const list = container.querySelector('#imsg-contact-list');
    if (!list) return;
    list.innerHTML = contacts.map(c => {
      const msgs = this._getMessages(c.id);
      const lastMsg = msgs[msgs.length - 1];
      const unread = msgs.filter(m => !m.read && m.role === 'assistant').length;
      const isActive = this._activeContactId === c.id;
      return `
        <div class="imsg-contact-item ${isActive ? 'active' : ''}" data-contact-id="${c.id}"
          style="padding:10px 14px;display:flex;align-items:center;gap:10px;cursor:pointer;
                 background:${isActive ? 'rgba(0,122,255,0.1)' : 'transparent'};
                 border-bottom:1px solid rgba(0,0,0,0.04);transition:background 0.1s;">
          <div style="width:38px;height:38px;border-radius:50%;background:linear-gradient(135deg,#007aff,#5856d6);
                      display:flex;align-items:center;justify-content:center;font-size:20px;flex-shrink:0;position:relative;">
            ${c.emoji}
            ${unread > 0 ? `<div style="position:absolute;top:-2px;right:-2px;width:16px;height:16px;background:#ff3b30;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:9px;color:#fff;font-weight:700;">${unread}</div>` : ''}
          </div>
          <div style="flex:1;min-width:0;">
            <div style="font-size:13px;font-weight:600;color:var(--text-primary);margin-bottom:2px;">${c.name}</div>
            <div style="font-size:11px;color:var(--text-secondary);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">
              ${lastMsg ? lastMsg.content.slice(0, 35) + (lastMsg.content.length > 35 ? '…' : '') : c.subtitle}
            </div>
          </div>
        </div>`;
    }).join('');

    list.querySelectorAll('.imsg-contact-item').forEach(item => {
      item.onclick = () => {
        this._activeContactId = item.dataset.contactId;
        const contact = contacts.find(c => c.id === item.dataset.contactId);
        if (contact) {
          this._renderContacts(container, contacts);
          this._openChat(container, contact);
        }
      };
    });
  },

  _openChat(container, contact) {
    const chatArea = container.querySelector('#imsg-chat-area');
    if (!chatArea) return;
    const hasAI = AIConfig.hasKey();
    const added = (GameState.get('addedContacts') || []).includes(contact.id);

    chatArea.innerHTML = `
      <div style="padding:12px 16px;border-bottom:1px solid var(--border);display:flex;align-items:center;gap:10px;background:rgba(255,255,255,0.95);flex-shrink:0;">
        <div style="width:34px;height:34px;border-radius:50%;background:linear-gradient(135deg,#007aff,#5856d6);
                    display:flex;align-items:center;justify-content:center;font-size:18px;">${contact.emoji}</div>
        <div>
          <div style="font-size:14px;font-weight:700;">${contact.name}</div>
          <div style="font-size:11px;color:var(--text-secondary);">${contact.subtitle}</div>
        </div>
        ${contact.isExpert ? `
        <button onclick="iMessageApp._addExpertContact('${contact.id}')"
          style="margin-left:auto;padding:5px 12px;background:${added ? 'rgba(52,199,89,0.1)' : 'var(--accent)'};
                 color:${added ? '#1a7a3f' : '#fff'};border:none;border-radius:7px;font-size:12px;
                 font-weight:600;cursor:pointer;font-family:var(--font-system);">
          ${added ? t('tg.already_added') : t('tg.add_to_messages')}
        </button>` : ''}
      </div>
      <div style="flex:1;overflow-y:auto;padding:16px;display:flex;flex-direction:column;gap:2px;" id="imsg-messages"></div>
      <div style="padding:10px 14px;border-top:1px solid var(--border);background:rgba(255,255,255,0.95);flex-shrink:0;">
        <div style="display:flex;align-items:center;gap:8px;background:rgba(0,0,0,0.06);border-radius:20px;padding:6px 12px;">
          <input type="text" id="imsg-input" placeholder="${t('tg.input_placeholder')}"
            style="flex:1;background:transparent;border:none;outline:none;font-size:14px;font-family:var(--font-system);"
            ${!hasAI ? 'disabled' : ''}>
          <button id="imsg-send" style="background:none;border:none;cursor:pointer;font-size:18px;color:var(--accent);padding:0;line-height:1;"
            ${!hasAI ? 'disabled' : ''}>↑</button>
        </div>
        ${!hasAI ? `<div style="font-size:11px;color:var(--text-secondary);margin-top:5px;text-align:center;">
          ${t('tg.need_ai')} <span style="color:var(--accent);cursor:pointer;" onclick="DockManager.launchApp('settings')">${t('tg.go_settings')}</span>
        </div>` : ''}
      </div>`;

    this._renderMessages(chatArea, contact);

    const input = chatArea.querySelector('#imsg-input');
    const sendBtn = chatArea.querySelector('#imsg-send');
    if (input && sendBtn) {
      const send = () => {
        const text = input.value.trim();
        if (!text || !hasAI) return;
        input.value = '';
        this._sendMessage(chatArea, contact, text);
      };
      sendBtn.onclick = send;
      input.onkeydown = e => { if (e.key === 'Enter') send(); };
      setTimeout(() => input.focus(), 50);
    }

    const msgs = this._getMessages(contact.id);
    msgs.forEach(m => { m.read = true; });
    this._saveMessages(contact.id, msgs);
  },

  _renderMessages(chatArea, contact) {
    const msgContainer = chatArea.querySelector('#imsg-messages');
    if (!msgContainer) return;
    const msgs = this._getMessages(contact.id);

    if (msgs.length === 0) {
      msgContainer.innerHTML = `
        <div style="text-align:center;margin-top:40px;color:var(--text-secondary);">
          <div style="font-size:36px;margin-bottom:8px;">${contact.emoji}</div>
          <div style="font-size:13px;font-weight:600;">${contact.name}</div>
          <div style="font-size:11px;margin-top:4px;">${contact.subtitle}</div>
        </div>`;
      return;
    }

    msgContainer.innerHTML = msgs.map(m => {
      const isUser = m.role === 'user';
      const expertCard = m.expertCard ? this._renderExpertCard(m.expertCard) : '';
      return `
        <div style="display:flex;justify-content:${isUser ? 'flex-end' : 'flex-start'};margin:3px 0;">
          <div style="max-width:72%;padding:8px 12px;
                      border-radius:${isUser ? '18px 18px 4px 18px' : '18px 18px 18px 4px'};
                      background:${isUser ? '#007aff' : 'rgba(230,230,235,0.9)'};
                      color:${isUser ? '#fff' : 'var(--text-primary)'};
                      font-size:14px;line-height:1.5;word-break:break-word;white-space:pre-wrap;">
            ${m.content}
          </div>
        </div>
        ${expertCard}`;
    }).join('');

    msgContainer.scrollTop = msgContainer.scrollHeight;
  },

  _renderExpertCard(expertId) {
    const expert = EXPERTS.find(e => e.id === expertId);
    if (!expert) return '';
    const added = (GameState.get('addedContacts') || []).includes(expertId);
    const addLabel = added ? t('tg.already_added') : t('tg.add_to_messages');
    const addStyle = added
      ? 'background:rgba(52,199,89,0.1);color:#1a7a3f;'
      : 'background:var(--accent);color:#fff;';
    return `
      <div style="display:flex;justify-content:flex-start;margin:6px 0;">
        <div style="max-width:80%;background:#fff;border:1px solid var(--border);border-radius:14px;padding:12px 14px;box-shadow:0 2px 8px rgba(0,0,0,0.06);">
          <div style="display:flex;align-items:center;gap:10px;margin-bottom:8px;">
            <div style="width:36px;height:36px;border-radius:50%;background:rgba(0,0,0,0.06);display:flex;align-items:center;justify-content:center;font-size:20px;">${expert.avatarEmoji}</div>
            <div>
              <div style="font-size:13px;font-weight:700;">${expert.name}</div>
              <div style="font-size:11px;color:var(--text-secondary);">${expert.title}</div>
            </div>
          </div>
          <div style="font-size:12px;color:var(--text-secondary);margin-bottom:10px;line-height:1.5;">${expert.expertise.slice(0,3).join(' · ')}</div>
          <button data-add-expert="${expertId}" onclick="iMessageApp._addExpertContact('${expertId}')"
            style="width:100%;padding:8px;${addStyle}border:none;border-radius:8px;font-size:13px;font-weight:600;cursor:pointer;font-family:var(--font-system);transition:opacity 0.15s;">
            ${addLabel}
          </button>
        </div>
      </div>`;
  },

  async _sendMessage(chatArea, contact, text) {
    if (!AIConfig.hasKey()) return;
    const msgs = this._getMessages(contact.id);
    msgs.push({ role: 'user', content: text, read: true, ts: Date.now() });
    this._saveMessages(contact.id, msgs);
    this._renderMessages(chatArea, contact);

    const msgContainer = chatArea.querySelector('#imsg-messages');
    const typingEl = document.createElement('div');
    typingEl.id = 'imsg-typing';
    typingEl.style.cssText = 'display:flex;justify-content:flex-start;margin:3px 0;';
    typingEl.innerHTML = `
      <div style="padding:10px 14px;border-radius:18px 18px 18px 4px;background:rgba(230,230,235,0.9);">
        <div class="msg-typing-dots"><div class="msg-typing-dot"></div><div class="msg-typing-dot"></div><div class="msg-typing-dot"></div></div>
      </div>`;
    if (msgContainer) { msgContainer.appendChild(typingEl); msgContainer.scrollTop = msgContainer.scrollHeight; }

    const input = chatArea.querySelector('#imsg-input');
    const sendBtn = chatArea.querySelector('#imsg-send');
    if (input) input.disabled = true;
    if (sendBtn) sendBtn.disabled = true;

    let response = null;
    try {
      let systemPrompt, history;
      if (contact.isExpert || contact.id === 'wangzimo') {
        systemPrompt = NPCManager.buildPrompt(contact.id, text);
        const mem = NPCManager.getMemory(contact.id);
        history = mem.recentMessages.slice(-6).map(m => ({ role: m.role, content: m.content }));
      } else {
        systemPrompt = getWangzimoSystem();
        history = msgs.slice(-8).map(m => ({ role: m.role, content: m.content }));
      }
      response = await AIConfig.chat(systemPrompt, [...history.slice(0, -1), { role: 'user', content: text }]);
    } catch (e) { console.error('Telegram AI error:', e); }

    chatArea.querySelector('#imsg-typing')?.remove();
    if (!response) response = t('msg.ai_error');

    const updatedMsgs = this._getMessages(contact.id);
    updatedMsgs.push({ role: 'assistant', content: response, read: true, ts: Date.now() });
    this._saveMessages(contact.id, updatedMsgs);

    // persist to NPCManager memory + trigger async updates
    NPCManager.appendMessage(contact.id, 'user', text);
    NPCManager.appendMessage(contact.id, 'assistant', response);
    NPCManager.increaseTrust(contact.id, 2);
    if (response !== t('msg.ai_error')) {
      NPCManager.updateMemoryAfterChat(contact.id, text, response);
      NPCManager.checkMissionProgress(contact.id, text, response);
      NPCManager.checkReferralTrigger(contact.id, text);
    }

    ActivityLogger.log('message', { expertId: contact.id, topic: text.slice(0, 30), channel: 'telegram' });

    if (input) { input.disabled = false; input.focus(); }
    if (sendBtn) sendBtn.disabled = false;
    this._renderMessages(chatArea, contact);
  },

  pushMessage(contactId, content, opts = {}) {
    const msgs = this._getMessages(contactId);
    const entry = { role: 'assistant', content, read: false, ts: Date.now() };
    if (opts.expertCard) entry.expertCard = opts.expertCard;
    msgs.push(entry);
    this._saveMessages(contactId, msgs);

    const dockItem = document.querySelector('.dock-item[data-app-id="imessage"]');
    if (dockItem) dockItem.querySelector('.dock-dot')?.classList.add('active');

    const contactDef = contactId === 'wangzimo' ? this._getWangzimoContact() : EXPERTS.find(e => e.id === contactId);
    const name = contactDef?.name || contactId;
    NotificationSystem.show(`💬 ${name}`, content.slice(0, 60), 5000);

    if (opts.addTodo && typeof TodoApp !== 'undefined') {
      TodoApp.addTodo(opts.addTodo);
    }
  },

  _addExpertContact(expertId) {
    const added = GameState.get('addedContacts') || [];
    if (added.includes(expertId)) return;
    added.push(expertId);
    GameState.set('addedContacts', added);

    const expert = EXPERTS.find(e => e.id === expertId);
    NotificationSystem.show('✅ Messages', t('notif.expert_added', { name: expert?.name || expertId }), 3000);

    if (added.length === 1) {
      DockManager.unlock('contacts');
      NotificationSystem.show('🔓', t('notif.contacts_unlocked'), 3000);
    }

    if (this._container?.isConnected) this.render(this._container);
    EventBus.emit('expert:added', { expertId });
  },

  _getMessages(contactId) {
    return SaveSystem.load('imsg_' + contactId) || [];
  },

  _saveMessages(contactId, msgs) {
    SaveSystem.save('imsg_' + contactId, msgs);
  },

  // Onboarding: comfort → lenny intro → directly push Lenny card (no asking)
  triggerOnboarding() {
    const delay = ms => new Promise(r => setTimeout(r, ms));
    (async () => {
      const triggers = getWangzimoTriggers();
      await delay(1200);
      for (const line of triggers.onboarding_comfort) {
        this.pushMessage('wangzimo', line);
        await delay(1800);
      }
      await delay(2000);
      for (const line of triggers.onboarding_lenny) {
        this.pushMessage('wangzimo', line);
        await delay(2200);
      }
      // Unlock Safari now so player can search for Lenny
      await delay(600);
      DockManager.unlock('safari');
      const safariHint = getLang() === 'en'
        ? 'Safari is now unlocked — try searching for Lenny there!'
        : 'Safari 已解锁，去搜索 Lenny 吧！';
      NotificationSystem.show('🌐 Safari', safariHint, 5000);

      TodoApp.addTodo({
        title: getLang() === 'en' ? 'Search "Lenny Rachitsky" in Safari and DM him on X' : '在 Safari 搜索「Lenny Rachitsky」并在 X 上私信他',
        source: 'telegram',
        priority: 'high'
      });

      // Auto-open Safari after a short delay
      await delay(1500);
      DockManager.launchApp('safari');
    })();
  },

  checkTriggers() {
    const state = GameState.getAll();
    const msgs = this._getMessages('wangzimo');
    const triggers = getWangzimoTriggers();
    if (state.cash < 15000 && !msgs.find(m => m.content.includes('吃个饭') || m.content.includes('lunch'))) {
      this.pushMessage('wangzimo', triggers.low_cash);
    }
    if (state.milestones?.firstIncome && !msgs.find(m => m.content.includes('恭喜') || m.content.includes('Congrats'))) {
      this.pushMessage('wangzimo', triggers.first_income);
    }
  }
};
