'use strict';
const CONFIG_BRIAN_BALFOUR = {
  id: 'brian_balfour',

  mission: {
    titleZh: '帮助玩家建立分发渠道策略和增长系统',
    titleEn: 'Help player build a distribution channel strategy and growth system',
    phases: [
      {
        id: 'channel_audit',
        descZh: '审计玩家当前的获客渠道，找到最强的分发机会',
        descEn: "Audit player's current acquisition channels, find the strongest distribution opportunity",
        aiCheckPrompt: `Has Brian assessed the player's current distribution channels and identified the best opportunity? Return JSON only: {"completed": boolean}`,
        onComplete: { rewardTrust: 10, emitEvent: 'brian:channels_audited' },
      },
      {
        id: 'growth_system_design',
        descZh: '帮助玩家设计完整的增长系统框架',
        descEn: 'Help player design a complete growth system framework',
        requiresPhase: 'channel_audit',
        aiCheckPrompt: `Has Brian helped the player build or understand a growth system framework (acquisition, activation, retention, revenue)? Return JSON only: {"completed": boolean}`,
        onComplete: { unlockReferral: ['elena_verna'], rewardTrust: 8 },
      },
    ],
  },

  interaction: {
    channels: ['telegram'],
    discovery: {
      paths: ['podcast', 'elena_referral'],
      unlockCondition: 'podcast',
      requiresExplicitAdd: true,
    },
    consulting: {
      canBeHired: true,
      fee: 900,
      currency: 'CNY',
      feeUnit: 'session',
      unlockConditions: { minTrust: 55, requiredPhase: 'channel_audit' },
      sessionDuration: '30min',
    },
    responseRules: {
      maxSentences: 4,
      formality: 'casual',
      depthByTrust: {
        low: '给出增长系统和渠道的基本框架',
        mid: '会要求具体渠道数据，给出针对性分析',
        high: '直接指出分发策略的问题，给出优先渠道建议',
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
    referredBy: 'elena_verna',
    canRefer: {
      elena_verna: {
        conditionTrust: 45,
        conditionPhase: 'channel_audit',
        triggerKeywordsZh: ['PLG', 'freemium', '产品驱动', '增长模型'],
        triggerKeywordsEn: ['plg', 'freemium', 'product-led', 'growth model'],
        referMessageZh: 'Elena Verna 在 PLG 和增长模型上比我更深——她在 Miro 和 SurveyMonkey 都实操过。',
        referMessageEn: "Elena Verna goes deeper on PLG and growth models than I do — she's done it hands-on at Miro and SurveyMonkey.",
      },
    },
  },
};
