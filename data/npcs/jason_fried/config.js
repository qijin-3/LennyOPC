'use strict';
const CONFIG_JASON_FRIED = {
  id: 'jason_fried',

  mission: {
    titleZh: '帮助玩家建立 bootstrap 思维，找到可持续盈利路径',
    titleEn: 'Help player develop a bootstrap mindset and find a sustainable profitable path',
    phases: [
      {
        id: 'challenge_vc_mindset',
        descZh: '挑战玩家对融资和增长的传统认知，建立盈利优先思维',
        descEn: 'Challenge conventional thinking about funding and growth, build profitability-first mindset',
        aiCheckPrompt: `Has the player shown understanding that profitability matters more than growth/funding at this stage? Return JSON only: {"completed": boolean}`,
        onComplete: { rewardTrust: 10, emitEvent: 'jason:mindset_shifted' },
      },
      {
        id: 'define_sustainable_model',
        descZh: '帮助玩家设计一个不依赖外部融资的可持续商业模式',
        descEn: 'Help player design a business model that works without external funding',
        requiresPhase: 'challenge_vc_mindset',
        aiCheckPrompt: `Has Jason helped the player think through a specific sustainable revenue model? Return JSON only: {"completed": boolean, "extractedModel": "brief description or empty"}`,
        onComplete: { unlockReferral: ['patrick_campbell'], rewardTrust: 8 },
      },
    ],
  },

  interaction: {
    channels: ['telegram'],
    discovery: {
      paths: ['podcast', 'lenny_referral'],
      unlockCondition: 'initial',
      requiresExplicitAdd: true,
    },
    consulting: {
      canBeHired: true,
      fee: 1200,
      currency: 'CNY',
      feeUnit: 'session',
      unlockConditions: { minTrust: 65, requiredPhase: 'challenge_vc_mindset' },
      sessionDuration: '45min',
    },
    responseRules: {
      maxSentences: 4,
      formality: 'casual',
      depthByTrust: {
        low: '分享观点，但会追问玩家在想什么',
        mid: '直接给出反传统建议，用 37signals 案例佐证',
        high: '会直接批评不合理的想法，并给出具体替代方案',
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
      patrick_campbell: {
        conditionTrust: 50,
        conditionPhase: 'define_sustainable_model',
        triggerKeywordsZh: ['定价', '收费', 'SaaS', '留存', '流失', '订阅'],
        triggerKeywordsEn: ['pricing', 'churn', 'saas', 'retention', 'subscription'],
        referMessageZh: 'Patrick Campbell 在定价和留存上是最好的——他把 ProfitWell 做到 2 亿美金全 bootstrap，值得聊聊。',
        referMessageEn: "Patrick Campbell is the best on pricing and retention — bootstrapped ProfitWell to $200M. Worth talking to.",
      },
    },
  },
};
