'use strict';

// ===== EVENT TEMPLATES =====
const EVENT_TEMPLATES = {
  week1: [
    {
      id: 'evt_termination', type: 'A',
      from: 'HR Department <hr@bigcorp.com>', fromShort: 'BigCorp HR',
      subject: 'Employment Termination Notice',
      body: `亲爱的员工，

我们遗憾地通知您，由于公司战略调整，您的职位已被取消，您的雇佣关系将于今日正式终止。

我们感谢您在过去 4 年中为公司所做的贡献。您的离职补偿将在 30 个工作日内转入您的账户（税后 ¥47,200）。

请在今日工作时间结束前完成以下事项：
• 移交工作文档至直属上级
• 归还公司设备
• 清空个人物品

祝您在未来职业发展中一切顺利。

BigCorp 人力资源部`,
      avatar: '🏢',
      effect: { cash: 47200 },
      narrative: '你的裁员通知。¥47,200 的遣散费已到账。'
    },
    {
      id: 'evt_old_friend', type: 'B',
      from: '王子墨 <zimo@email.com>', fromShort: '王子墨',
      subject: '嘿，我听说了，你还好吗？',
      body: `嘿，

刚刚听说你的消息，真的很遗憾。BigCorp 最近裁了好多人，你不是一个人。

我现在在做一个小项目，需要一个能帮我做产品规划的人，不是全职，就是顾问形式。
你有兴趣聊聊吗？能给你带来一些现金流。

另外——你考虑好接下来要做什么了吗？

子墨`,
      avatar: '👨‍💻',
      choices: [
        { label: '接受顾问邀请', effect: { cash: 5000, reputation: 2, network: 1 }, log: 'accepted_consulting', desc: '接受了第一个顾问项目，获得 ¥5,000 预付款' },
        { label: '感谢但婉拒', effect: { reputation: 1, network: 1 }, log: 'declined_consulting_politely', desc: '婉拒了，但维护了友谊' },
        { label: '先看看再说', effect: {}, log: 'deferred_consulting', desc: '暂时搁置了这个机会' }
      ]
    },
    {
      id: 'evt_linkedin', type: 'A',
      from: 'LinkedIn <no-reply@linkedin.com>', fromShort: 'LinkedIn',
      subject: '你有 3 条新消息',
      body: `有 3 位前同事给你发来了消息。

其中两条是例行的问候，还有一条来自你原来的 mentor —— 她问你接下来有什么打算，说如果你想创业，她可以帮你介绍几个人。

你的 LinkedIn 个人页面还显示着「前 BigCorp 高级产品经理」。`,
      avatar: '💼',
      effect: { network: 2 },
      narrative: '人脉 +2。你的职业网络还在。'
    }
  ],
  week2: [
    {
      id: 'evt_first_client_lead', type: 'C',
      from: '陈思远 <chen@venture.io>', fromShort: '陈思远',
      subject: '你们的 SaaS 工具有人感兴趣',
      body: `你好，

我在一个创业群里看到有人推荐了你的名字，说你对 B2B 产品很有经验。

我们公司正在找一个能帮我们梳理产品路线图的顾问，预算 ¥8,000/月，为期 3 个月。
你这周内有空聊吗？时间紧，我们希望尽快确定人选。

陈思远
Venture.io 联合创始人`,
      avatar: '🚀',
      choices: [
        { label: '立即回复，本周约聊', effect: { cash: 8000, reputation: 3, network: 2 }, log: 'first_paid_client', desc: '获得第一个付费客户！¥8,000/月的顾问合同', milestone: 'firstPaidClient' },
        { label: '先了解更多信息', effect: { network: 1 }, log: 'client_inquiry', desc: '请求了解更多，机会还在' },
        { label: '这周太忙，忽略', effect: { reputation: -1 }, log: 'missed_opportunity', desc: '错过了这个机会', expired: true }
      ],
      expiresAfterWeek: true
    },
    {
      id: 'evt_podcast_discovery', type: 'A',
      from: 'Podcast App <podcasts@apple.com>', fromShort: 'Apple Podcasts',
      subject: "新推荐：Lenny's Podcast",
      body: `根据你的收听历史，我们为你推荐：

🎙️ Lenny's Podcast — Product | Growth | Career

主持人 Lenny Rachitsky 曾是 Airbnb 的产品负责人，他每周都会邀请顶级创业者和产品人深度对谈。听众超过 100 万，是 PM 和创始人必听的播客之一。

最新一期：「从 0 到 PMF：B2B SaaS 创始人必读指南」

在 Podcast App 中打开以收听。`,
      avatar: '🎙️',
      effect: {},
      narrative: "Lenny's Podcast 已推荐！打开 Podcast App 开始收听并发现专家。"
    }
  ],
  week3: [
    {
      id: 'evt_vc_cold', type: 'B',
      from: '李明轩 Partner <li@sequoia.com>', fromShort: '红杉资本 李明轩',
      subject: '想聊聊你的方向',
      body: `你好，

我在关注独立创业者这个赛道，看到有人提到你正在做一个 B2B 方向的产品。

我们最近在看一些 Solo founder 的项目，如果你有兴趣，可以聊聊。不一定是融资，就是交流一下想法。

你方便本周或下周找个时间吗？

李明轩
红杉资本 合伙人`,
      avatar: '💰',
      choices: [
        { label: '接受会面', effect: { network: 3, reputation: 2 }, log: 'vc_meeting', desc: '与 VC 建立了联系，人脉 +3' },
        { label: '婉拒，专注 OPC', effect: { vcOffersDeclined: 1 }, log: 'declined_vc_1', desc: '拒绝了 VC，坚持独立路线', vcDecline: true }
      ]
    }
  ],
  week4: [
    {
      id: 'evt_content_opportunity', type: 'B',
      from: 'Medium <noreply@medium.com>', fromShort: 'Medium',
      subject: '你的文章被推荐到首页了',
      body: `恭喜！

你上周发布的文章「B2B SaaS 创业者的 PMF 定义框架」在 Medium 上获得了超过 1,200 次阅读，并被推荐到产品类首页。

已有多位读者联系表示希望深度交流。

这是一个建立个人品牌的好机会。`,
      avatar: '✍️',
      choices: [
        { label: '持续写作，建立内容矩阵', effect: { reputation: 4, communityContribution: 5, insightFragments: 1 }, log: 'content_strategy', desc: '开始内容创作策略，信誉 +4' },
        { label: '联系感兴趣的读者', effect: { network: 3, reputation: 2 }, log: 'reader_outreach', desc: '主动联系了 3 位感兴趣的读者，人脉 +3' }
      ]
    }
  ]
};

// ===== ACTION DEFINITIONS =====
const ACTION_DEFS = [
  {
    id: 'listen_podcast', category: '思考类',
    name: '🎙️ 收听播客',
    desc: "收听 Lenny's Podcast，解锁专家信息并获得洞察碎片",
    effect(state) { return { insightFragments: (state.insightFragments || 0) + 1, reputation: state.reputation + 1 }; },
    narrative: '收听了一集播客，获得洞察碎片 +1，信誉 +1'
  },
  {
    id: 'review_data', category: '思考类',
    name: '📊 复盘数据',
    desc: '复盘上周决策数据，信誉 +2',
    effect(state) { return { reputation: state.reputation + 2 }; },
    narrative: '深度复盘了数据，信誉 +2'
  },
  {
    id: 'market_research', category: '思考类',
    name: '🌐 市场调研',
    desc: '在 Safari 中搜索市场情报，可能发现新专家',
    effect(state) { return { insightFragments: (state.insightFragments || 0) + 1 }; },
    narrative: '完成了市场调研，获得洞察碎片 +1'
  },
  {
    id: 'cold_outreach', category: '社交类',
    name: '📧 冷启动联系专家',
    desc: '主动联系一位专家，成功率受信誉影响',
    effect(state) {
      const success = Math.random() < (state.reputation / 100) * 0.6;
      if (success) return { network: state.network + 1 };
      return {};
    },
    narrative: '发出了冷启动邮件，等待回复...'
  },
  {
    id: 'community', category: '社交类',
    name: '👥 社群互动',
    desc: '在社群中活跃互动，人脉 +2，有概率触发隐藏专家搭话',
    effect(state) { return { network: state.network + 2, communityContribution: (state.communityContribution || 0) + 5 }; },
    narrative: '在社群中活跃互动，人脉 +2'
  },
  {
    id: 'offline_event', category: '社交类',
    name: '🎪 参加线下活动',
    desc: '参加创业/PM 线下活动，人脉 +5，但有低质局风险',
    effect(state) {
      if (Math.random() > 0.3) return { network: state.network + 5, reputation: state.reputation + 1 };
      return { network: state.network + 2 };
    },
    narrative: '参加了一场线下活动'
  },
  {
    id: 'create_content', category: '执行类',
    name: '✍️ 创作内容',
    desc: '写文章/发推，小概率爆款；质量由洞察碎片数量决定',
    effect(state) {
      const fragments = state.insightFragments || 0;
      const viral = Math.random() < Math.min(0.3, fragments * 0.05);
      if (viral) return { reputation: state.reputation + 5, communityContribution: (state.communityContribution || 0) + 10 };
      return { reputation: state.reputation + 1, communityContribution: (state.communityContribution || 0) + 3 };
    },
    narrative: '发布了一篇内容，等待反响...'
  },
  {
    id: 'visit_client', category: '执行类',
    name: '🤝 拜访潜在客户',
    desc: '拜访潜在客户，转化率受信誉影响',
    effect(state) {
      const success = Math.random() < state.reputation / 80;
      if (success) return { cash: state.cash + 8000, reputation: state.reputation + 2 };
      return { reputation: state.reputation + 1 };
    },
    narrative: '拜访了潜在客户，正在跟进...'
  },
  {
    id: 'dev_prototype', category: '执行类',
    name: '💻 开发产品原型',
    desc: '开发原型，消耗 ¥3,000 外包费，信誉 +3',
    effect(state) { return { cash: state.cash - 3000, reputation: state.reputation + 3, insightFragments: (state.insightFragments || 0) + 1 }; },
    narrative: '完成了产品原型开发，花费 ¥3,000 外包，信誉 +3'
  },
  {
    id: 'rest', category: '恢复类',
    name: '😴 好好休息',
    desc: '专心休息，下周精神饱满',
    effect() { return {}; },
    narrative: '好好休息了一周，精神饱满'
  }
];

// ===== WeekCycleEngine =====
const WeekCycleEngine = {
  _scheduledActions: [],
  _weekHistory: [],

  init() {
    EventBus.on('clock:day', ({ day }) => {
      this.checkDayUnlocks(day);
      this._generateDayEmails(day);
    });
    EventBus.on('game:over', () => this._triggerGameOver());
  },

  getScheduled() { return [...this._scheduledActions]; },

  canSchedule(actionId) {
    return !!ACTION_DEFS.find(a => a.id === actionId);
  },

  schedule(actionId) {
    if (!this.canSchedule(actionId)) return false;
    this._scheduledActions.push(actionId);
    EventBus.emit('actions:updated', this._scheduledActions);
    return true;
  },

  unschedule(idx) {
    this._scheduledActions.splice(idx, 1);
    EventBus.emit('actions:updated', this._scheduledActions);
  },

  async executeWeek() {
    const state = GameState.getAll();
    const week = state.week;
    const results = [];
    let newState = { ...state };

    for (const actionId of this._scheduledActions) {
      const def = ACTION_DEFS.find(a => a.id === actionId);
      if (!def) continue;
      const effect = def.effect(newState);
      results.push({ action: def.name, narrative: def.narrative, effect });
      Object.entries(effect).forEach(([k, v]) => {
        if (!k.startsWith('_')) newState[k] = Math.max(0, v);
      });
      const profile = { ...newState.playerProfile };
      profile.actions = [...profile.actions, { week, type: actionId }];
      newState.playerProfile = profile;
    }

    const randomEvents = this._triggerRandomEvents(GameState.get('day') || 1, newState);

    Object.entries(newState).forEach(([k, v]) => {
      if (!['day','week','phase'].includes(k)) GameState.set(k, v);
    });

    if (newState.cash <= 0) setTimeout(() => this._triggerGameOver(), 1500);

    this._weekHistory.push({ day: GameState.get('day'), actions: [...this._scheduledActions], results });
    this._scheduledActions = [];

    return { results, randomEvents };
  },

  _triggerRandomEvents(week, state) {
    const events = [];
    if (Math.random() < 0.25 && state.reputation > 15) {
      events.push({ title: '💌 意外联系', desc: '一位行业前辈看到了你的近期动态，主动发来消息，表示欣赏你的方向。人脉 +1。' });
      GameState.set('network', state.network + 1);
    }
    if (Math.random() < 0.15 && week > 3) {
      events.push({ title: '📰 被媒体提及', desc: '你被一篇关于独立创业者的文章引用，带来了少量曝光。信誉 +2。' });
      GameState.set('reputation', state.reputation + 2);
    }
    return events;
  },

  checkDayUnlocks(day) {
    const state = GameState.getAll();
    const unlocked = GameState.get('unlockedApps') || [];
    // Discord unlocks on Day 5+
    if (day >= 5 && !unlocked.includes('discord')) {
      DockManager.unlock('discord');
      NotificationSystem.show('🔓 Discord', t('notif.discord_unlocked') || '加入创业者社群，发现隐藏专家', 4000);
    }
    // Contacts unlocks when first expert added
    if (Object.keys(state.discoveredExperts || {}).length >= 1 && !unlocked.includes('contacts')) {
      DockManager.unlock('contacts');
    }
  },

  _generateDayEmails(day) {
    const existing = GameState.get('pendingEmails') || [];
    // Map days to week buckets for template lookup
    const weekKey = day <= 7 ? 'week1' : day <= 14 ? 'week2' : day <= 21 ? 'week3' : 'week4';
    const templates = EVENT_TEMPLATES[weekKey] || [];
    const newEmails = templates.filter(tmpl =>
      !existing.find(e => e.id === tmpl.id) && tmpl.id !== 'evt_termination'
    );
    if (newEmails.length > 0) {
      GameState.set('pendingEmails', [
        ...existing,
        ...newEmails.map(tmpl => ({ ...tmpl, receivedDay: day, read: false }))
      ]);
    }
  },

  // Legacy alias kept for any remaining callers
  _generateWeeklyEmails(week) { this._generateDayEmails(week * 7); },

  _triggerGameOver() {
    NotificationSystem.show('⚠️ 游戏结束', '现金耗尽。你的 OPC 之旅就此结束……', -1);
    setTimeout(() => {
      if (confirm('资金耗尽，游戏结束。是否重新开始？（保留部分人脉记忆）')) {
        const network = GameState.get('network');
        GameState.reset();
        GameState.set('network', Math.floor(network * 0.5));
        location.reload();
      }
    }, 800);
  }
};
