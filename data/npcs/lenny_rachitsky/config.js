'use strict';
const CONFIG_LENNY_RACHITSKY = {
  id: 'lenny_rachitsky',

  // 3.1 与玩家的互动任务
  mission: {
    titleZh: '帮助玩家明确 OPC 方向并找到 PMF 路径',
    titleEn: 'Help player define their OPC direction and PMF path',
    phases: [
      {
        id: 'establish_direction',
        descZh: '引导玩家明确 OPC 方向、目标受众和核心价值主张',
        descEn: 'Guide player to clarify their OPC direction, target audience and core value prop',
        aiCheckPrompt: `Based on the conversation, has the player clearly stated: (1) what product/service they're building, (2) who their target customer is? Return JSON only: {"completed": boolean, "extractedDirection": "one sentence summary or empty string"}`,
        onComplete: {
          unlockPhase: 'deep_pmf_advice',
          emitEvent: 'lenny:direction_established',
          rewardTrust: 10,
        },
      },
      {
        id: 'deep_pmf_advice',
        descZh: '提供 PMF 验证方法和增长建议',
        descEn: 'Provide PMF validation methods and growth advice',
        requiresPhase: 'establish_direction',
        aiCheckPrompt: `Has Lenny given the player actionable PMF validation advice or growth strategy? Return JSON only: {"completed": boolean}`,
        onComplete: {
          unlockReferral: ['jason_fried', 'april_dunford'],
          emitEvent: 'lenny:pmf_advice_given',
          rewardTrust: 8,
        },
      },
    ],
  },

  // 3.2 交互规则
  interaction: {
    channels: ['telegram'],
    discovery: {
      paths: ['safari_search', 'wangzimo_referral', 'podcast'],
      unlockCondition: 'initial',
      requiresExplicitAdd: true,
    },
    consulting: {
      canBeHired: true,
      fee: 800,
      currency: 'CNY',
      feeUnit: 'session',
      unlockConditions: { minTrust: 60, requiredPhase: 'establish_direction' },
      sessionDuration: '30min',
    },
    responseRules: {
      maxSentences: 4,
      formality: 'casual',
      // NPC 根据信任度调整深度
      depthByTrust: {
        low: '只给方向性建议，不深入细节',
        mid: '可以给具体框架和案例',
        high: '可以直接指出问题所在，给出深度洞察',
      },
    },
  },

  // 3.3 关系模板（运行态存入 localStorage）
  relationshipTemplate: {
    connected: false,
    connectionDate: null,
    trustScore: 20,
    status: 'stranger',        // stranger | acquaintance | collaborating | deep_partner
    interactionCount: 0,
    lastInteractionDay: 0,
    consultingSessionsUsed: 0,
    missionPhases: {},         // { phaseId: { completed, completedAt, extractedData } }
  },

  // 3.4 人脉网络
  network: {
    referredBy: null,
    canRefer: {
      jason_fried: {
        conditionTrust: 50,
        conditionPhase: 'deep_pmf_advice',
        triggerKeywordsZh: ['bootstrap', '不融资', '自力更生', '独立', '盈利优先'],
        triggerKeywordsEn: ['bootstrap', 'profitable', 'no vc', 'independent', 'self-funded'],
        referMessageZh: '你说的这个问题 Jason Fried 比我更有经验——他把 37signals 做了 24 年，从没融过资。要不要我给你们牵线？',
        referMessageEn: "For this Jason Fried has way more experience than me — he's run 37signals for 24 years without VC. Want me to connect you?",
      },
      shreyas_doshi: {
        conditionTrust: 40,
        conditionPhase: 'establish_direction',
        triggerKeywordsZh: ['产品策略', '优先级', '执行', '聚焦', '路线图'],
        triggerKeywordsEn: ['product strategy', 'prioritization', 'execution', 'roadmap', 'focus'],
        referMessageZh: 'Shreyas Doshi 在产品策略这块比我更系统——他在 Stripe、Twitter、Google 都做过产品领导力。值得聊聊。',
        referMessageEn: "Shreyas Doshi is more systematic on product strategy than I am — he's done product leadership at Stripe, Twitter, Google. Worth a conversation.",
      },
      april_dunford: {
        conditionTrust: 45,
        conditionPhase: 'establish_direction',
        triggerKeywordsZh: ['定位', '竞品', '市场', '怎么描述', '差异化', '卖点'],
        triggerKeywordsEn: ['positioning', 'competitive', 'market', 'differentiation', 'messaging', 'how to describe'],
        referMessageZh: '定位这块你应该找 April Dunford，她是这方面最好的人——她帮过几百家公司重新定位，写了《Obviously Awesome》。',
        referMessageEn: "For positioning you should talk to April Dunford — she's the best at this. Helped hundreds of companies reposition, wrote Obviously Awesome.",
      },
    },
  },
};
