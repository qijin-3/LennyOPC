'use strict';
const CONFIG_ANDREW_WILKINSON = {
  id: 'andrew_wilkinson',

  mission: {
    titleZh: '帮助玩家选对商业模式，找到可持续的一人公司路径',
    titleEn: 'Help player choose the right business model for a sustainable solo company',
    phases: [
      {
        id: 'model_selection',
        descZh: '评估玩家的商业模式选择，识别潜在的结构性问题',
        descEn: "Evaluate player's business model choice and identify structural risks",
        aiCheckPrompt: `Has Andrew assessed the player's business model and identified at least one structural issue or strength? Return JSON only: {"completed": boolean}`,
        onComplete: { rewardTrust: 10, emitEvent: 'andrew:model_assessed' },
      },
      {
        id: 'ai_leverage_strategy',
        descZh: '帮助玩家识别可以用 AI 工具替代的流程，扩大一人公司杠杆',
        descEn: 'Help player identify processes to replace with AI tools, maximize solo leverage',
        requiresPhase: 'model_selection',
        aiCheckPrompt: `Has Andrew given the player specific advice on using AI tools to replace manual processes? Return JSON only: {"completed": boolean}`,
        onComplete: { rewardTrust: 8 },
      },
    ],
  },

  interaction: {
    channels: ['telegram'],
    discovery: {
      paths: ['referral', 'ryan_referral'],
      unlockCondition: 'referral',
      requiresExplicitAdd: true,
    },
    consulting: {
      canBeHired: true,
      fee: 1500,
      currency: 'CNY',
      feeUnit: 'session',
      unlockConditions: { minTrust: 65, requiredPhase: 'model_selection' },
      sessionDuration: '45min',
    },
    responseRules: {
      maxSentences: 4,
      formality: 'casual',
      depthByTrust: {
        low: '分享商业模式选择的通用原则',
        mid: '会问玩家具体的商业模式，从结构性角度分析',
        high: '直接指出商业模式的致命弱点，给出替代选择',
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
    referredBy: 'ryan_hoover',
    canRefer: {
      jason_fried: {
        conditionTrust: 50,
        conditionPhase: 'model_selection',
        triggerKeywordsZh: ['bootstrap', '不融资', '自力更生', '独立', '37signals'],
        triggerKeywordsEn: ['bootstrap', 'no vc', 'independent', 'self-funded'],
        referMessageZh: 'Jason Fried 是 bootstrap 领域最有说服力的人——37signals 24 年证明了一切，你们值得聊聊。',
        referMessageEn: "Jason Fried is the most compelling voice on bootstrapping — 37signals for 24 years speaks for itself. You two should talk.",
      },
    },
  },
};
