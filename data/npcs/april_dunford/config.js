'use strict';
const CONFIG_APRIL_DUNFORD = {
  id: 'april_dunford',

  mission: {
    titleZh: '帮助玩家建立清晰的产品定位',
    titleEn: 'Help player establish clear product positioning',
    phases: [
      {
        id: 'diagnose_positioning',
        descZh: '诊断玩家当前的定位问题，找出模糊或错误之处',
        descEn: "Diagnose player's current positioning issues",
        aiCheckPrompt: `Has April helped identify at least one specific positioning problem the player has? Return JSON only: {"completed": boolean}`,
        onComplete: { rewardTrust: 10, emitEvent: 'april:positioning_diagnosed' },
      },
      {
        id: 'build_positioning_framework',
        descZh: '和玩家一起完成定位框架：替代方案、差异化、目标客户',
        descEn: 'Build positioning framework together: alternatives, differentiation, target customer',
        requiresPhase: 'diagnose_positioning',
        aiCheckPrompt: `Has April walked the player through: (1) what alternatives they compete with, (2) what makes them unique, (3) who benefits most? Return JSON only: {"completed": boolean}`,
        onComplete: { unlockReferral: ['lenny_rachitsky'], rewardTrust: 8 },
      },
    ],
  },

  interaction: {
    channels: ['telegram'],
    discovery: {
      paths: ['podcast', 'lenny_referral'],
      unlockCondition: 'podcast',
      requiresExplicitAdd: true,
    },
    consulting: {
      canBeHired: true,
      fee: 1000,
      currency: 'CNY',
      feeUnit: 'session',
      unlockConditions: { minTrust: 60, requiredPhase: 'diagnose_positioning' },
      sessionDuration: '30min',
    },
    responseRules: {
      maxSentences: 4,
      formality: 'casual',
      depthByTrust: {
        low: '给出定位框架的基本解释',
        mid: '会问具体的产品细节并给出针对性分析',
        high: '直接指出定位错误并给出重新定位的具体建议',
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
    referredBy: 'lenny_rachitsky',
    canRefer: {
      lenny_rachitsky: {
        conditionTrust: 45,
        conditionPhase: 'build_positioning_framework',
        triggerKeywordsZh: ['增长', 'PMF', '用户', '产品市场'],
        triggerKeywordsEn: ['growth', 'pmf', 'product market fit', 'users'],
        referMessageZh: '增长这块 Lenny 更在行，他有很多关于 PMF 和增长的实战经验，你们应该聊聊。',
        referMessageEn: "Lenny's better on growth — he has tons of hands-on PMF and growth experience. You two should talk.",
      },
    },
  },
};
