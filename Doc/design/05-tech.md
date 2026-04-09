# 05 — 技术架构

## 5.1 运行环境

- **运行方式**：浏览器本地打开 `index.html`（无需服务器、无需 build、无需 npm）
- **存储**：`localStorage`，所有键名以 `opc_` 开头
- **依赖**：零第三方 JS 框架，纯原生 JS（ES2020+）
- **兼容性**：Chrome / Safari / Edge 最新版

---

## 5.2 文件结构

```
LennyOPC/
├── index.html                 # 入口，script 加载顺序严格
├── css/
│   ├── base.css              # 全局变量、reset、desktop 布局
│   ├── apps.css              # 所有 App 的组件样式
│   └── overlays.css          # 弹层：登录、通知、暂停遮罩
├── data/
│   ├── i18n.js               # 翻译键值（711 行，中/英双语）
│   └── experts/
│       ├── lenny_rachitsky.js
│       ├── jason_fried.js
│       ├── april_dunford.js
│       ├── patrick_campbell.js
│       ├── shreyas_doshi.js
│       ├── elena_verna.js
│       ├── ryan_hoover.js
│       ├── julie_zhuo.js
│       ├── andrew_wilkinson.js
│       ├── brian_balfour.js
│       └── index.js          # 聚合为 EXPERTS 数组 + FALLBACK_RESPONSES
├── js/
│   ├── core.js               # EventBus, SaveSystem, GameState, AIConfig, AI_PROVIDERS
│   ├── clock.js              # GameClock, ActivityLogger
│   ├── engine.js             # EVENT_TEMPLATES, ACTION_DEFS, WeekCycleEngine
│   ├── ui.js                 # NotificationSystem, WindowManager, APPS, DockManager, MenuBarManager, Spotlight
│   ├── main.js               # Onboarding, init()
│   ├── ai-event-engine.js    # AIEventEngine
│   └── apps/
│       ├── settings.js       # 设置（5 个 Tab）
│       ├── mail.js           # 邮件（三栏，A/B/C 类型）
│       ├── imessage.js       # Telegram（王子墨 + 引荐专家）
│       ├── todo.js           # 待办（承诺追踪，NPC 联动）
│       ├── calendar.js       # 日历（只读时间线）
│       ├── numbers.js        # 数据看板
│       ├── podcast.js        # 播客（YouTube 嵌入）
│       ├── safari.js         # Safari（DuckDuckGo + Lenny X DM 流程）
│       ├── discord.js        # Discord 社群
│       └── contacts.js       # Canvas 人脉图
└── Doc/
    ├── design/               # PRD v3.1（本文档目录）
    ├── avatars/              # 专家像素风头像（.webp）
    ├── lenny/
    │   ├── 02-newsletters/   # Lenny Newsletter 原文（.md）
    │   └── 03-podcasts/      # Lenny Podcast 转录（.md）
    └── PRD_v2_archived.md    # 旧版 PRD 归档
```

---

## 5.3 Script 加载顺序（index.html）

```html
<!-- 基础数据层（无依赖）-->
<script src="data/i18n.js"></script>
<script src="js/core.js"></script>          <!-- EventBus, SaveSystem, GameState, AIConfig -->
<script src="js/clock.js"></script>         <!-- GameClock, ActivityLogger（依赖 GameState）-->
<script src="js/engine.js"></script>        <!-- WeekCycleEngine（依赖 GameState, EventBus）-->

<!-- 专家数据（依赖 core.js 的全局变量）-->
<script src="data/experts/lenny_rachitsky.js"></script>
<!-- ... 其他 9 个专家文件 ... -->
<script src="data/experts/index.js"></script>   <!-- 聚合 EXPERTS 数组 -->

<!-- UI 系统（依赖 GameState, EXPERTS）-->
<script src="js/ui.js"></script>

<!-- Apps（顺序：被依赖少的先加载）-->
<script src="js/apps/settings.js"></script>
<script src="js/apps/mail.js"></script>
<script src="js/apps/todo.js"></script>         <!-- MemoryManager 定义在此 -->
<script src="js/apps/imessage.js"></script>     <!-- 依赖 TodoApp, MemoryManager -->
<script src="js/apps/calendar.js"></script>
<script src="js/apps/numbers.js"></script>
<script src="js/apps/podcast.js"></script>
<script src="js/apps/safari.js"></script>       <!-- 依赖 MemoryManager, TodoApp, ActivityLogger -->
<script src="js/apps/discord.js"></script>
<script src="js/apps/contacts.js"></script>

<!-- 游戏逻辑（最后，依赖所有 App）-->
<script src="js/ai-event-engine.js"></script>
<script src="js/main.js"></script>
```

---

## 5.4 核心数据结构

### GameState（`opc_gamestate`）

```js
{
  // 核心资源
  cash: 47200,
  reputation: 10,
  network: 5,
  insightFragments: 0,
  communityContribution: 0,

  // 时间
  day: 1,               // 游戏天数，连续递增
  _clockHour: 8,        // 当前游戏小时（时钟持久化）
  _clockSpeed: 1,       // 时钟速度（时钟持久化）

  // 玩家信息
  playerName: null,
  playerProfile: { direction: null, actions: [], milestones: [] },
  opc_goals: null,      // 待实现：{ direction, targetAudience, goal, milestones[] }

  // NPC 系统
  npcMemory: {
    // [expertId]: { recentMessages[], beliefs[], relationship, trustScore, lastInteraction }
  },
  discoveredExperts: {
    // [expertId]: { discoveredAt, channel, trustBonus }
  },
  addedContacts: [],    // 已添加到 Telegram 的专家 ID 列表

  // 邮件与消息
  pendingEmails: [],
  pendingIMessages: [],

  // 进度追踪
  milestones: {
    terminationAcknowledged: false,
    onboardingComplete: false,
    firstIncome: false,
    firstPaidClient: false,
  },
  achievements: [],
  vcOffersDeclined: 0,

  // 内容与历史
  publishedContent: [],
  listenedEpisodes: [],    // [expertId, expertId, ...]（可重复）
  recentActivity: [],      // 最近 30 条 ActivityLogger 记录

  // 解锁状态
  unlockedApps: ['mail', 'imessage', 'todo', 'settings'],
  gameStartedAt: null
}
```

### NPC Memory（`npcMemory[expertId]`）

```js
{
  recentMessages: [],    // 最近 10 条，{ role: 'user'|'assistant', content }
  beliefs: [],           // AI 对玩家的认知，最多 10 条字符串
  relationship: '陌生',  // 陌生 | 认识 | 合作中 | 深度伙伴
  trustScore: 20,
  lastInteraction: 0     // 最后交互的游戏天数
}
```

### Todo（`opc_todos`，独立于 GameState）

```js
{
  id: 'todo_xxx',
  title: '找到第一个付费客户',
  source: 'lenny_onboarding',  // mail | telegram | system | ai_event | player
  priority: 'high',            // high | normal | low
  npcId: null,                 // 关联 NPC（逾期降信任分）
  scheduledDay: null,
  dueDay: 30,
  completed: false,
  createdAt: 5,
  isMilestone: false
}
```

### Expert 数据结构

```js
{
  id: 'lenny_rachitsky',
  name: 'Lenny Rachitsky',
  title: '前 Airbnb PM，播客主持人',
  avatarEmoji: '🎙️',
  personality: '直接、好奇、数据驱动，喜欢追问「为什么」',
  expertise: ['PMF', 'growth', 'pricing', 'product strategy', 'career', 'B2C', 'B2B'],
  boundaries: {
    offTopic: ['法律合同', '财务会计', '技术架构', '编程', ...],
    deflect: '这个我真的不太懂，建议找专业人士',
    enDeflect: "Honestly that's outside what I know well — I'd reach out to someone who specializes in that"
  },
  youtubeId: 'TwfAJDrUGfo',
  consultFee: 800,
  unlockCondition: 'initial',
  introMessage: '嘿！我是 Lenny...',
  network: ['jason_fried', 'shreyas_doshi', ...],
  knowledge: [
    { topic, keywords[], fragment, source, depth }
  ],
  fallbackReplies: [...]   // 静态备用回复（AI 失败时使用）
}
```

---

## 5.5 AI 集成规范

### 支持的服务商

| 服务商 | 协议 | 推荐模型 | 国内可用 |
|--------|------|---------|---------|
| 智谱 GLM | openai_compat | glm-4-flash（免费）| ✅ |
| Kimi（月之暗面）| openai_compat | moonshot-v1-8k | ✅ |
| MiniMax | openai_compat | abab6.5s-chat | ✅ |
| DeepSeek | openai_compat | deepseek-chat | ✅ |
| 通义千问（Qwen）| openai_compat | qwen-turbo | ✅ |
| Claude（Anthropic）| claude | claude-3-5-haiku | ❌ 需代理 |
| OpenAI | openai_compat | gpt-4o-mini | ❌ 需代理 |
| Google Gemini | gemini | gemini-2.0-flash | ❌ 需代理 |
| 自定义 | openai_compat | 自定义 | 视情况 |

### AIConfig.chat() 调用规范

```js
// 所有 NPC 对话统一调用
const response = await AIConfig.chat(systemPrompt, messages, { maxTokens: 400 });

// systemPrompt = PromptBuilder.build(expert, playerMessage)
// messages = mem.recentMessages.slice(-6)（最近 6 条历史）
```

### PromptBuilder 注入内容

1. 角色定义（name + title + personality）
2. 对话对象（playerName + day + 关系层级）
3. 玩家 beliefs（NPC 的认知，最多 10 条）
4. 玩家近期活动（ActivityLogger 最近 5 条）
5. 对话上下文（最近 4 条消息）
6. 知识片段（关键词匹配时注入，标注「不得逐字引用」）
7. 专业边界（offTopic 列表）
8. 8 条强制回复规则（不出戏/引用上下文/保持性格/边界拒绝等）

---

## 5.6 EventBus 主要事件

| 事件 | 发出者 | 监听者 | 数据 |
|------|--------|--------|------|
| `clock:hour` | GameClock | AIEventEngine | `{ day, hour }` |
| `clock:day` | GameClock | WeekCycleEngine, TodoApp | `{ day }` |
| `game:over` | GameClock | WeekCycleEngine | `{ reason: 'cash' }` |
| `state:changed` | GameState.set() | ui.js(day→菜单栏) | `{ key, value }` |
| `activity:logged` | ActivityLogger | - | entry 对象 |
| `expert:added` | safari.js, imessage.js | - | `{ expertId }` |
| `relationship:changed` | MemoryManager | - | `{ expertId, relationship }` |
| `opc_goals:set` | 计划中 | - | goals 对象 |

---

## 5.7 i18n 规范

```js
// 使用方式
t('app.mail')                    // → '邮件' / 'Mail'
t('week.label', { n: 3 })        // → '第 3 天' / 'Day 3'（已更新为天数）

// 语言切换
getLang()                         // → 'zh' | 'en'
setLang('en')                     // 切换并持久化到 localStorage

// NPC system prompt 语言感知
if (getLang() === 'en') { /* 返回英文 prompt */ }
```

翻译键值共 711 行，覆盖所有 App 界面文字、通知、成就名称、NPC 触发消息等。

---

## 5.8 模块依赖关系

```
core.js (GameState, EventBus, AIConfig)
    ↑ 被所有模块依赖

clock.js → GameState（读写 day/_clockHour/_clockSpeed）
         → EventBus（发出 clock:hour/day/game:over）

engine.js → EventBus（监听 clock:day）
          → GameState（注入 pendingEmails）
          → DockManager（解锁 App）

ai-event-engine.js → AIConfig（调用 AI）
                   → GameState（读取玩家状态）
                   → EventBus（监听 clock:hour）
                   → iMessageApp（注入 Telegram 消息）
                   → MailApp（注入邮件）

messages apps → AIConfig（对话生成）
             → MemoryManager（记忆读写）
             → ActivityLogger（行为记录）
             → TodoApp（自动创建待办）
```
