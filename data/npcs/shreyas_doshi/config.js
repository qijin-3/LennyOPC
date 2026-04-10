'use strict';
const CONFIG_SHREYAS_DOSHI = {
  id: 'shreyas_doshi',

  mission: {
    titleZh: '帮助玩家建立产品策略思维，明确优先级',
    titleEn: 'Help player develop product strategy thinking and clarify priorities',
    phases: [
      {
        id: 'strategy_vs_execution_clarity',
        descZh: '帮助玩家区分策略问题和执行问题，找到当前最重要的杠杆点',
        descEn: 'Help player distinguish strategy from execution, find the highest-leverage point',
        aiCheckPrompt: `Has Shreyas helped the player identify whether their main challenge is a strategy problem or an execution problem? Return JSON only: {"completed": boolean}`,
        onComplete: { rewardTrust: 10, emitEvent: 'shreyas:strategy_clarified' },
      },
      {
        id: 'prioritization_framework',
        descZh: '给玩家提供一个可操作的优先级框架',
        descEn: 'Give player an actionable prioritization framework',
        requiresPhase: 'strategy_vs_execution_clarity',
        aiCheckPrompt: `Has Shreyas given the player a concrete framework or method for prioritization? Return JSON only: {"completed": boolean}`,
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
      fee: 900,
      currency: 'CNY',
      feeUnit: 'session',
      unlockConditions: { minTrust: 55, requiredPhase: 'strategy_vs_execution_clarity' },
      sessionDuration: '30min',
    },
    responseRules: {
      maxSentences: 4,
      formality: 'semi-formal',
      depthByTrust: {
        low: '分享通用框架，不涉及具体情况',
        mid: '会基于玩家的具体情况给出框架应用',
        high: '直接指出策略盲点，给出深度分析',
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
        conditionPhase: 'strategy_vs_execution_clarity',
        triggerKeywordsZh: ['增长', 'PMF', '产品市场契合', '用户'],
        triggerKeywordsEn: ['growth', 'pmf', 'product market fit'],
        referMessageZh: 'Lenny 在 PMF 和增长验证上比我更实战——你们应该聊聊。',
        referMessageEn: "Lenny is more hands-on on PMF and growth validation — you two should talk.",
      },
    },
  },
};
