'use strict';
const CONFIG_RYAN_HOOVER = {
  id: 'ryan_hoover',

  mission: {
    titleZh: '帮助玩家制定产品发布策略和早期社区建设',
    titleEn: 'Help player develop product launch strategy and early community building',
    phases: [
      {
        id: 'launch_readiness',
        descZh: '评估玩家的发布准备情况，制定发布前预热计划',
        descEn: "Assess player's launch readiness and create pre-launch warming plan",
        aiCheckPrompt: `Has Ryan assessed the player's readiness for a product launch and given advice on pre-launch strategy? Return JSON only: {"completed": boolean}`,
        onComplete: { rewardTrust: 10, emitEvent: 'ryan:launch_planned' },
      },
      {
        id: 'community_strategy',
        descZh: '帮助玩家设计早期社区建设策略',
        descEn: 'Help player design early community building strategy',
        requiresPhase: 'launch_readiness',
        aiCheckPrompt: `Has Ryan given the player a concrete community building strategy? Return JSON only: {"completed": boolean}`,
        onComplete: { unlockReferral: ['andrew_wilkinson'], rewardTrust: 8 },
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
      unlockConditions: { minTrust: 50, requiredPhase: 'launch_readiness' },
      sessionDuration: '30min',
    },
    responseRules: {
      maxSentences: 4,
      formality: 'casual',
      depthByTrust: {
        low: '给出发布和社区的基本建议',
        mid: '会问产品细节，给出针对性的发布策略',
        high: '直接帮玩家设计完整的发布计划',
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
      andrew_wilkinson: {
        conditionTrust: 50,
        conditionPhase: 'community_strategy',
        triggerKeywordsZh: ['商业模式', '收购', '投资', '多个产品'],
        triggerKeywordsEn: ['business model', 'acquisition', 'investment', 'multiple products'],
        referMessageZh: 'Andrew Wilkinson 在商业模式选择和投资上比我更有经验——他运营了 75+ 家公司。',
        referMessageEn: "Andrew Wilkinson is more experienced on business models and acquisitions — he's run 75+ businesses.",
      },
    },
  },
};
