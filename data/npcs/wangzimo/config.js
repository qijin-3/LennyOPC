'use strict';
const CONFIG_WANGZIMO = {
  id: 'wangzimo',

  mission: {
    titleZh: '陪伴玩家完成情感支持，并在合适时机引荐 Lenny',
    titleEn: 'Provide emotional support and introduce Lenny at the right moment',
    phases: [
      {
        id: 'emotional_support',
        descZh: '给玩家初期情感支持，建立信任关系',
        descEn: 'Provide initial emotional support, build trust',
        aiCheckPrompt: null,
        autoComplete: true,
        onComplete: { rewardTrust: 5 },
      },
      {
        id: 'lenny_referral',
        descZh: '向玩家推荐 Lenny Rachitsky，解锁 Safari',
        descEn: 'Introduce player to Lenny Rachitsky, unlock Safari',
        requiresPhase: 'emotional_support',
        aiCheckPrompt: null,
        autoComplete: true,
        onComplete: {
          unlockApp: 'safari',
          emitEvent: 'wangzimo:lenny_referred',
          rewardTrust: 5,
        },
      },
    ],
  },

  interaction: {
    channels: ['telegram'],
    discovery: { paths: ['game_start'], requiresExplicitAdd: false },
    consulting: {
      canBeHired: false,
    },
    responseRules: {
      maxSentences: 3,
      formality: 'very-casual',
      depthByTrust: {
        low: '短暂关心，不给建议',
        mid: '会聊聊近况，偶尔分享自己的经历',
        high: '像真正的老朋友一样聊天，会主动分享更多',
      },
    },
  },

  relationshipTemplate: {
    connected: true,
    connectionDate: null,
    trustScore: 60,
    status: 'acquaintance',
    interactionCount: 0,
    lastInteractionDay: 0,
    consultingSessionsUsed: 0,
    missionPhases: {},
  },

  network: {
    referredBy: null,
    canRefer: {
      lenny_rachitsky: {
        conditionTrust: 0,
        conditionPhase: 'emotional_support',
        triggerKeywordsZh: [],
        triggerKeywordsEn: [],
        referMessageZh: '对了，你做产品这么多年，有没有听过 Lenny Rachitsky？',
        referMessageEn: 'Oh btw — have you heard of Lenny Rachitsky?',
        isAutoTrigger: true,
      },
    },
  },
};
