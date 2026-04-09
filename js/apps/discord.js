'use strict';

const COMMUNITY_CHANNELS = [
  { id: 'general', name: '# general', desc: '日常闲聊' },
  { id: 'show-and-tell', name: '# show-and-tell', desc: '展示你的作品' },
  { id: 'find-cofounders', name: '# find-cofounders', desc: '寻找联合创始人' },
  { id: 'ask-for-feedback', name: '# ask-for-feedback', desc: '产品反馈' },
  { id: 'growth-hacks', name: '# growth-hacks', desc: '增长经验分享' },
];

const COMMUNITY_MESSAGES = {
  general: [
    { user: '李想远', avatar: '👨‍💻', text: '大家好！刚加入这个社群，正在做一个面向中小企业的 ERP 工具，有同行吗？', time: '昨天' },
    { user: '张晓雯', avatar: '👩‍🎨', text: '今天第一个付费用户转化了！¥299/月，虽然不多，但感觉突破了心理障碍 🎉', time: '昨天' },
    { user: '陈浩宇', avatar: '🧑‍🔬', text: '请问大家用什么工具做用户访谈记录？我现在用 Notion 感觉有点乱', time: '2小时前' },
    { user: '王薇薇', avatar: '👩‍💼', text: '推荐一篇好文章：Jason Fried 最新写的关于「Calm Company」的思考，很适合 OPC 路线', time: '1小时前' },
    { user: 'System', avatar: '🤖', text: '欢迎新成员加入！', time: '刚刚', isSystem: true },
  ],
  'show-and-tell': [
    { user: '刘建国', avatar: '🚀', text: '我做了一个帮 B2B 销售团队自动生成跟进邮件的工具，上线两周，有 47 个注册用户，3 个付费。来看看我的 landing page？', time: '3小时前' },
    { user: '林子轩', avatar: '👨‍🎤', text: '刚完成了我的「100天公开创业」挑战的第 23 天，今天分享了产品的第一个完整演示视频，收到了 200+ 点赞', time: '2小时前' },
    { user: '苏梦琪', avatar: '🎯', text: '产品刚刚被 ProductHunt 首页推荐了！当天注册用户增加了 800 个，不过付费转化还在跑中...', time: '1小时前' },
  ],
  'find-cofounders': [
    { user: '程大明', avatar: '💡', text: '技术背景（10年后端），正在找有产品/销售背景的联创，方向是 B2B SaaS 数据工具，已有 LoI', time: '昨天' },
    { user: '赵小红', avatar: '👩‍🏫', text: '产品经理背景，做过 3 个 0-1，寻找技术联创或技术顾问，方向是教育类 SaaS', time: '5小时前' },
  ],
  'ask-for-feedback': [
    { user: '吴凯', avatar: '🔍', text: '我的产品 landing page 换了新版本，求大家帮看看：这个价值主张是否清晰？目标用户：中小型 SaaS 公司的市场团队', time: '4小时前' },
    { user: '周艺', avatar: '🎨', text: '我在纠结定价策略：¥199/月单人版 vs ¥499/月团队版（5人），大家有什么建议？', time: '2小时前' },
  ],
  'growth-hacks': [
    { user: '徐磊', avatar: '📊', text: '分享一个我们用过最有效的 B2B 冷邮件模板，回复率从 2% 提升到了 8%，就是做到了极致个性化', time: '昨天' },
    { user: '冯晴', avatar: '⚡', text: 'LinkedIn 深度运营 3 个月的复盘：每天发一条有洞察的内容，3 个月涨粉 2000+，带来了 12 个付费客户询盘', time: '6小时前' },
    { user: '郑思远', avatar: '🌱', text: '刚测试了一个策略：把我的核心用户组建了一个微信群，让他们互相交流，结果续费率提升了 15%！社区即产品。', time: '2小时前' },
  ],
};

// Hidden experts that can only be found via community
const HIDDEN_COMMUNITY_EXPERTS = [
  {
    id: 'hidden_operator',
    name: '郑磊（匿名创业者）',
    title: '连续创业者，3 次 exit',
    avatarEmoji: '🕵️',
    personality: '低调但睿智，不喜欢露面，只对真正有潜力的人分享干货',
    expertise: ['exit strategy', 'B2B sales', 'bootstrapping', 'operations'],
    consultFee: 500,
    unlockCondition: 'community',
    introMessage: '我不常跟人说话，但我注意到你在社群里分享了一些有意思的东西。你在做什么方向？',
    network: ['jason_fried'],
    knowledge: [
      {
        topic: '退出策略',
        keywords: ['退出', 'exit', '收购', '卖出', '估值', 'M&A'],
        fragment: '大多数创业者从来不认真想退出策略，结果错失了最好的时机。最好的收购往往发生在你不缺钱、业务健康的时候——而不是在你需要救命稻草的时候。',
        source: '社群内部分享',
        depth: 1
      }
    ]
  }
];

const DiscordApp = {
  _activeChannel: 'general',
  _container: null,
  _interactionCount: 0,

  render(container) {
    this._container = container;
    container.innerHTML = `
      <div style="display:flex;height:100%;">
        <!-- Server sidebar -->
        <div style="width:64px;background:#1e1f22;display:flex;flex-direction:column;align-items:center;padding:8px 0;gap:8px;flex-shrink:0;">
          <div style="width:48px;height:48px;border-radius:50%;background:linear-gradient(135deg,#5865F2,#7c83f5);display:flex;align-items:center;justify-content:center;font-size:22px;cursor:pointer;" title="OPC创始人社群">🚀</div>
          <div style="width:32px;height:2px;background:rgba(255,255,255,0.1);border-radius:1px;"></div>
          <div style="width:48px;height:48px;border-radius:50%;background:rgba(255,255,255,0.06);display:flex;align-items:center;justify-content:center;font-size:20px;cursor:pointer;" title="更多社群（即将开放）">+</div>
        </div>
        <!-- Channel list -->
        <div style="width:200px;background:#2b2d31;display:flex;flex-direction:column;flex-shrink:0;">
          <div style="padding:16px 12px 8px;font-weight:700;color:#fff;font-size:14px;border-bottom:1px solid rgba(255,255,255,0.08);">OPC 创始人社群</div>
          <div style="padding:8px 0;overflow-y:auto;flex:1;">
            <div style="padding:4px 8px;font-size:11px;font-weight:700;color:rgba(255,255,255,0.4);text-transform:uppercase;letter-spacing:0.5px;">频道</div>
            ${COMMUNITY_CHANNELS.map(ch => `
              <div class="discord-channel ${this._activeChannel === ch.id ? 'active' : ''}" data-channel="${ch.id}" title="${ch.desc}"
                   style="padding:6px 12px;cursor:pointer;border-radius:4px;margin:1px 4px;font-size:14px;color:${this._activeChannel === ch.id ? '#fff' : 'rgba(255,255,255,0.5)'};background:${this._activeChannel === ch.id ? 'rgba(255,255,255,0.1)' : 'transparent'};">
                ${ch.name}
              </div>`).join('')}
          </div>
          <!-- User panel -->
          <div style="padding:8px;background:#232428;border-top:1px solid rgba(255,255,255,0.06);display:flex;align-items:center;gap:8px;">
            <div style="width:32px;height:32px;border-radius:50%;background:linear-gradient(135deg,#5865F2,#7c83f5);display:flex;align-items:center;justify-content:center;font-size:16px;">👤</div>
            <div>
              <div style="font-size:12px;font-weight:600;color:#fff;">创业者</div>
              <div style="font-size:11px;color:rgba(255,255,255,0.4);">社群成员</div>
            </div>
          </div>
        </div>
        <!-- Main chat -->
        <div style="flex:1;display:flex;flex-direction:column;background:#313338;">
          <div style="padding:12px 16px;border-bottom:1px solid rgba(255,255,255,0.06);display:flex;align-items:center;gap:8px;flex-shrink:0;">
            <span style="color:rgba(255,255,255,0.5);font-size:18px;">#</span>
            <span style="font-weight:600;color:#fff;font-size:15px;">${COMMUNITY_CHANNELS.find(c => c.id === this._activeChannel)?.name.replace('# ','') || 'general'}</span>
            <span style="font-size:12px;color:rgba(255,255,255,0.3);margin-left:4px;">${COMMUNITY_CHANNELS.find(c => c.id === this._activeChannel)?.desc || ''}</span>
          </div>
          <div id="discord-messages" style="flex:1;overflow-y:auto;padding:16px;display:flex;flex-direction:column;gap:2px;"></div>
          <div style="padding:12px 16px;flex-shrink:0;">
            <div style="display:flex;align-items:center;gap:8px;background:rgba(255,255,255,0.06);border-radius:8px;padding:8px 12px;">
              <input type="text" id="discord-input" placeholder="在 ${COMMUNITY_CHANNELS.find(c => c.id === this._activeChannel)?.name || '#general'} 发消息..."
                     style="flex:1;background:transparent;border:none;outline:none;color:#fff;font-size:14px;font-family:var(--font-system);">
              <button id="discord-send" style="background:transparent;border:none;cursor:pointer;font-size:20px;opacity:0.6;">↑</button>
            </div>
          </div>
        </div>
        <!-- Members list -->
        <div style="width:180px;background:#2b2d31;padding:12px 8px;overflow-y:auto;flex-shrink:0;">
          <div style="font-size:11px;font-weight:700;color:rgba(255,255,255,0.4);text-transform:uppercase;letter-spacing:0.5px;margin-bottom:8px;">成员 — 42</div>
          ${this._renderMemberList()}
        </div>
      </div>`;

    this._renderMessages(container);
    this._setupInteractions(container);

    container.querySelectorAll('.discord-channel').forEach(ch => {
      ch.onclick = () => {
        this._activeChannel = ch.dataset.channel;
        this.render(container);
      };
    });
  },

  _renderMemberList() {
    const onlineMembers = [
      { name: '李想远', emoji: '👨‍💻', status: '🟢' },
      { name: '张晓雯', emoji: '👩‍🎨', status: '🟢' },
      { name: '陈浩宇', emoji: '🧑‍🔬', status: '🟢' },
      { name: '王薇薇', emoji: '👩‍💼', status: '🟡' },
      { name: '刘建国', emoji: '🚀', status: '🟢' },
      { name: '苏梦琪', emoji: '🎯', status: '🟢' },
      { name: '吴凯', emoji: '🔍', status: '🟡' },
      { name: '郑思远', emoji: '🌱', status: '🟢' },
    ];
    return onlineMembers.map(m => `
      <div style="display:flex;align-items:center;gap:8px;padding:4px 4px;border-radius:4px;cursor:pointer;margin-bottom:2px;" title="${m.name}">
        <div style="width:28px;height:28px;border-radius:50%;background:rgba(255,255,255,0.08);display:flex;align-items:center;justify-content:center;font-size:14px;position:relative;">
          ${m.emoji}
          <span style="position:absolute;bottom:-1px;right:-1px;font-size:8px;">${m.status}</span>
        </div>
        <span style="font-size:13px;color:rgba(255,255,255,0.6);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${m.name}</span>
      </div>`).join('');
  },

  _renderMessages(container) {
    const msgs = COMMUNITY_MESSAGES[this._activeChannel] || [];
    const msgEl = container.querySelector('#discord-messages');
    if (!msgEl) return;

    msgEl.innerHTML = msgs.map(m => `
      <div style="display:flex;gap:12px;padding:4px 0;${m.isSystem ? 'justify-content:center;' : ''}">
        ${m.isSystem ? `<div style="font-size:12px;color:rgba(255,255,255,0.3);">${m.text}</div>` : `
          <div style="width:36px;height:36px;border-radius:50%;background:rgba(255,255,255,0.08);display:flex;align-items:center;justify-content:center;font-size:18px;flex-shrink:0;">${m.avatar}</div>
          <div>
            <div style="display:flex;align-items:center;gap:8px;margin-bottom:2px;">
              <span style="font-size:14px;font-weight:600;color:#fff;">${m.user}</span>
              <span style="font-size:11px;color:rgba(255,255,255,0.3);">${m.time}</span>
            </div>
            <div style="font-size:14px;color:rgba(255,255,255,0.85);line-height:1.5;">${m.text}</div>
          </div>`}
      </div>`).join('');

    msgEl.scrollTop = msgEl.scrollHeight;
  },

  _setupInteractions(container) {
    const input = container.querySelector('#discord-input');
    const sendBtn = container.querySelector('#discord-send');

    const send = () => {
      const text = input.value.trim();
      if (!text) return;
      input.value = '';
      this._handleUserMessage(container, text);
    };

    if (sendBtn) sendBtn.onclick = send;
    if (input) input.onkeydown = e => { if (e.key === 'Enter') send(); };
  },

  _handleUserMessage(container, text) {
    this._interactionCount++;
    const msgs = COMMUNITY_MESSAGES[this._activeChannel];
    if (!msgs) return;

    msgs.push({ user: '创业者（你）', avatar: '👤', text, time: '刚刚' });

    // Update contribution
    const contrib = (GameState.get('communityContribution') || 0) + 3;
    GameState.set('communityContribution', contrib);
    GameState.set('network', (GameState.get('network') || 0) + 1);

    this._renderMessages(container);

    // Occasional random reply
    if (Math.random() < 0.5) {
      const repliers = [
        { user: '李想远', avatar: '👨‍💻', reply: '很有意思！我有类似的困惑，你是怎么解决的？' },
        { user: '张晓雯', avatar: '👩‍🎨', reply: '赞同！我之前也遇到过这个问题，最后用了更简单的方式解决了。' },
        { user: '陈浩宇', avatar: '🧑‍🔬', reply: '这个角度很新颖，能展开说说吗？' },
        { user: '王薇薇', avatar: '👩‍💼', reply: '我分享一篇相关的文章给你参考...' },
      ];
      const replier = repliers[Math.floor(Math.random() * repliers.length)];
      setTimeout(() => {
        msgs.push({ user: replier.user, avatar: replier.avatar, text: replier.reply, time: '刚刚' });
        this._renderMessages(container);
      }, 800 + Math.random() * 1200);
    }

    // Unlock hidden expert after enough interaction
    if (this._interactionCount >= 3 && contrib >= 20) {
      const discovered = GameState.get('discoveredExperts') || {};
      if (!discovered['hidden_operator']) {
        setTimeout(() => {
          msgs.push({
            user: '郑磊',
            avatar: '🕵️',
            text: '嗨，看到你在社群里很活跃。有件事想私下聊聊，介意吗？',
            time: '刚刚'
          });
          this._renderMessages(container);
          discovered['hidden_operator'] = { discoveredAt: GameState.get('week'), channel: 'community', trustBonus: 5 };
          GameState.set('discoveredExperts', discovered);
          EXPERTS.push(...HIDDEN_COMMUNITY_EXPERTS.filter(e => !EXPERTS.find(x => x.id === e.id)));
          MemoryManager.increaseTrust('hidden_operator', 20);
          NotificationSystem.show('👥 Discord', '🕵️ 有人私信了你！发现隐藏专家：郑磊', 5000);
        }, 2000);
      }
    }

    // Achievement check
    if (contrib >= 30) {
      const ach = GameState.get('achievements');
      if (!ach.includes('community_pillar')) {
        ach.push('community_pillar');
        GameState.set('achievements', ach);
        NotificationSystem.show('🏆 成就解锁', '「社群支柱」—— 你成为了社群的核心贡献者', 5000);
      }
    }
  }
};
