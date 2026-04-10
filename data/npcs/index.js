'use strict';
// NPC registry — aggregates all soul + config files.
// Load order: each npc soul.js and config.js must be loaded before this file.

const NPC_REGISTRY = {
  souls: {},
  configs: {},

  _register(soul, config) {
    this.souls[soul.id] = soul;
    this.configs[config.id] = config;
  },

  init() {
    const pairs = [
      [SOUL_LENNY_RACHITSKY,   CONFIG_LENNY_RACHITSKY],
      [SOUL_JASON_FRIED,       CONFIG_JASON_FRIED],
      [SOUL_APRIL_DUNFORD,     CONFIG_APRIL_DUNFORD],
      [SOUL_PATRICK_CAMPBELL,  CONFIG_PATRICK_CAMPBELL],
      [SOUL_SHREYAS_DOSHI,     CONFIG_SHREYAS_DOSHI],
      [SOUL_ELENA_VERNA,       CONFIG_ELENA_VERNA],
      [SOUL_RYAN_HOOVER,       CONFIG_RYAN_HOOVER],
      [SOUL_JULIE_ZHUO,        CONFIG_JULIE_ZHUO],
      [SOUL_ANDREW_WILKINSON,  CONFIG_ANDREW_WILKINSON],
      [SOUL_BRIAN_BALFOUR,     CONFIG_BRIAN_BALFOUR],
      [SOUL_WANGZIMO,          CONFIG_WANGZIMO],
    ];
    pairs.forEach(([soul, config]) => this._register(soul, config));
    this._buildExpertsArray();
    this._buildFallbackResponses();
  },

  // Build the legacy EXPERTS array consumed by podcast.js, contacts.js, safari.js, etc.
  _buildExpertsArray() {
    const expertIds = [
      'lenny_rachitsky','jason_fried','april_dunford','patrick_campbell',
      'shreyas_doshi','elena_verna','ryan_hoover','julie_zhuo',
      'andrew_wilkinson','brian_balfour',
    ];
    window.EXPERTS = expertIds.map(id => {
      const soul = this.souls[id];
      const cfg  = this.configs[id];
      if (!soul || !cfg) return null;
      return {
        id:               soul.id,
        name:             soul.name,
        title:            soul.title,
        avatarEmoji:      soul.avatarEmoji,
        personality:      soul.personality.core,
        expertise:        soul.expertise || [],
        knowledge:        soul.knowledge || [],
        boundaries: {
          offTopic:   soul.boundaries.offTopic,
          deflect:    soul.boundaries.deflectZh,
          enDeflect:  soul.boundaries.deflectEn,
        },
        youtubeId:        soul.youtubeId || '',
        introMessage:     soul.introMessage?.zh || '',
        fallbackReplies:  soul.fallbackReplies?.zh || [],
        consultFee:       cfg.interaction?.consulting?.fee || 0,
        unlockCondition:  cfg.interaction?.discovery?.unlockCondition || 'initial',
        network:          Object.keys(cfg.network?.canRefer || []),
      };
    }).filter(Boolean);
  },

  _buildFallbackResponses() {
    window.FALLBACK_RESPONSES = {};
    window.EXPERTS.forEach(e => { FALLBACK_RESPONSES[e.id] = e.fallbackReplies || []; });
    FALLBACK_RESPONSES.default = [
      '这是个好问题。我觉得最重要的是先把基础搞清楚——你的核心客户是谁，他们真正的痛点是什么？',
      '从我的经验来看，早期创业最重要的是速度——快速假设、快速验证、快速调整。你现在的迭代速度怎么样？',
      '说实话，你描述的问题很多创始人都会遇到。关键是不要想太多，先迈出第一步。',
    ];
  },
};
