'use strict';
const CONFIG_PATRICK_CAMPBELL = {
  id: 'patrick_campbell',

  mission: {
    titleZh: '帮助玩家建立正确的定价策略和留存系统',
    titleEn: 'Help player build the right pricing strategy and retention system',
    phases: [
      {
        id: 'audit_pricing',
        descZh: '诊断玩家当前定价策略，识别低估或错误定价',
        descEn: 'Audit current pricing strategy, identify underpricing or mistakes',
        aiCheckPrompt: `Has Patrick diagnosed the player's pricing approach and identified at least one problem? Return JSON only: {"completed": boolean}`,
        onComplete: { rewardTrust: 10, emitEvent: 'patrick:pricing_audited' },
      },
      {
        id: 'retention_strategy',
        descZh: '帮助玩家分析流失原因并制定留存策略',
        descEn: 'Help player analyze churn and build a retention strategy',
        requiresPhase: 'audit_pricing',
        aiCheckPrompt: `Has Patrick helped the player think through their churn reasons or retention strategy? Return JSON only: {"completed": boolean}`,
        onComplete: { unlockReferral: ['jason_fried'], rewardTrust: 8 },
      },
    ],
  },

  interaction: {
    channels: ['telegram'],
    discovery: {
      paths: ['podcast', 'jason_referral'],
      unlockCondition: 'podcast',
      requiresExplicitAdd: true,
    },
    consulting: {
      canBeHired: true,
      fee: 1000,
      currency: 'CNY',
      feeUnit: 'session',
      unlockConditions: { minTrust: 60, requiredPhase: 'audit_pricing' },
      sessionDuration: '30min',
    },
    responseRules: {
      maxSentences: 4,
      formality: 'casual',
      depthByTrust: {
        low: '给出定价和留存的基本原则',
        mid: '会要求具体数据，给出基于数据的分析',
        high: '直接指出问题所在，给出可操作的定价调整建议',
      },
    },
  },

  relationshipTemplate: {
    connected: false,
    connectionDate: null,
    trustScore: 20,
    status: 'stranger',
    interactionCount: 0,
    lastInteractionDay: 0,
    consultingSessionsUsed: 0,
    missionPhases: {},
  },

  network: {
    referredBy: 'jason_fried',
    canRefer: {
      jason_fried: {
        conditionTrust: 50,
        conditionPhase: 'audit_pricing',
        triggerKeywordsZh: ['bootstrap', '不融资', '独立', '自力更生'],
        triggerKeywordsEn: ['bootstrap', 'no funding', 'independent', 'profitable'],
        referMessageZh: 'Jason Fried 在 bootstrap 这块是最好的——37signals 24 年全靠自己，你们应该聊聊。',
        referMessageEn: "Jason Fried is the best on bootstrapping — 37signals for 24 years, all self-funded. You should talk.",
      },
      lenny_rachitsky: {
        conditionTrust: 45,
        conditionPhase: 'audit_pricing',
        triggerKeywordsZh: ['PMF', '增长', '用户', '获客'],
        triggerKeywordsEn: ['pmf', 'growth', 'users', 'acquisition'],
        referMessageZh: 'Lenny 在 PMF 和增长上比我更有经验，他的播客和 newsletter 在这块很深入。',
        referMessageEn: "Lenny's more experienced on PMF and growth — his podcast and newsletter go really deep on this.",
      },
    },
  },
};
