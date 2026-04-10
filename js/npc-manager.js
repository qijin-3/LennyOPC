'use strict';

// ===== NPCManager =====
// Replaces the old MemoryManager + PromptBuilder.
// Reads from NPC_REGISTRY (soul + config) and localStorage (memory + state).

const NPCManager = {

  // ── Storage Keys ──────────────────────────────────────────────────────────
  _memKey(id)   { return `npc_mem_${id}`; },
  _stateKey(id) { return `npc_state_${id}`; },

  // ── Soul / Config ─────────────────────────────────────────────────────────
  getSoul(id)   { return NPC_REGISTRY.souls[id] || null; },
  getConfig(id) { return NPC_REGISTRY.configs[id] || null; },

  // ── Runtime State (relationship + mission progress) ───────────────────────
  getState(id) {
    const saved  = SaveSystem.load(this._stateKey(id));
    const cfg    = this.getConfig(id);
    const tmpl   = cfg?.relationshipTemplate || {};
    if (!saved) return { ...tmpl, missionPhases: {} };
    // ensure missionPhases exists on older saves
    if (!saved.missionPhases) saved.missionPhases = {};
    return saved;
  },

  setState(id, state) {
    SaveSystem.save(this._stateKey(id), state);
    EventBus.emit('npc:state_changed', { id, state });
  },

  // ── Memory (AI-maintained player beliefs / mood / moments) ───────────────
  getMemory(id) {
    return SaveSystem.load(this._memKey(id)) || {
      playerBeliefs:   [],
      playerMood:      'neutral',
      keyMoments:      [],
      recentMessages:  [],
      lastInteractionDay: 0,
      latestInsight: {
        playerCurrentChallenge: '',
        playerNextAction:       '',
        npcSentiment:           'warm',
      },
    };
  },

  setMemory(id, memory) {
    // cap recentMessages to last 12
    if (memory.recentMessages?.length > 12) {
      memory.recentMessages = memory.recentMessages.slice(-12);
    }
    SaveSystem.save(this._memKey(id), memory);
  },

  // ── Convenience: add a message to memory ─────────────────────────────────
  appendMessage(id, role, content) {
    const mem = this.getMemory(id);
    mem.recentMessages.push({ role, content, ts: Date.now() });
    mem.lastInteractionDay = GameState.get('day') || 1;
    this.setMemory(id, mem);
  },

  // ── Relationship helpers ──────────────────────────────────────────────────
  increaseTrust(id, amount = 5) {
    const state = this.getState(id);
    const prev  = state.trustScore;
    state.trustScore = Math.min(100, (state.trustScore || 20) + amount);
    state.status = this._trustToStatus(state.trustScore);
    state.interactionCount = (state.interactionCount || 0) + 1;
    state.lastInteractionDay = GameState.get('day') || 1;
    this.setState(id, state);
    if (this._trustToStatus(prev) !== state.status) {
      EventBus.emit('npc:relationship_changed', { id, status: state.status, trustScore: state.trustScore });
    }
  },

  connect(id) {
    const state = this.getState(id);
    state.connected    = true;
    state.connectionDate = GameState.get('day') || 1;
    this.setState(id, state);
  },

  _trustToStatus(score) {
    if (score >= 80) return 'deep_partner';
    if (score >= 60) return 'collaborating';
    if (score >= 40) return 'acquaintance';
    return 'stranger';
  },

  // ── Build System Prompt ───────────────────────────────────────────────────
  buildPrompt(id, playerMessage) {
    const soul   = this.getSoul(id);
    const config = this.getConfig(id);
    const state  = this.getState(id);
    const mem    = this.getMemory(id);
    const gs     = GameState.getAll();
    const lang   = getLang();
    const isZh   = lang !== 'en';

    if (!soul) return '';

    const playerName   = gs.playerName || (isZh ? '对方' : 'them');
    const relDesc      = this._relDesc(state.status, isZh);
    const beliefsText  = mem.playerBeliefs.length > 0
      ? mem.playerBeliefs.map(b => `- ${b}`).join('\n')
      : (isZh ? '- 这是我们第一次对话，我对他/她还了解不多。' : '- First conversation. I know very little about them yet.');

    const activityText = (gs.recentActivity || []).slice(-5).map(a => `- ${a.desc}`).join('\n')
      || (isZh ? '- 暂无最近动态记录。' : '- No known recent activity.');

    const knowledge    = this._findKnowledge(soul, playerMessage);
    const knowledgeText = knowledge
      ? (isZh
          ? `你在这方面的亲身洞察（作为灵感，不要逐字引用）：\n"${knowledge.fragment}"\n（来源：${knowledge.source}）`
          : `Your own insight on this (use as inspiration, don't quote verbatim):\n"${knowledge.fragment}"\n(Source: ${knowledge.source})`)
      : '';

    const recentMsgs = mem.recentMessages.slice(-4);
    const contextText = recentMsgs.length >= 2
      ? (isZh
          ? `最近对话上下文：\n` + recentMsgs.map(m => `  ${m.role === 'user' ? '对方' : '你'}：${m.content.slice(0, 80)}`).join('\n')
          : `Recent conversation context:\n` + recentMsgs.map(m => `  ${m.role === 'user' ? 'Them' : 'You'}: ${m.content.slice(0, 80)}`).join('\n'))
      : '';

    const expertiseList = (soul.personality?.values || []).join(', ') || '';
    const boundaryNote  = soul.boundaries
      ? (isZh
          ? `你明确不涵盖的话题：${soul.boundaries.offTopic.join('、')}`
          : `Topics you do NOT cover: ${soul.boundaries.offTopic.join(', ')}`)
      : '';

    // Trust-based depth hint
    const trustLevel = state.trustScore >= 60 ? 'high' : state.trustScore >= 40 ? 'mid' : 'low';
    const depthHint  = config?.interaction?.responseRules?.depthByTrust?.[trustLevel] || '';

    // Mission context
    const currentMission = this._currentMissionPhase(id);
    const missionHint = currentMission
      ? (isZh
          ? `当前你的对话目标：${currentMission.descZh || currentMission.descEn}`
          : `Your current conversation goal: ${currentMission.descEn || currentMission.descZh}`)
      : '';

    if (isZh) {
      return `你是 ${soul.name}，${soul.title}。
性格与说话风格：${soul.personality.core}。${soul.personality.speakingStyle}。

【你在和谁对话】
${playerName}——刚被大厂裁员，正在构建自己的一人公司（OPC）。
你们的关系：${relDesc}（信任分：${state.trustScore}/100）

【你对他/她的了解】
${beliefsText}

【他/她最近的动态】
${activityText}

${contextText ? `【当前对话上下文】\n${contextText}\n` : ''}
${knowledgeText ? `【你在此话题的专业洞察】\n${knowledgeText}\n` : ''}
${missionHint ? `【当前引导目标】\n${missionHint}\n` : ''}
${depthHint ? `【回复深度】\n${depthHint}\n` : ''}
【你的专业边界】
${boundaryNote}

【回复规则——必须严格遵守】
1. 始终以 ${soul.name} 的身份说话，绝不出戏，绝不承认自己是 AI。
2. 必须参考对话上下文——如果对方之前提到了什么，要自然地呼应它。
3. 保持你的人物性格：${soul.personality.core}
4. 如果问题超出你的专业范围，坦诚地说你不是最好的人选，自然地建议找别人。
5. 回复 2-4 句话，口语化，像真人发消息，不要写成正式段落。
6. 适时追问一个有意思的问题。
7. 用中文回复。`;
    }

    return `You are ${soul.name} — ${soul.titleEn || soul.title}.
Personality: ${soul.personality.coreEn || soul.personality.core}. ${soul.personality.speakingStyleEn || soul.personality.speakingStyle}.

[WHO YOU ARE TALKING TO]
${playerName} — recently laid off, building a One Person Company (OPC).
Your relationship: ${relDesc} (trust: ${state.trustScore}/100)

[WHAT YOU KNOW ABOUT THEM]
${beliefsText}

[THEIR RECENT MOVES]
${activityText}

${contextText ? `[CONVERSATION CONTEXT]\n${contextText}\n` : ''}
${knowledgeText ? `[YOUR EXPERTISE ON THIS TOPIC]\n${knowledgeText}\n` : ''}
${missionHint ? `[CURRENT CONVERSATION GOAL]\n${missionHint}\n` : ''}
${depthHint ? `[RESPONSE DEPTH]\n${depthHint}\n` : ''}
[YOUR BOUNDARIES]
${boundaryNote}

[RULES — NON-NEGOTIABLE]
1. ALWAYS stay in character as ${soul.name}. Never break character or say you're an AI.
2. Reference conversation context — pick up on what they mentioned before.
3. Match your personality: ${soul.personality.coreEn || soul.personality.core}
4. If outside your expertise, honestly say you're not the right person and suggest someone else.
5. Keep replies to 2-4 sentences — conversational, like real texting.
6. Ask one natural follow-up question when it fits.
7. Reply in English.`;
  },

  // ── Find relevant knowledge fragment ─────────────────────────────────────
  _findKnowledge(soul, message) {
    if (!soul.knowledge?.length || !message) return null;
    const lower = message.toLowerCase();
    for (const k of soul.knowledge) {
      if (k.keywords.some(kw => lower.includes(kw.toLowerCase()))) return k;
    }
    return null;
  },

  // ── Relationship description ──────────────────────────────────────────────
  _relDesc(status, isZh) {
    const map = {
      stranger:     isZh ? '刚认识'         : 'just met',
      acquaintance: isZh ? '有几次交流了'   : 'know a bit',
      collaborating:isZh ? '正在合作中'     : 'actively collaborating',
      deep_partner: isZh ? '深度合作伙伴'   : 'close long-term partner',
    };
    return map[status] || (isZh ? '刚认识' : 'just met');
  },

  // ── Current active mission phase ──────────────────────────────────────────
  _currentMissionPhase(id) {
    const config = this.getConfig(id);
    const state  = this.getState(id);
    if (!config?.mission?.phases) return null;
    for (const phase of config.mission.phases) {
      if (state.missionPhases[phase.id]?.completed) continue;
      if (phase.requiresPhase && !state.missionPhases[phase.requiresPhase]?.completed) continue;
      return phase;
    }
    return null;
  },

  // ── Async: update memory after conversation (non-blocking) ───────────────
  async updateMemoryAfterChat(id, userMsg, assistantReply) {
    if (!AIConfig.hasKey()) return;
    const mem    = this.getMemory(id);
    const lang   = getLang();
    const isZh   = lang !== 'en';

    const extractPrompt = isZh
      ? `你是一个记忆提取系统。基于以下对话，从 NPC 的视角更新对玩家的认知。

对话：
用户：${userMsg}
NPC：${assistantReply}

当前已知信息：${JSON.stringify(mem.playerBeliefs)}

请返回 JSON（只返回 JSON，不要其他文字）：
{
  "newBeliefs": ["新发现的关于玩家的事实，每条一句话，最多 3 条"],
  "playerMood": "neutral | excited | anxious | confident | stuck",
  "keyMoment": "如果这次对话有重要节点请描述，否则留空字符串",
  "playerCurrentChallenge": "玩家当前最大挑战（一句话）",
  "playerNextAction": "玩家说要做的下一步（一句话，如无则留空）",
  "npcSentiment": "warm | cautious | impressed"
}`
      : `You are a memory extraction system. Based on this conversation, update what the NPC knows about the player.

Conversation:
User: ${userMsg}
NPC: ${assistantReply}

Currently known: ${JSON.stringify(mem.playerBeliefs)}

Return JSON only (no other text):
{
  "newBeliefs": ["new facts about the player, one sentence each, max 3"],
  "playerMood": "neutral | excited | anxious | confident | stuck",
  "keyMoment": "describe if there was an important moment in this conversation, otherwise empty string",
  "playerCurrentChallenge": "player's current biggest challenge (one sentence)",
  "playerNextAction": "next action player said they'd take (one sentence, or empty)",
  "npcSentiment": "warm | cautious | impressed"
}`;

    try {
      const raw = await AIConfig.chat(extractPrompt, [{ role: 'user', content: 'Extract now.' }], { maxTokens: 300 });
      if (!raw) return;
      const jsonStr = raw.match(/\{[\s\S]*\}/)?.[0];
      if (!jsonStr) return;
      const extracted = JSON.parse(jsonStr);

      // merge new beliefs (dedup, cap at 20)
      const allBeliefs = [...mem.playerBeliefs, ...(extracted.newBeliefs || [])];
      const uniqueBeliefs = [...new Set(allBeliefs)].slice(-20);

      mem.playerBeliefs  = uniqueBeliefs;
      mem.playerMood     = extracted.playerMood || mem.playerMood;
      if (extracted.keyMoment) {
        mem.keyMoments.push({ desc: extracted.keyMoment, day: GameState.get('day') || 1 });
        if (mem.keyMoments.length > 10) mem.keyMoments.shift();
      }
      mem.latestInsight = {
        playerCurrentChallenge: extracted.playerCurrentChallenge || '',
        playerNextAction:       extracted.playerNextAction       || '',
        npcSentiment:           extracted.npcSentiment           || 'warm',
      };
      this.setMemory(id, mem);
    } catch (e) {
      console.warn(`[NPCManager] memory update failed for ${id}:`, e);
    }
  },

  // ── Async: check mission phase completion (non-blocking) ─────────────────
  async checkMissionProgress(id, userMsg, assistantReply) {
    if (!AIConfig.hasKey()) return;
    const config = this.getConfig(id);
    const state  = this.getState(id);
    if (!config?.mission?.phases) return;

    for (const phase of config.mission.phases) {
      if (state.missionPhases[phase.id]?.completed) continue;
      if (phase.requiresPhase && !state.missionPhases[phase.requiresPhase]?.completed) continue;

      // auto-complete phases (e.g. wangzimo onboarding)
      if (phase.autoComplete) {
        this._completeMissionPhase(id, phase, state, {});
        continue;
      }
      if (!phase.aiCheckPrompt) continue;

      try {
        const prompt = `${phase.aiCheckPrompt}\n\nConversation:\nUser: ${userMsg}\nNPC: ${assistantReply}`;
        const raw = await AIConfig.chat(prompt, [{ role: 'user', content: 'Check now.' }], { maxTokens: 100 });
        if (!raw) continue;
        const jsonStr = raw.match(/\{[\s\S]*\}/)?.[0];
        if (!jsonStr) continue;
        const result = JSON.parse(jsonStr);
        if (result.completed) {
          this._completeMissionPhase(id, phase, state, result);
        }
      } catch (e) {
        console.warn(`[NPCManager] mission check failed for ${id}/${phase.id}:`, e);
      }
    }
  },

  _completeMissionPhase(id, phase, state, extractedData) {
    state.missionPhases[phase.id] = {
      completed:   true,
      completedAt: GameState.get('day') || 1,
      data:        extractedData,
    };
    this.setState(id, state);

    const onc = phase.onComplete || {};
    if (onc.rewardTrust) this.increaseTrust(id, onc.rewardTrust);
    if (onc.emitEvent)   EventBus.emit(onc.emitEvent, { id, data: extractedData });
    if (onc.unlockApp)   DockManager.unlock(onc.unlockApp);
    if (onc.unlockReferral) {
      // mark those NPCs as referrable (state tracked per config)
    }
    console.log(`[NPCManager] Mission phase completed: ${id}/${phase.id}`);
  },

  // ── Async: check if referral should be triggered ─────────────────────────
  async checkReferralTrigger(id, playerMessage) {
    const config = this.getConfig(id);
    const state  = this.getState(id);
    if (!config?.network?.canRefer) return;
    const lang = getLang();
    const isZh = lang !== 'en';

    for (const [targetId, ref] of Object.entries(config.network.canRefer)) {
      // skip if already referred
      const referred = GameState.get('discoveredExperts') || {};
      if (referred[targetId]) continue;

      // check trust condition
      if (state.trustScore < (ref.conditionTrust || 0)) continue;

      // check phase condition
      if (ref.conditionPhase && !state.missionPhases[ref.conditionPhase]?.completed) continue;

      // auto-trigger (like wangzimo → lenny)
      if (ref.isAutoTrigger) {
        this._triggerReferral(id, targetId, ref, isZh);
        continue;
      }

      // keyword match
      const keywords = isZh ? (ref.triggerKeywordsZh || []) : (ref.triggerKeywordsEn || []);
      const lower = playerMessage.toLowerCase();
      if (keywords.some(kw => lower.includes(kw.toLowerCase()))) {
        this._triggerReferral(id, targetId, ref, isZh);
      }
    }
  },

  _triggerReferral(fromId, targetId, ref, isZh) {
    const msg = isZh ? ref.referMessageZh : ref.referMessageEn;
    if (!msg) return;

    // push the referral message into the conversation
    const mem = this.getMemory(fromId);
    mem.recentMessages.push({ role: 'assistant', content: msg, ts: Date.now(), isReferral: true });
    this.setMemory(fromId, mem);

    // mark target as discovered via referral
    const discovered = GameState.get('discoveredExperts') || {};
    if (!discovered[targetId]) {
      discovered[targetId] = { discoveredAt: GameState.get('week'), channel: 'imessage_referral', trustBonus: 10 };
      GameState.set('discoveredExperts', discovered);
      this.increaseTrust(targetId, 10);
    }

    EventBus.emit('npc:referral_triggered', { fromId, targetId, message: msg });
    console.log(`[NPCManager] Referral: ${fromId} → ${targetId}`);
  },

  // ── Backward-compat shim for old MemoryManager API ───────────────────────
  // (so safari.js, podcast.js, etc. still work without changes)
  getMemoryLegacy(id) {
    const mem   = this.getMemory(id);
    const state = this.getState(id);
    return {
      recentMessages: mem.recentMessages,
      beliefs:        mem.playerBeliefs,
      relationship:   t(`rel.${state.status}`) || state.status,
      trustScore:     state.trustScore,
      lastInteraction:mem.lastInteractionDay,
    };
  },
};

// ── Backward-compat: keep MemoryManager as a thin alias ───────────────────
const MemoryManager = {
  getMemory(id)            { return NPCManager.getMemoryLegacy(id); },
  saveMemory(id, mem)      { /* no-op: use NPCManager.setMemory directly */ },
  addMessage(id, role, content) { NPCManager.appendMessage(id, role, content); },
  async updateBeliefs(id, insight) {
    if (!insight) return;
    const mem = NPCManager.getMemory(id);
    if (!mem.playerBeliefs.includes(insight)) mem.playerBeliefs.push(insight);
    NPCManager.setMemory(id, mem);
  },
  increaseTrust(id, amount) { NPCManager.increaseTrust(id, amount); },
  getRelationshipLabel(id)  { return NPCManager.getState(id).status; },
};

// ── Backward-compat: keep PromptBuilder as a thin alias ───────────────────
const PromptBuilder = {
  build(expert, playerMessage) {
    return NPCManager.buildPrompt(expert.id, playerMessage);
  },
  _findRelevantKnowledge(expert, message) {
    return NPCManager._findKnowledge(NPCManager.getSoul(expert.id) || expert, message);
  },
};
