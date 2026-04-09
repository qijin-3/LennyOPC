'use strict';

// AI-driven event engine: evaluates player activity every 2 game hours
// and generates organic events (emails, notifications, opportunities)

const GAME_MASTER_SYSTEM = `You are the Game Master of "OPC Founder", a browser-based narrative strategy game.
The player was recently laid off from a tech company and is building a One Person Company (OPC) targeting $10M valuation.
Your job is to evaluate the player's recent activity and decide whether a meaningful game event should occur.

You MUST respond with valid JSON only, no markdown, no explanation outside JSON.
Response format:
{
  "event": "mail" | "imessage" | "notification" | "none",
  "type": "opportunity" | "social" | "risk" | "reward" | "info",
  "channel": "mail" | "imessage",
  "from": "Sender Name",
  "fromId": "sender_id_or_email",
  "subject": "Email subject (mail only)",
  "body": "Message body (2-4 paragraphs for mail, 1-2 sentences for imessage)",
  "effects": { "cash": 0, "reputation": 0, "network": 0, "insightFragments": 0 },
  "choices": [
    { "label": "Choice A", "effect": { "reputation": 2 }, "log": "choice_a" },
    { "label": "Choice B", "effect": { "cash": 5000 }, "log": "choice_b" }
  ],
  "addTodo": { "title": "Todo title", "priority": "normal" },
  "reason": "Brief internal reason"
}

CHANNEL SELECTION RULES:
- Use "mail" for: formal business (client inquiries, contracts, VC outreach, media)
- Use "imessage" for: friends, informal advice, peer-to-peer, referrals from known contacts
- Use "notification" for: system alerts, deadline reminders only

NARRATIVE CONSTRAINTS (CRITICAL - violating these breaks immersion):
1. WEEK 1: ONLY allow friend check-in iMessages. NO business opportunities whatsoever.
   Nobody knows the player just got laid off except close friends.
2. WEEK 2: Light opportunities only IF player has taken action (searched, messaged someone).
   Even then, only through warm introductions (friends-of-friends), never cold.
3. WEEK 3+: Organic opportunities based on player's actual reputation and network.
4. VC CONTACT: Only allowed when reputation >= 40 AND player has published content.
   VCs don't cold-contact someone with zero public presence.
5. REFERRALS: Only from contacts with relationship >= "Collaborating" (trust >= 60).
6. FREQUENCY: Max 1 significant event per game day. Same event type needs 3+ day gap.
7. COLD OPPORTUNITIES: Never send cold business emails in weeks 1-2.
   The player's project is unknown to the world until they share it.

Always make events feel EARNED, not random.`;


const AIEventEngine = {
  _lastEvalHour: -1,
  _lastEventType: null,
  _evaluating: false,
  _enabled: true,

  init() {
    EventBus.on('clock:hour', ({ day, hour }) => {
      // Evaluate every 2 game hours (offset from last eval)
      if (this._enabled && !this._evaluating && AIConfig.hasKey()) {
        if (hour % 2 === 0 && hour !== this._lastEvalHour) {
          this._lastEvalHour = hour;
          setTimeout(() => this.evaluate(), 500 + Math.random() * 2000);
        }
      }
    });

    EventBus.on('clock:week', ({ week }) => {
      // Always evaluate at week start
      this._lastEvalHour = -1;
    });
  },

  async evaluate() {
    if (this._evaluating || !AIConfig.hasKey()) return;
    this._evaluating = true;

    try {
      const context = this._buildContext();
      // Only evaluate if there's meaningful activity
      if (context.recentActivityCount === 0 && context.week <= 1) {
        this._evaluating = false;
        return;
      }

      const prompt = this._buildPrompt(context);
      const raw = await AIConfig.chat(GAME_MASTER_SYSTEM, [{ role: 'user', content: prompt }], { maxTokens: 600 });

      if (raw) {
        this._processResponse(raw, context);
      }
    } catch (e) {
      console.warn('AIEventEngine evaluate error:', e);
    }
    this._evaluating = false;
  },

  _buildContext() {
    const state = GameState.getAll();
    const recentActivity = ActivityLogger.getRecent(8);
    const discoveredExperts = Object.keys(state.discoveredExperts || {});
    const npcMemory = state.npcMemory || {};

    // Summarize expert interactions
    const expertInteractions = discoveredExperts.map(id => {
      const mem = npcMemory[id] || {};
      const expert = EXPERTS.find(e => e.id === id);
      return { name: expert?.name || id, msgCount: (mem.recentMessages || []).length, trust: mem.trustScore || 0, relationship: mem.relationship || '' };
    }).filter(e => e.msgCount > 0);

    return {
      week: state.week,
      day: GameClock.getDay(),
      hour: GameClock.getHour(),
      phase: state.phase,
      cash: state.cash,
      reputation: state.reputation,
      network: state.network,
      insightFragments: state.insightFragments || 0,
      discoveredExpertCount: discoveredExperts.length,
      expertInteractions,
      recentActivity: recentActivity.map(a => a.desc),
      recentActivityCount: recentActivity.length,
      lastEventType: this._lastEventType,
      milestones: state.milestones || {},
      communityContribution: state.communityContribution || 0,
      lang: getLang()
    };
  },

  _buildPrompt(ctx) {
    const activityList = ctx.recentActivity.length > 0
      ? ctx.recentActivity.map(a => `- ${a}`).join('\n')
      : (ctx.lang === 'en' ? '- No recent activity' : '- 最近无明显行动');

    const expertList = ctx.expertInteractions.length > 0
      ? ctx.expertInteractions.map(e => `- ${e.name}: ${e.msgCount} messages, trust ${e.trust}, relationship: ${e.relationship}`).join('\n')
      : (ctx.lang === 'en' ? 'None yet' : '尚未与任何专家深入对话');

    if (ctx.lang === 'en') {
      return `GAME STATE SNAPSHOT:
- Week: ${ctx.week}, Day: ${ctx.day}, Hour: ${ctx.hour}:00
- Phase: ${ctx.phase} | Cash: ¥${ctx.cash.toLocaleString()} | Reputation: ${ctx.reputation} | Network: ${ctx.network}
- Experts discovered: ${ctx.discoveredExpertCount} | Insights: ${ctx.insightFragments}
- Community contribution: ${ctx.communityContribution}
- Milestones: ${JSON.stringify(ctx.milestones)}
- Last event type generated: ${ctx.lastEventType || 'none'}

PLAYER'S RECENT ACTIVITY (last 8 actions):
${activityList}

EXPERT RELATIONSHIP STATUS:
${expertList}

EVALUATION TASK:
Based on the above, decide if a meaningful game event should occur RIGHT NOW.

Think about:
1. Has the player been actively messaging experts? → Could trigger a referral or collaboration email
2. Has the player been searching specific topics? → Could surface a relevant opportunity
3. Is cash getting low? → Could trigger an urgent opportunity or warning
4. Has the player been inactive? → Could be fine to skip
5. Would an event feel earned and organic right now?

Respond with JSON only.`;
    }

    return `游戏状态快照：
- 第 ${ctx.week} 周，第 ${ctx.day} 天，${ctx.hour}:00
- 阶段：${ctx.phase} | 现金：¥${ctx.cash.toLocaleString()} | 声誉：${ctx.reputation} | 人脉：${ctx.network}
- 已发现专家：${ctx.discoveredExpertCount} | 洞察碎片：${ctx.insightFragments}
- 社群贡献：${ctx.communityContribution}
- 里程碑：${JSON.stringify(ctx.milestones)}
- 上次产生的事件类型：${ctx.lastEventType || '无'}

玩家最近的行动（最近8条）：
${activityList}

专家关系状态：
${expertList}

判断任务：
基于以上信息，判断现在是否应该发生一个有意义的游戏事件。

考虑因素：
1. 玩家最近在和专家深入对话吗？→ 可能触发引荐或合作邀请邮件
2. 玩家在搜索特定方向吗？→ 可能出现相关机会
3. 现金低于 1 万了吗？→ 可能触发紧急机会或警告
4. 玩家最近完全没有行动？→ 可以跳过
5. 现在产生事件会感觉自然、有意义吗？

只返回 JSON，不要任何额外说明。`;
  },

  _processResponse(raw, context) {
    let data;
    try {
      // Extract JSON from response (handle cases where model adds extra text)
      const match = raw.match(/\{[\s\S]*\}/);
      if (!match) return;
      data = JSON.parse(match[0]);
    } catch (e) {
      console.warn('AIEventEngine: failed to parse response', raw.slice(0, 100));
      return;
    }

    if (!data || data.event === 'none') return;

    this._lastEventType = data.type;

    if (data.event === 'notification') {
      const icons = { opportunity: '💡', social: '👥', risk: '⚠️', reward: '🎉', info: 'ℹ️' };
      NotificationSystem.show(icons[data.type] || '📢', data.subject || data.body?.slice(0, 50) || '', 6000);
      this._applyEffects(data.effects);
    }

    if (data.event === 'email' && data.subject && data.body) {
      const emailId = `ai_evt_${Date.now()}`;
      const email = {
        id: emailId,
        type: data.type === 'opportunity' ? 'C' : 'A',
        from: data.from || 'Unknown <unknown@email.com>',
        fromShort: (data.from || '').split('<')[0].trim() || 'Unknown',
        subject: data.subject,
        body: data.body,
        avatar: { opportunity: '💡', social: '👥', risk: '⚠️', reward: '🎉', info: 'ℹ️' }[data.type] || '📧',
        received: context.week,
        read: false,
        effect: data.effects || {},
        choices: data.choices || null,
        aiGenerated: true
      };

      const emails = GameState.get('pendingEmails') || [];
      emails.push(email);
      GameState.set('pendingEmails', emails);

      const label = context.lang === 'en' ? 'New Email' : '新邮件';
      NotificationSystem.show('📧 Mail', `${label}: ${data.subject}`, 0);
      EventBus.emit('mail:new', email);
    }
  },

  _applyEffects(effects) {
    if (!effects) return;
    const keys = ['cash', 'reputation', 'network', 'insightFragments'];
    keys.forEach(k => {
      if (effects[k]) {
        const cur = GameState.get(k) || 0;
        GameState.set(k, Math.max(0, cur + effects[k]));
      }
    });
  },

  // Manual trigger for testing
  forceEvaluate() {
    this._lastEvalHour = -1;
    return this.evaluate();
  }
};
