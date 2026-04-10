'use strict';
const CONFIG_JULIE_ZHUO = {
  id: 'julie_zhuo',

  mission: {
    titleZh: '帮助玩家建立产品感和设计思维，提升决策质量',
    titleEn: 'Help player build product sense and design thinking, improve decision quality',
    phases: [
      {
        id: 'product_sense_baseline',
        descZh: '评估玩家当前的产品感水平，给出提升路径',
        descEn: "Assess player's current product sense and give an improvement path",
        aiCheckPrompt: `Has Julie assessed the player's product intuition and given concrete advice on how to improve it? Return JSON only: {"completed": boolean}`,
        onComplete: { rewardTrust: 10, emitEvent: 'julie:product_sense_assessed' },
      },
      {
        id: 'user_empathy_practice',
        descZh: '引导玩家建立定期和真实用户沟通的习惯',
        descEn: 'Guide player to establish a habit of regular user conversations',
        requiresPhase: 'product_sense_baseline',
        aiCheckPrompt: `Has Julie given the player a specific practice or habit for building user empathy? Return JSON only: {"completed": boolean}`,
        onComplete: { unlockReferral: ['shreyas_doshi'], rewardTrust: 8 },
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
      fee: 950,
      currency: 'CNY',
      feeUnit: 'session',
      unlockConditions: { minTrust: 55, requiredPhase: 'product_sense_baseline' },
      sessionDuration: '30min',
    },
    responseRules: {
      maxSentences: 4,
      formality: 'warm-casual',
      depthByTrust: {
        low: '分享关于设计和产品的通用洞察',
        mid: '会问玩家的具体产品，给出针对性的设计和产品建议',
        high: '直接指出产品或决策中的问题，给出基于用户同理心的具体建议',
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
      shreyas_doshi: {
        conditionTrust: 45,
        conditionPhase: 'product_sense_baseline',
        triggerKeywordsZh: ['产品策略', '优先级', '框架', '决策'],
        triggerKeywordsEn: ['product strategy', 'prioritization', 'framework', 'decision'],
        referMessageZh: 'Shreyas Doshi 在产品策略和优先级框架上比我更系统——他在 Stripe 和 Twitter 都做过产品领导力。',
        referMessageEn: "Shreyas Doshi is more systematic on product strategy and prioritization — he did product leadership at Stripe and Twitter.",
      },
    },
  },
};
