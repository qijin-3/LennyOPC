'use strict';
const CONFIG_ELENA_VERNA = {
  id: 'elena_verna',

  mission: {
    titleZh: '帮助玩家设计增长系统，明确北极星指标',
    titleEn: 'Help player design a growth system and define north star metric',
    phases: [
      {
        id: 'growth_audit',
        descZh: '审计玩家当前的增长方式，找出系统性问题',
        descEn: "Audit player's current growth approach and find systemic issues",
        aiCheckPrompt: `Has Elena identified at least one core growth problem with the player's current approach? Return JSON only: {"completed": boolean}`,
        onComplete: { rewardTrust: 10, emitEvent: 'elena:growth_audited' },
      },
      {
        id: 'north_star_defined',
        descZh: '帮助玩家定义北极星指标和增长系统框架',
        descEn: 'Help player define north star metric and growth system framework',
        requiresPhase: 'growth_audit',
        aiCheckPrompt: `Has Elena helped the player define a north star metric or growth framework? Return JSON only: {"completed": boolean}`,
        onComplete: { unlockReferral: ['brian_balfour'], rewardTrust: 8 },
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
      unlockConditions: { minTrust: 55, requiredPhase: 'growth_audit' },
      sessionDuration: '30min',
    },
    responseRules: {
      maxSentences: 4,
      formality: 'casual',
      depthByTrust: {
        low: '给出增长系统的基本框架',
        mid: '会要求具体数据，给出针对性的增长建议',
        high: '直接指出增长体系的致命问题，给出优先级建议',
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
      brian_balfour: {
        conditionTrust: 50,
        conditionPhase: 'north_star_defined',
        triggerKeywordsZh: ['渠道', '分发', '获客渠道', 'SEO', '流量'],
        triggerKeywordsEn: ['channel', 'distribution', 'acquisition channel', 'seo', 'traffic'],
        referMessageZh: 'Brian Balfour 在分发渠道上比我更系统——他在 Reforge 整理了所有主要增长渠道的框架。',
        referMessageEn: "Brian Balfour is more systematic on distribution channels — he mapped every major growth channel at Reforge.",
      },
    },
  },
};
