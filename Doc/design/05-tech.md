# 05 — 技术架构

## 5.1 运行环境

- **运行方式**：浏览器本地打开 `index.html`（无需服务器，无需 build）
- **存储**：`localStorage`，所有键名以 `opc_` 开头
- **依赖**：无任何第三方 JS 框架，纯原生 JS
- **兼容性**：Chrome / Safari / Edge 最新版

## 5.2 文件结构

```
LennyOPC/
├── index.html                 # 入口，script 加载顺序严格
├── css/
│   ├── base.css              # 全局变量、reset、desktop 布局
│   ├── apps.css              # 所有 App 的组件样式
│   └── overlays.css          # 弹层：登录、通知、周结算、咨询确认
├── data/
│   ├── i18n.js               # 翻译键值（250+ keys，中/英）
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
│       └── index.js          # 聚合为 EXPERTS 数组
├── js/
│   ├── core.js               # EventBus, SaveSystem, GameState, AIConfig, AIConfig providers
│   ├── clock.js              # GameClock（实时时钟）, ActivityLogger
│   ├── engine.js             # EVENT_TEMPLATES, ACTION_DEFS, WeekCycleEngine
│   ├── ui.js                 # WindowManager, DockManager, MenuBarManager, APPS
│   ├── main.js               # Onboarding, init()
│   ├── ai-event-engine.js    # AIEventEngine（每2游戏小时评估，生成事件）
│   └── apps/
│       ├── settings.js       # 设置（AI配置、玩家档案、存档、语言）
│       ├── mail.js           # 邮件（裁员通知、商务邮件）
│       ├── imessage.js       # Telegram App（王子墨 AI 伴侣）
│       ├── todo.js           # 待办（里程碑、承诺追踪）
│       ├── calendar.js       # 日历（只读，Todo 日程视图）
│       ├── numbers.js        # 数据看板
│       ├── messages.js       # Messages（专家深度对话）+ MemoryManager + PromptBuilder
│       ├── podcast.js        # 播客（YouTube 嵌入 + 洞察碎片）
│       ├── safari.js         # Safari（真实搜索 + Lenny X DM 流程）
│       ├── discord.js        # Discord 社群
│       └── contacts.js       # 人脉关系图
└── Doc/
    └── design/               # 本文档目录
```

## 5.3 Script 加载顺序（index.html）

```html
<!-- 基础 -->
<script src="data/i18n.js"></script>
<script src="js/core.js"></script>
<script src="js/clock.js"></script>
<script src="js/engine.js"></script>

<!-- 专家数据 -->
<script src="data/experts/lenny_rachitsky.js"></script>
<!-- ... 其他专家 ... -->
<script src="data/experts/index.js"></script>

<!-- UI 系统 -->
<script src="js/ui.js"></script>

<!-- Apps（顺序：依赖少的先加载）-->
<script src="js/apps/settings.js"></script>
<script src="js/apps/mail.js"></script>
<script src="js/apps/todo.js"></script>
<script src="js/apps/imessage.js"></script>
<script src="js/apps/calendar.js"></script>
<script src="js/apps/numbers.js"></script>
<script src="js/apps/messages.js"></script>   <!-- 包含 MemoryManager, PromptBuilder -->
<script src="js/apps/podcast.js"></script>
<script src="js/apps/safari.js"></script>
<script src="js/apps/discord.js"></script>
<script src="js/apps/contacts.js"></script>

<!-- 游戏逻辑（最后）-->
<script src="js/ai-event-engine.js"></script>
<script src="js/main.js"></script>
```

## 5.4 核心数据结构

### GameState（localStorage: `opc_gamestate`）

```js
{
  // 基础资源
  cash: 47200,
  reputation: 10,
  network: 5,
  insightFragments: 0,
  communityContribution: 0,

  // 时间（天）
  day: 1,                   // 游戏天数（替代 week）

  // 玩家信息
  playerName: '张伟',
  playerProfile: { direction: null, actions: [], milestones: [] },

  // OPC 目标（Onboarding 完成后设置）
  opc_goals: {
    direction: null,
    targetAudience: null,
    goal: null,
    createdAt: null,
    milestones: []
  },

  // NPC 系统
  npcMemory: {},            // { [expertId]: { recentMessages, beliefs, relationship, trustScore } }
  discoveredExperts: {},    // { [expertId]: { discoveredAt, channel, trustBonus } }
  addedContacts: [],        // 已添加到 Messages 的专家 ID 列表

  // 邮件系统
  pendingEmails: [],

  // 成就 & 里程碑
  achievements: [],
  milestones: {
    terminationAcknowledged: false,
    onboardingComplete: false,      // Lenny 帮玩家设定好 OPC 方向后为 true
    firstPaidClient: false,
    // ... 其他系统里程碑
  },

  // 内容 & 历史
  listenedEpisodes: [],
  publishedContent: [],
  recentActivity: [],       // 最近 30 条活动日志（ActivityLogger）

  // 已解锁的 App
  unlockedApps: ['mail', 'imessage', 'todo', 'settings'],

  // 其他
  vcOffersDeclined: 0,
  pendingIMessages: [],
  gameStartedAt: null
}
```

### NPC Memory（`GameState.npcMemory[expertId]`）

```js
{
  recentMessages: [],    // 最近 10 条，{ role, content }
  beliefs: [],           // AI 对玩家的认知，最多 10 条
  relationship: '陌生',
  trustScore: 20,
  lastInteraction: 0     // 游戏第几天
}
```

### Todo Item（`SaveSystem: opc_todos`）

```js
{
  id: 'todo_xxx',
  title: '找到第一个付费客户',
  source: 'lenny_onboarding',   // mail | telegram | system | ai_event | player | lenny_onboarding
  sourceRef: null,
  priority: 'high',
  npcId: null,                  // 承诺给某个 NPC，逾期降低信任度
  scheduledDay: null,           // 计划在第几天完成（在 Calendar 中显示）
  dueDay: 30,                   // 截止天数
  completed: false,
  createdAt: 5,                 // 游戏第几天创建
  completedAt: null,
  isMilestone: true             // 是否是 OPC 里程碑
}
```

### OPC Goals（`GameState.opc_goals`）

```js
{
  direction: 'B2B SaaS 产品顾问',
  targetAudience: '10-50人规模的初创公司',
  goal: '6个月内月收入¥10,000',
  createdAt: 3,           // 游戏第几天设定
  milestones: [
    {
      id: 'ms_001',
      title: '确定服务定价和方案',
      priority: 'high',
      dueDay: 7,
      completed: false,
      completedAt: null
    }
  ]
}
```

## 5.5 AI 集成规范

### 支持的服务商（9个）

| 服务商 | 协议 | 推荐模型 | 国内可用 |
|--------|------|---------|--------|
| GLM (智谱) | OpenAI compat | glm-4-flash | ✅ 免费 |
| Kimi (月之暗面) | OpenAI compat | moonshot-v1-8k | ✅ |
| MiniMax | OpenAI compat | abab6.5s-chat | ✅ |
| DeepSeek | OpenAI compat | deepseek-chat | ✅ |
| Qwen (通义) | OpenAI compat | qwen-turbo | ✅ |
| Claude | Anthropic | claude-3-5-sonnet | ❌ 需代理 |
| OpenAI | OpenAI | gpt-4o | ❌ 需代理 |
| Gemini | Google | gemini-1.5-flash | ❌ 需代理 |
| Custom | OpenAI compat | 自定义 | 视代理 |

### NPC 对话 Prompt 架构

```
System Prompt = 角色人设 + 关系上下文 + 知识片段（可选）
User History = 最近 6-8 条对话记录
Current Message = 玩家当前输入
```

关键原则：
- 所有 NPC 对话**强制经过 LLM**，无任何 fallback 模板
- 无 API Key 时显示配置提示，禁用输入框
- 知识片段（`knowledge[]`）仅注入 prompt，LLM 用自己的语气转述

### Lenny Onboarding Prompt

见 [02-mechanics.md § 2.3 阶段 4](./02-mechanics.md)

### 语言切换

- `getLang()` / `setLang()` 控制界面语言
- 所有 NPC System Prompt 根据 `getLang()` 返回中英文版本
- 玩家选择的语言持久化到 localStorage

## 5.6 时钟系统（GameClock）

```js
// js/clock.js
const GameClock = {
  // 真实 2 分钟 = 游戏 1 小时
  // 2min * 60s/min * 1000ms/s = 120,000ms per game hour
  REAL_MS_PER_GAME_HOUR: 120000,

  _speed: 1,    // 0.5 | 1 | 2 | 4
  _paused: false,
  _gameHour: 8, // 游戏当前小时（0-23）
  _gameDay: 1,  // 游戏天数

  // Events emitted:
  // clock:hour  — 每游戏小时
  // clock:day   — 每游戏天（取代 clock:week）
}
```

## 5.7 i18n 规范

- 翻译函数：`t(key, vars = {})` 支持 `{{var}}` 插值
- 语言文件：`data/i18n.js`（250+ keys）
- 语言持久化：`SaveSystem.save('lang', 'zh')`
- 所有界面文本必须经过 `t()` 函数
- 动态文本（NPC 消息、AI 生成内容）随 `getLang()` 切换语言

## 5.8 事件系统（EventBus）

```js
EventBus.on('event:name', handler)
EventBus.emit('event:name', data)

// 主要事件列表
'clock:hour'           // 每游戏小时
'clock:day'            // 每游戏天
'state:changed'        // GameState.set() 后触发
'actions:updated'      // 行动队列变化
'todo:add'             // 新待办添加
'expert:added'         // 专家添加到联系人
'relationship:changed' // NPC 关系等级变化
'week:start'           // 保留兼容，实际已由 clock:day 替代
'opc_goals:set'        // OPC 目标设定完成（Onboarding 结束）
```
