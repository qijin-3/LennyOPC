'use strict';

// ===== MemoryManager =====
const MemoryManager = {
  getMemory(expertId) {
    const npcMemory = GameState.get('npcMemory') || {};
    return npcMemory[expertId] || {
      recentMessages: [],
      beliefs: [],
      relationship: t('rel.stranger'),
      trustScore: 20,
      lastInteraction: 0
    };
  },

  saveMemory(expertId, memory) {
    const npcMemory = GameState.get('npcMemory') || {};
    npcMemory[expertId] = memory;
    GameState.set('npcMemory', npcMemory);
  },

  addMessage(expertId, role, content) {
    const mem = this.getMemory(expertId);
    mem.recentMessages.push({ role, content });
    if (mem.recentMessages.length > 10) mem.recentMessages.shift();
    mem.lastInteraction = GameState.get('day') || 1;
    this.saveMemory(expertId, mem);
  },

  async updateBeliefs(expertId, insight) {
    const mem = this.getMemory(expertId);
    if (insight && mem.beliefs.length < 10 && !mem.beliefs.includes(insight)) {
      mem.beliefs.push(insight);
    }
    this.saveMemory(expertId, mem);
  },

  increaseTrust(expertId, amount = 5) {
    const mem = this.getMemory(expertId);
    mem.trustScore = Math.min(100, mem.trustScore + amount);
    const prev = mem.relationship;
    if (mem.trustScore >= 80) mem.relationship = t('rel.deep_partner');
    else if (mem.trustScore >= 60) mem.relationship = t('rel.collaborating');
    else if (mem.trustScore >= 40) mem.relationship = t('rel.acquaintance');
    else mem.relationship = t('rel.stranger');
    this.saveMemory(expertId, mem);
    if (prev !== mem.relationship) EventBus.emit('relationship:changed', { expertId, relationship: mem.relationship });
  },

  getRelationshipLabel(expertId) {
    return this.getMemory(expertId).relationship;
  }
};

// ===== PromptBuilder =====
const PromptBuilder = {
  build(expert, playerMessage) {
    const mem = MemoryManager.getMemory(expert.id);
    const state = GameState.getAll();
    const lang = getLang();

    const beliefsText = mem.beliefs.length > 0
      ? mem.beliefs.map(b => `- ${b}`).join('\n')
      : (lang === 'en'
          ? '- First conversation. I know very little about them yet.'
          : '- 这是我们第一次对话，我对他还了解不多。');

    const recentActivities = (state.recentActivity || []).slice(-5);
    const activityText = recentActivities.length > 0
      ? recentActivities.map(a => `- ${a.desc}`).join('\n')
      : (lang === 'en' ? '- No known recent activity.' : '- 暂无最近动态记录。');

    const knowledge = this._findRelevantKnowledge(expert, playerMessage);
    const knowledgeText = knowledge
      ? (lang === 'en'
          ? `Your own insight on this (from real content, use it as inspiration — don't quote verbatim):\n"${knowledge.fragment}"\n(Source: ${knowledge.source})`
          : `你在这方面的亲身洞察（来自真实内容，作为灵感参考，不要逐字引用）：\n"${knowledge.fragment}"\n（来源：${knowledge.source}）`)
      : '';

    // Expertise scope for boundary enforcement
    const expertiseList = (expert.expertise || []).join(', ') || (lang === 'en' ? 'my domain' : '我的专业领域');
    const boundaries = expert.boundaries || null;
    const boundaryNote = boundaries
      ? (lang === 'en' ? `Topics you DO NOT cover: ${boundaries.offTopic.join(', ')}` : `你明确不涵盖的话题：${boundaries.offTopic.join('、')}`)
      : '';

    // Build a description of the conversation context from recent messages
    const recentMsgs = mem.recentMessages.slice(-4);
    const contextSummary = recentMsgs.length >= 2
      ? (lang === 'en'
          ? `Recent conversation context (last ${recentMsgs.length} messages):\n` +
            recentMsgs.map(m => `  ${m.role === 'user' ? 'Them' : 'You'}: ${m.content.slice(0, 80)}`).join('\n')
          : `最近对话上下文（最近 ${recentMsgs.length} 条）：\n` +
            recentMsgs.map(m => `  ${m.role === 'user' ? '对方' : '你'}：${m.content.slice(0, 80)}`).join('\n'))
      : '';

    const relMap = {
      [t('rel.stranger')]:      lang === 'en' ? 'just met'            : '刚认识',
      [t('rel.acquaintance')]:  lang === 'en' ? 'know a bit'          : '有几次交流了',
      [t('rel.collaborating')]: lang === 'en' ? 'actively working together' : '正在合作中',
      [t('rel.deep_partner')]:  lang === 'en' ? 'long-term close partner'   : '深度合作伙伴'
    };
    const relDesc = relMap[mem.relationship] || (lang === 'en' ? 'just met' : '刚认识');

    if (lang === 'en') {
      return `You are ${expert.name} — ${expert.title}.
Personality & speaking style: ${expert.personality}

[WHO YOU ARE TALKING TO]
${state.playerName || 'Someone'} — recently laid off, building a One Person Company (OPC).
Your relationship: ${relDesc}

[WHAT YOU KNOW ABOUT THEM]
${beliefsText}

[THEIR RECENT MOVES YOU'VE HEARD ABOUT]
${activityText}

${contextSummary ? `[CONVERSATION CONTEXT]\n${contextSummary}\n` : ''}
${knowledgeText ? `[YOUR EXPERTISE ON THIS TOPIC]\n${knowledgeText}\n` : ''}
[YOUR EXPERTISE SCOPE]
You speak with genuine authority on: ${expertiseList}
${boundaryNote ? boundaryNote + '\n' : ''}
[HOW YOU RESPOND — NON-NEGOTIABLE RULES]
1. ALWAYS stay in character as ${expert.name}. Never break character, never say you are an AI.
2. ALWAYS reference the conversation context — if they mentioned something before, pick it up.
3. ALWAYS match your personality: ${expert.personality}
4. If the question is OUTSIDE your expertise (${expertiseList}):
   - Politely acknowledge you're not the right person for that
   - Redirect naturally: "That's more [relevant expert]'s territory" or "Honestly, I don't know enough about X to give good advice"
   - Do NOT make up information outside your expertise
5. Keep replies to 2-4 sentences — conversational, like a real person texting
6. Ask one natural follow-up question when it fits
7. Draw on your expertise and knowledge fragments; rephrase in your own voice, never quote verbatim
8. Reply in English`;
    }

    return `你是 ${expert.name}，${expert.title}。
性格与说话风格：${expert.personality}

【你在和谁对话】
${state.playerName || '对方'}——刚被大厂裁员，正在构建自己的一人公司（OPC）。
你们的关系：${relDesc}

【你对他的了解】
${beliefsText}

【他最近的动态（你所知道的）】
${activityText}

${contextSummary ? `【当前对话上下文】\n${contextSummary}\n` : ''}
${knowledgeText ? `【你在此话题的专业洞察】\n${knowledgeText}\n` : ''}
【你的专业边界】
你真正有发言权的领域：${expertiseList}
${boundaryNote ? boundaryNote + '\n' : ''}
【回复规则——必须严格遵守】
1. 始终以 ${expert.name} 的身份说话，绝不出戏，绝不承认自己是 AI。
2. 必须参考对话上下文——如果对方之前提到了什么，要自然地呼应它。
3. 保持你的人物性格：${expert.personality}
4. 如果问题超出你的专业范围（${expertiseList}）：
   - 坦诚地说你在这方面不是最好的人选
   - 自然地建议：「这个问题更适合去问 XXX」或「说实话，这块我了解不深，不太敢乱给建议」
   - 绝对不要在专业范围外编造信息
5. 回复 2-4 句话，口语化，像真人发消息，不要写成正式段落
6. 适时追问一个有意思的问题
7. 用你自己的语气和洞察来回答，不要逐字引用知识片段
8. 用中文回复`;
  },

  _findRelevantKnowledge(expert, message) {
    if (!expert.knowledge || !message) return null;
    const msgLower = message.toLowerCase();
    for (const k of expert.knowledge) {
      if (k.keywords.some(kw => msgLower.includes(kw.toLowerCase()))) return k;
    }
    return null;
  }
};

// ===== MessagesApp =====
const MessagesApp = {
  _activeExpertId: null,
  _container: null,

  render(container) {
    this._container = container;
    const experts = this._getAvailableExperts();
    container.innerHTML = `
      <div class="msg-layout">
        <div class="msg-sidebar">
          <div class="msg-sidebar-header">${t('msg.title')}</div>
          <div id="msg-contact-list"></div>
        </div>
        <div class="msg-chat" id="msg-chat-area">
          <div class="msg-empty">
            <div style="font-size:48px;">💬</div>
            <div style="font-size:15px;font-weight:600;">${t('msg.select_hint')}</div>
            <div style="font-size:13px;color:var(--text-weak);">${t('msg.discover_more')}</div>
          </div>
        </div>
      </div>`;
    this._renderContactList(container, experts);

    if (this._activeExpertId) {
      const expert = EXPERTS.find(e => e.id === this._activeExpertId);
      if (expert) this._openChat(container, expert);
    }
  },

  _getAvailableExperts() {
    const added = GameState.get('addedContacts') || [];
    return EXPERTS.filter(e => added.includes(e.id));
  },

  _renderContactList(container, experts) {
    const list = container.querySelector('#msg-contact-list');
    if (!list) return;
    if (experts.length === 0) {
      list.innerHTML = `<div style="padding:16px;font-size:13px;color:var(--text-secondary);line-height:1.6;">${t('msg.no_experts')}<br><br>${t('msg.discover_hint')}</div>`;
      return;
    }
    list.innerHTML = experts.map(e => {
      const mem = MemoryManager.getMemory(e.id);
      const isActive = this._activeExpertId === e.id;
      const lastMsg = mem.recentMessages[mem.recentMessages.length - 1];
      return `
        <div class="msg-contact ${isActive ? 'active' : ''}" data-expert-id="${e.id}">
          <div class="msg-contact-avatar">${e.avatarEmoji || '👤'}</div>
          <div class="msg-contact-info">
            <div class="msg-contact-name">${e.name}</div>
            <div class="msg-contact-preview">${lastMsg ? lastMsg.content.slice(0, 30) + '…' : (mem.relationship + ' · ' + t('msg.trust') + ' ' + mem.trustScore)}</div>
          </div>
        </div>`;
    }).join('');

    list.querySelectorAll('.msg-contact').forEach(item => {
      item.onclick = () => {
        this._activeExpertId = item.dataset.expertId;
        this._renderContactList(container, experts);
        this._openChat(container, EXPERTS.find(e => e.id === item.dataset.expertId));
      };
    });
  },

  _openChat(container, expert) {
    if (!expert) return;
    const chatArea = container.querySelector('#msg-chat-area');
    const mem = MemoryManager.getMemory(expert.id);
    const hasEnoughCash = GameState.get('cash') >= expert.consultFee;
    const canConsult = hasEnoughCash && mem.relationship !== t('rel.stranger');

    chatArea.innerHTML = `
      <div class="msg-chat-header">
        <div class="msg-chat-avatar">${expert.avatarEmoji || '👤'}</div>
        <div style="flex:1;">
          <div class="msg-chat-name">${expert.name}</div>
          <div class="msg-chat-title">${expert.title}</div>
        </div>
        <button class="msg-consult-btn" id="msg-consult-btn"
          ${canConsult ? '' : 'disabled'}
          title="${canConsult ? `¥${expert.consultFee}` : !hasEnoughCash ? t('msg.consult_no_money') : t('msg.consult_locked')}">
          ${canConsult ? t('msg.consult_btn', { fee: expert.consultFee }) : mem.relationship === t('rel.stranger') ? t('msg.consult_locked') : t('msg.consult_no_cash')}
        </button>
      </div>
      <div class="msg-messages" id="msg-messages"></div>`;

    if (!AIConfig.hasKey()) {
      chatArea.innerHTML += `
        <div style="padding:10px 16px;background:rgba(255,149,0,0.1);border-top:1px solid rgba(255,149,0,0.2);display:flex;align-items:center;gap:10px;flex-shrink:0;">
          <span style="font-size:13px;color:#c47000;">⚠️ ${t('msg.need_ai')}</span>
          <button onclick="DockManager.launchApp('settings')" style="padding:4px 10px;background:#ff9500;color:#fff;border:none;border-radius:6px;font-size:12px;cursor:pointer;font-weight:600;font-family:var(--font-system);">${t('msg.go_settings')}</button>
        </div>`;
    }

    chatArea.innerHTML += `
      <div class="msg-input-area">
        <textarea class="msg-input" id="msg-input" placeholder="${t('msg.input_placeholder', { name: expert.name })}" rows="1" ${!AIConfig.hasKey() ? 'disabled' : ''}></textarea>
        <button class="msg-send-btn" id="msg-send-btn" ${!AIConfig.hasKey() ? 'disabled' : ''}>↑</button>
      </div>`;

    this._renderMessages(chatArea, expert);

    const input = chatArea.querySelector('#msg-input');
    const sendBtn = chatArea.querySelector('#msg-send-btn');

    if (input && sendBtn) {
      const send = () => {
        const text = input.value.trim();
        if (!text || !AIConfig.hasKey()) return;
        input.value = '';
        input.style.height = 'auto';
        this._sendMessage(chatArea, expert, text);
      };
      sendBtn.onclick = send;
      input.onkeydown = e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } };
      input.oninput = () => { input.style.height = 'auto'; input.style.height = Math.min(input.scrollHeight, 80) + 'px'; };
    }

    const consultBtn = chatArea.querySelector('#msg-consult-btn');
    if (consultBtn) consultBtn.onclick = () => { if (canConsult) this._initiateConsult(container, expert); };
  },

  _renderMessages(chatArea, expert) {
    const msgContainer = chatArea.querySelector('#msg-messages');
    if (!msgContainer) return;
    const mem = MemoryManager.getMemory(expert.id);
    const msgs = mem.recentMessages;

    if (msgs.length === 0) {
      msgContainer.innerHTML = `
        <div style="text-align:center;padding:24px 16px;color:var(--text-secondary);font-size:13px;">
          <div style="font-size:36px;margin-bottom:8px;">${expert.avatarEmoji || '👤'}</div>
          <div style="font-weight:600;margin-bottom:4px;font-size:14px;">${expert.name}</div>
          <div style="font-size:12px;color:var(--text-weak);margin-bottom:16px;">${expert.title}</div>
          <div style="margin:0 auto;max-width:280px;padding:12px 14px;background:var(--bubble-received-bg,rgba(230,230,235,0.9));border-radius:12px 12px 12px 2px;text-align:left;font-size:13px;line-height:1.5;color:var(--text-primary);">
            ${expert.introMessage || (getLang() === 'en' ? `Hi! I'm ${expert.name}. How can I help?` : `你好！我是 ${expert.name}。有什么我可以帮你的？`)}
          </div>
        </div>`;
    } else {
      msgContainer.innerHTML = msgs.map(m => `
        <div class="msg-bubble-row ${m.role === 'user' ? 'sent' : 'received'}">
          ${m.role === 'assistant' ? `<div class="msg-bubble-avatar">${expert.avatarEmoji || '👤'}</div>` : ''}
          <div class="msg-bubble ${m.role === 'user' ? 'sent' : 'received'}">${m.content}</div>
        </div>`).join('');
    }
    msgContainer.scrollTop = msgContainer.scrollHeight;
  },

  async _sendMessage(chatArea, expert, text) {
    if (!AIConfig.hasKey()) return;

    MemoryManager.addMessage(expert.id, 'user', text);
    this._renderMessages(chatArea, expert);

    // Typing indicator
    const msgContainer = chatArea.querySelector('#msg-messages');
    if (msgContainer) {
      const typingEl = document.createElement('div');
      typingEl.className = 'msg-bubble-row received';
      typingEl.id = 'msg-typing';
      typingEl.innerHTML = `
        <div class="msg-bubble-avatar">${expert.avatarEmoji || '👤'}</div>
        <div class="msg-bubble typing">
          <div class="msg-typing-dots">
            <div class="msg-typing-dot"></div><div class="msg-typing-dot"></div><div class="msg-typing-dot"></div>
          </div>
        </div>`;
      msgContainer.appendChild(typingEl);
      msgContainer.scrollTop = msgContainer.scrollHeight;
    }

    // Disable input while waiting
    const input = chatArea.querySelector('#msg-input');
    const sendBtn = chatArea.querySelector('#msg-send-btn');
    if (input) input.disabled = true;
    if (sendBtn) sendBtn.disabled = true;

    let response = null;
    try {
      const systemPrompt = PromptBuilder.build(expert, text);
      const mem = MemoryManager.getMemory(expert.id);
      // Pass conversation history (exclude last user msg since we already appended)
      const history = mem.recentMessages.slice(0, -1);
      response = await AIConfig.chat(systemPrompt, [...history, { role: 'user', content: text }]);
    } catch (e) {
      console.error('AI chat failed:', e);
    }

    // Remove typing indicator
    chatArea.querySelector('#msg-typing')?.remove();

    if (!response) {
      response = getLang() === 'en'
        ? '(AI response failed. Please check your API key in Settings.)'
        : '（AI 回复失败，请在设置中检查 API Key 是否正确。）';
    }

    MemoryManager.addMessage(expert.id, 'assistant', response);
    MemoryManager.increaseTrust(expert.id, 3);

    // Log belief & activity
    await MemoryManager.updateBeliefs(expert.id,
      getLang() === 'en'
        ? `Week ${GameState.get('week')}: discussed "${text.slice(0, 25)}"`
        : `第 ${GameState.get('week')} 周：讨论了「${text.slice(0, 20)}」`);

    ActivityLogger.log('message', { expertId: expert.id, topic: text.slice(0, 30) });

    // Re-enable input
    if (input) input.disabled = false;
    if (sendBtn) sendBtn.disabled = false;
    if (input) input.focus();

    this._renderMessages(chatArea, expert);
  },

  _initiateConsult(container, expert) {
    const modal = document.getElementById('consult-modal');
    modal.innerHTML = `
      <div class="consult-box">
        <div class="consult-title">${t('msg.consult_title')}</div>
        <div class="consult-desc">${t('msg.consult_desc', { name: expert.name })}</div>
        <div class="consult-cost">
          <span class="label">${t('msg.consult_fee', { fee: expert.consultFee })}</span>
        </div>
        <div class="consult-actions">
          <button class="consult-cancel-btn" id="consult-cancel">${t('msg.consult_cancel')}</button>
          <button class="consult-confirm-btn" id="consult-confirm">${t('msg.consult_confirm')}</button>
        </div>
      </div>`;
    modal.classList.add('show');
    document.getElementById('consult-cancel').onclick = () => modal.classList.remove('show');
    document.getElementById('consult-confirm').onclick = () => {
      modal.classList.remove('show');
      if (GameState.get('cash') < expert.consultFee) {
        NotificationSystem.show('💰', t('msg.consult_no_money'), 3000);
        return;
      }
      GameState.set('cash', Math.max(0, GameState.get('cash') - expert.consultFee));
      MemoryManager.increaseTrust(expert.id, 10);
      ActivityLogger.log('paid_consult', { expertId: expert.id, fee: expert.consultFee });
      NotificationSystem.show('💬 Messages', t('msg.consult_paid', { fee: expert.consultFee }), 2500);
      this._openChat(container, expert);
    };
  }
};
