# OPC 创始人 — 产品需求文档 v2.1

> 版本：2.1
> 更新日期：2026-04-02
> 当前状态：Phase 8 开发中

---

## 目录

1. [产品定位](#1-产品定位)
2. [核心叙事与世界观](#2-核心叙事与世界观)
3. [新手引导流程](#3-新手引导流程)
4. [游戏机制](#4-游戏机制)
5. [事件与消息推送系统](#5-事件与消息推送系统)
6. [专家 NPC 系统](#6-专家-npc-系统)
7. [应用功能详述](#7-应用功能详述)
8. [技术架构](#8-技术架构)
9. [数据结构](#9-数据结构)
10. [AI 集成规范](#10-ai-集成规范)
11. [i18n 规范](#11-i18n-规范)
12. [文件结构](#12-文件结构)
13. [开发路线图](#13-开发路线图)

---

## 1. 产品定位

### 1.1 一句话描述

OPC 创始人是一款运行在浏览器中的 **AI 驱动叙事策略模拟游戏**，玩家扮演刚被大厂裁员的产品经理，从 ¥47,200 遣散费出发，通过与真实行业专家（AI NPC）对话、搜索信息、建立人脉，最终把一人公司做到 $10M 估值。

### 1.2 核心受众

- 正在考虑或已经独立创业的产品人、工程师、设计师
- 对 Lenny's Podcast 内容感兴趣的 B2B SaaS 从业者
- 喜欢模拟经营类游戏 + 对真实创业知识有需求的玩家

### 1.3 差异化定位

| 维度 | OPC 创始人 | 传统模拟游戏 |
|------|-----------|------------|
| NPC 对话 | 真实 LLM 实时生成，有记忆和个性 | 固定脚本 |
| 知识内容 | 来自 Lenny's Podcast 真实转录 | 虚构设定 |
| 事件触发 | AI 评估玩家行为动态生成，符合叙事逻辑 | 固定触发条件 |
| 推送渠道 | Mail + iMessage，按情境选择 | 单一通知 |
| 时间系统 | 实时时钟（可调速），自由探索 | 回合制行动点 |
| 搜索功能 | 接入真实 DuckDuckGo，结果可点击，可触发剧情 | 虚拟搜索 |
| 任务管理 | 独立待办 App + 日历视图，自动触发 | 无 |

### 1.4 核心设计原则

1. **叙事真实性**：所有事件的出现必须符合剧情逻辑。刚裁员没人知道你的项目，不会有 VC 找上门；关系需要真实积累后才会带来机会。
2. **AI-First NPC**：所有专家对话强制经过 LLM，知识片段是 prompt 素材，不是预设回复。
3. **行为驱动事件**：玩家的每一个真实互动（搜索、聊天、听播客）影响 AI 事件引擎的判断。
4. **多渠道推送**：游戏事件通过 Mail（正式沟通）和 iMessage（非正式/朋友）两种渠道分发，渠道选择符合现实逻辑。
5. **渐进式人脉**：专家不会凭空出现在联系人里——必须通过朋友推荐、播客发现、搜索联系、社群认识等方式逐步解锁。
6. **自由探索 + 待办管理**：玩家可自由使用任何 App，待办 App 记录任务，Calendar 按时自动触发事件。

---

## 2. 核心叙事与世界观

### 2.1 背景故事

玩家是一名在 BigCorp 工作了 4 年的高级产品经理。某一天，收到了一封来自 HR 的邮件：由于公司战略调整，职位被取消，即日起生效。

玩家**主动点击确认**后，遣散费 ¥47,200 才到账。这是游戏的真正起点。

### 2.2 目标

在现金耗尽之前，把一人公司做到 **$10M 估值**（或等值的年化收入水平）。

### 2.3 游戏阶段

| 阶段 | 名称 | 触发条件 | 核心任务 |
|------|------|---------|---------|
| 1 | 破冰期 (early) | 游戏开始 | 找到第一个付费客户，建立基础人脉 |
| 2 | 起步期 (growing) | 完成首个付费客户 | 月收入达 ¥3,000，验证方向 |
| 3 | 成长期 (scaling) | 月收入达 ¥3,000 | 月收入达 ¥10,000，建立口碑 |
| 4 | 扩张期 (exit) | 月收入达 ¥10,000 | 向 $10M 估值冲刺 |

### 2.4 游戏结局

- **成功**：达到 $10M 估值里程碑，触发成功结局
- **失败**：现金归零，触发"重新开始"（保留部分人脉记忆）
- **岔路**：接受 VC 融资触发特殊结局（放弃 OPC 路线）

### 2.5 核心张力

- **时间 vs 金钱**：每周 ¥3,000 固定生活成本持续消耗现金
- **探索 vs 执行**：花时间学习/建人脉 vs 马上变现
- **独立 vs 融资**：拒绝 VC 保持 OPC 路线 vs 接受资金加速增长

---

## 3. 新手引导流程

新手引导分为三个阶段，强制串行，不可跳过核心步骤。

### 3.1 阶段一：登录 + AI 配置

```
macOS 登录界面（输入任意密码）
    ↓
AI 配置向导 Overlay（不可跳过核心配置）
    ├── 选择 AI 服务商（默认 GLM-4-Flash，免费）
    ├── 输入 API Key
    ├── 选择/填写模型
    ├── [测试连接] → 成功后显示「开始游戏」
    └── [稍后配置] → 允许跳过，但 Messages 功能受限
```

### 3.2 阶段二：裁员邮件

```
桌面出现，Mail 自动打开
    ↓
收件箱只有一封邮件：BigCorp HR 的裁员通知
    ↓
玩家阅读邮件全文
    ↓
邮件底部有「确认知悉」按钮（而非自动应用效果）
    ↓
玩家点击「确认知悉」
    ↓
✅ ¥47,200 遣散费到账（此时才生效）
✅ 待办 App 自动添加任务：「思考接下来做什么」
✅ 触发阶段三
```

> **设计意图**：玩家主动确认才触发效果，给玩家真实的"签收"感，而非被动接受。

### 3.3 阶段三：朋友的第一条 iMessage

```
裁员确认后 5-10 秒
    ↓
iMessage 通知弹出（来自「王子墨」）
    ↓
打开 Messages App，看到王子墨的消息：
    "嘿，听说你被裁了？还好吗？"
    ↓
（AI 驱动对话，玩家可以倾诉）
    ↓
王子墨几轮对话后说：
    "对了，你做产品这么多年，你有没有听过 Lenny Rachitsky？
     他做了一个播客，专门聊 PM 和创业。我觉得你现在这个阶段特别适合听。
     我把他的联系方式分享给你？"
    ↓
对话中出现 [添加联系人] 按钮 → 点击后 Lenny 加入 Messages
    ↓
待办 App 自动添加任务：「收听 Lenny 的播客」
    ↓
通知：「Podcast App 已解锁」
```

> **设计意图**：
> - 王子墨是玩家的 AI 朋友（非专家），通过 iMessage 而非 Mail 联系，更真实
> - Lenny 是第一个专家，但需要玩家主动「添加联系人」才出现在 Messages 中
> - 其他所有专家都需要玩家通过游戏行为主动发现并添加

---

## 4. 游戏机制

### 4.1 时间系统（实时时钟）

游戏时间以**实时时钟**驱动，取代传统的回合行动点。

```
真实 2 分钟 = 游戏内 1 小时
真实 48 分钟 = 游戏内 1 天（24 小时）
游戏内 7 天 = 自动进入下一周
```

**速度档位**：`0.5x / 1x（默认）/ 2x / 4x` + 暂停

**Menu Bar 时钟控制条**（右上角）：
```
⏸  [0.5x] [1x] [2x] [4x]   周三 14:00   第3周
```

**暂停规则**：
- 暂停时全屏遮罩覆盖 window-container + dock
- 暂停中禁止所有游戏 App 交互
- Settings 不受暂停影响（可随时配置 AI、切换语言）
- 遮罩显示「⏸ 游戏已暂停」 + 「▶ 继续」按钮

**时钟事件**：
- `clock:hour` — 每游戏小时触发（AI 事件引擎轮询、待办到期检查）
- `clock:day` — 每游戏天触发（Calendar 日程触发）
- `clock:week` — 每游戏周触发（周结算）

### 4.2 资源系统

| 资源 | 说明 | 初始值 | 影响 |
|------|------|-------|------|
| 💰 现金 | 主要生存资源 | ¥47,200 | 低于 0 游戏结束 |
| ⚡ 行动点 | 本周可执行行动次数 | 5 点/周 | 收听播客等行动需消耗 |
| 🔥 声誉 | 影响专家接受联系的概率 | 10 | 越高越容易被引荐 |
| 🤝 人脉 | 量化社交资本 | 5 | 影响机会出现频率 |
| 💡 洞察碎片 | 知识积累量 | 0 | 影响内容创作爆款概率 |

**固定成本**：每周自动扣除 ¥3,000 生活成本（周结算时执行）

### 4.3 行动系统

玩家在 Calendar 中预排本周行动，到时间自动触发。

| 分类 | 行动 | 消耗行动点 | 主要效果 |
|------|------|-----------|---------|
| 思考类 | 🎙️ 收听播客 | 1 | 洞察碎片 +1，解锁专家 |
| 思考类 | 📊 复盘数据 | 1 | 声誉 +2 |
| 思考类 | 🌐 市场调研 | 1 | 洞察碎片 +1 |
| 社交类 | 📧 冷启动联系专家 | 1 | 人脉 +1（成功率受声誉影响） |
| 社交类 | 👥 社群互动 | 1 | 人脉 +2，社群贡献 +5 |
| 社交类 | 🎪 参加线下活动 | 2 | 人脉 +5，声誉 +1 |
| 执行类 | ✍️ 创作内容 | 1 | 声誉 +1-5（含爆款概率） |
| 执行类 | 🤝 拜访潜在客户 | 2 | 可能带来现金收入 |
| 执行类 | 💻 开发产品原型 | 3 | 消耗 ¥3,000，声誉 +3 |
| 恢复类 | 😴 好好休息 | 1 | 下周行动点临时 +1 |

### 4.4 待办系统（TodoApp）

独立的待办 App，显示在 Dock 中。

**功能**：
- 记录玩家的所有待办任务（游戏自动生成 + 玩家手动添加）
- 每条待办显示：标题、来源（邮件/iMessage/游戏事件）、优先级、截止时间（可选）
- 支持勾选完成、删除

**自动写入时机**：
- 收到裁员邮件 → 「思考接下来做什么」
- 王子墨推荐 Lenny → 「收听 Lenny 的播客」
- 收到客户线索邮件 → 「跟进：[客户名]」
- AI 事件引擎判断有待跟进事项 → 自动写入待办

**待办数据结构**：
```js
{
  id: 'todo_xxx',
  title: '收听 Lenny 的播客',
  source: 'imessage',          // mail | imessage | system | ai_event
  sourceRef: 'evt_friend_msg', // 来源事件 ID
  priority: 'high',            // high | normal | low
  dueDay: 3,                   // 游戏天数（可选，到期触发提醒）
  completed: false,
  createdAt: 1,                // 游戏周数
  completedAt: null
}
```

### 4.5 Calendar（日历视图）

**定位**：从「行动预排」面板改为**日历视图**，显示本周的日程安排，行动到时间后自动触发。

**视图**：周视图（周一到周日），每天显示已安排的行动和计划事件。

**核心变化**（相比旧版）：
- 玩家在左侧行动面板选择行动，拖拽/点击排入某一天
- 游戏时钟到达该天时自动触发行动效果
- 不再需要手动点击「结束本周」——时钟驱动
- 已发生的事件显示在对应天的格子中（只读）

### 4.6 AI 事件引擎

每 **2 游戏小时**自动评估玩家行为，动态生成事件。

**叙事约束（关键）**：
- 第 1 周：只允许生成朋友问候类事件，严禁商业机会
- 第 2 周：只有已知玩家方向的人脉才可能带来机会
- 第 3 周起：基于玩家实际积累的声誉和人脉，概率性生成机会
- VC 类事件：仅在声誉 ≥ 40 且有 2+ 位专家关系时才允许生成

**事件渠道选择原则**：
| 事件性质 | 推送渠道 |
|---------|---------|
| 正式商业邀请（客户、合同、VC） | Mail |
| 朋友关心、非正式建议、引荐推荐 | iMessage |
| 系统提醒（待办到期、机会流失） | 系统通知 |
| 搜索触发的叙事线 | Safari 卡片 |

**AI 输出格式（JSON）**：
```json
{
  "event": "mail | imessage | notification | none",
  "channel": "mail | imessage",
  "type": "opportunity | social | risk | reward | info",
  "from": "王子墨",
  "fromId": "wangzimo",
  "subject": "邮件主题（mail 时使用）",
  "body": "消息正文",
  "effects": { "cash": 0, "reputation": 2, "network": 1 },
  "choices": [
    { "label": "选项", "effect": {}, "log": "choice_id" }
  ],
  "addTodo": { "title": "待办标题", "priority": "normal" },
  "reason": "内部原因"
}
```

### 4.7 Safari 搜索触发剧情

特定搜索词可以触发专属剧情卡片，推进玩家的故事线：

| 搜索内容 | 触发卡片 |
|---------|---------|
| 「一人公司」「OPC」 | 显示「OPC 创始人社区」加入入口（解锁 Discord） |
| 「Lenny podcast」「Lenny Rachitsky」 | 显示 Lenny 的播客页，可添加联系人 |
| 「如何找到第一个客户」 | 触发待办：「研究冷启动方法」 |
| 「SaaS 定价」「pricing」 | 如果未发现 Patrick Campbell，显示其专家卡片 |
| 特定专家名字 | 直接显示该专家的个人卡片，可添加联系人 |

### 4.8 周结算系统

触发方式：游戏时钟走完 7 天自动触发（`clock:week` 事件）

结算流程：
1. 执行本周内所有已触发的行动效果
2. 扣除 ¥3,000 生活成本
3. 触发随机事件（声誉/人脉加成）
4. 检查阶段转换
5. 显示周总结弹窗

### 4.9 里程碑系统

| 里程碑 | 触发条件 | 解锁效果 |
|-------|---------|---------|
| `firstPaidClient` | 接受第一个付费客户邮件 | 解锁 Safari |
| `monthlyRevenue3k` | 现金增长达标 | 进入起步期 |
| `monthlyRevenue10k` | 月收入 ¥10,000 | 进入成长期 |
| `podcastInvited` | 专家引荐上播客 | 声誉大幅提升 |
| `vcOfferReceived` | 收到 VC 邮件 | 触发 OPC vs 融资抉择 |

### 4.10 成就系统

| 成就 ID | 触发条件 |
|--------|---------|
| `late_night_coder` | 真实时间凌晨 0-5 点开启游戏 |
| `community_pillar` | Discord 社群贡献 ≥ 30 |
| `断舍离` | 拒绝 VC 邀约 3 次 |
| `tidy_desktop` | 右键菜单「整理桌面」 |

---

## 5. 事件与消息推送系统

这是 v2.1 的核心改动之一：**事件通过符合情境的渠道推送**，而非全部走 Mail。

### 5.1 推送渠道

#### Mail（邮件）
适合：正式商务沟通

- 裁员通知
- 客户询盘、合同确认
- VC 接触邮件
- 媒体采访邀请
- 平台/工具的系统邮件

#### iMessage
适合：朋友、非正式沟通

- 王子墨（玩家的 AI 朋友）：全程陪伴，分享安慰、介绍资源
- 已建立「认识」关系以上的专家：发来非正式建议或引荐消息
- 社群中认识的普通创业者：偶尔互动

#### 系统通知
适合：游戏系统提示

- 待办到期提醒
- App 解锁提示
- 成就解锁

#### Safari 卡片
适合：玩家主动搜索后的叙事触发

- 搜索特定词触发专家卡片
- 搜索触发社群/社区入口
- 搜索触发待办创建

### 5.2 叙事节奏约束

AI 事件引擎生成事件时，必须遵守以下叙事真实性规则：

**时间约束**：
- 第 1 周：仅允许朋友问候类 iMessage，严禁商业机会
- 第 2 周：如果玩家已有行动记录，允许出现轻量机会（如朋友的顾问邀请）
- 第 3 周起：基于实际积累，概率性生成中等商业机会
- 第 5 周起：允许生成较大机会（前提是声誉 ≥ 30）

**知情约束**：
- 没有人知道玩家在做什么项目，直到玩家主动分享（搜索、发帖、告诉专家）
- VC 只有在声誉 ≥ 40 且至少 1 次内容发布后才可能主动联系
- 陌生人不会突然邀请玩家做付费工作，除非有人脉引荐

**频率约束**：
- 同一天内不超过 1 个重要事件
- 同类型事件（如客户询盘）至少间隔 3 游戏天
- 事件频率随阶段递增（破冰期少，扩张期多）

### 5.3 王子墨（玩家 AI 朋友）

王子墨是贯穿全程的 AI 伴侣，通过 iMessage 与玩家保持联系。

**角色设定**：
- 玩家在 BigCorp 时期的老朋友，技术背景，自己也在做小项目
- 性格：温暖、接地气，偶尔调皮，不说教
- 不是专家，但了解创业圈，会推荐资源

**触发时机**：
| 时机 | 王子墨的反应 |
|------|------------|
| 裁员确认后 | 第一条安慰 iMessage，随后推荐 Lenny |
| 玩家第一次对话 Lenny 后 | 「怎么样，有没有受到启发？」|
| 玩家第一笔收入 | 「！！！恭喜！！！发来庆祝表情包」|
| 玩家现金低于 ¥15,000 | 「最近还好吗，要不要出来吃个饭？」|
| 玩家连续 3 天无行动 | 「在吗？别把自己搞消失了啊」|

**技术实现**：
- 王子墨的对话走 iMessage App（独立于 Messages/专家对话）
- 可配置为由 AI 驱动（注入王子墨的人格 prompt），也可使用预设触发消息
- 联系人 ID：`wangzimo`，不计入专家列表，不在 Contacts 人脉图中

---

## 6. 专家 NPC 系统

### 6.1 设计理念

- 专家不会凭空出现在联系人里，必须通过游戏行为主动解锁
- 每位专家基于真实人物，知识来自 Lenny's Podcast 真实转录
- 所有对话由 LLM 实时生成，知识片段仅作 prompt 素材
- 关系随互动深化（陌生 → 认识 → 合作中 → 深度伙伴）

### 6.2 专家发现渠道

| 渠道 | 方式 | 示例 |
|------|------|------|
| 朋友推荐 (imessage) | 王子墨或其他朋友在 iMessage 中提及并分享联系方式 | 王子墨推荐 Lenny |
| 播客收听 (podcast) | 在 Podcast App 收听对应专家的集数 | 收听 April Dunford 集解锁 |
| Safari 搜索 (safari) | 搜索特定词触发专家卡片，玩家点击「添加联系人」 | 搜索「定位」发现 April |
| 社群互动 (community) | 在 Discord 积累足够贡献后，隐藏成员主动搭话 | 郑磊主动联系 |
| 专家引荐 (referral) | 与某专家达到「合作中」关系后，专家发 iMessage 推荐下一位 | Lenny 引荐 Shreyas |

### 6.3 添加联系人流程

无论通过哪种渠道发现专家，都需要玩家**主动点击「添加联系人」**按钮才能将其加入 Messages。这个设计模拟真实的人际关系建立过程。

```
发现专家（播客/搜索/推荐）
    ↓
显示专家卡片（头像、简介、专长）
    ↓
玩家点击「添加联系人」
    ↓
专家出现在 Messages 联系人列表
    ↓
收到专家的第一条欢迎消息（introMessage）
```

### 6.4 关系层级

| 关系等级 | 信任分门槛 | 特权 |
|---------|----------|------|
| 陌生 | 0-39 | 可以发消息，无付费咨询 |
| 认识 | 40-59 | 可发起付费咨询；专家可能通过 iMessage 分享非正式建议 |
| 合作中 | 60-79 | AI 回复更深入；可能触发引荐事件 |
| 深度伙伴 | 80-100 | 专家主动通过 iMessage 推荐新联系人 |

### 6.5 当前专家列表（11 位）

| 专家 | 发现渠道 | 咨询费 | 专长 |
|------|---------|-------|------|
| Lenny Rachitsky | 王子墨 iMessage 推荐（Onboarding） | ¥800 | PMF, 增长, 定价 |
| Jason Fried | Safari 搜索「bootstrap」或播客 | ¥1,200 | Bootstrap, 独立创业 |
| April Dunford | 播客收听 | ¥1,000 | 产品定位, GTM |
| Patrick Campbell | 播客收听 或 搜索「SaaS 定价」 | ¥1,000 | SaaS 定价, 留存 |
| Shreyas Doshi | Lenny 引荐（关系≥合作中）或播客 | ¥900 | 产品策略, 执行力 |
| Elena Verna | 播客收听 | ¥1,000 | PLG, B2B 增长 |
| Ryan Hoover | 播客收听 或 搜索「产品发布」 | ¥900 | 产品发布, 社区 |
| Julie Zhuo | 播客收听 | ¥950 | 设计, 职业成长 |
| Andrew Wilkinson | 专家引荐（需≥2位专家达到合作中）| ¥1,500 | 商业模式, 收购 |
| Brian Balfour | 播客收听 | ¥900 | 分发渠道, 增长系统 |
| 郑磊（隐藏） | Discord 发言 ≥ 3 次 且 贡献 ≥ 20 | ¥500 | 退出策略, B2B 销售 |

### 6.6 专家文件结构

每位专家独立一个 `.js` 文件，暴露 `EXPERT_XXX` 常量：

```js
const EXPERT_LENNY_RACHITSKY = {
  id: 'lenny_rachitsky',
  name: 'Lenny Rachitsky',
  title: '前 Airbnb PM，播客主持人',
  avatarEmoji: '🎙️',
  personality: '直接、好奇、数据驱动，喜欢追问「为什么」',
  expertise: ['PMF', 'growth', 'career', 'B2C', 'B2B'],
  consultFee: 800,
  unlockCondition: 'imessage_referral', // 更新：通过朋友推荐解锁
  introMessage: '嘿！我是 Lenny。王子墨和我说了你的情况，欢迎随时找我聊...',
  network: ['jason_fried', 'shreyas_doshi'],
  knowledge: [{ topic, keywords, fragment, source, depth }]
  // 无 fallbackReplies
};
```

### 6.7 NPC 记忆系统（MemoryManager）

```js
// GameState.npcMemory[expertId]
{
  recentMessages: [],    // 最近 10 条对话
  beliefs: [],           // 对玩家的认知，最多 10 条
  relationship: '陌生',
  trustScore: 20,
  lastInteraction: 0     // 最后交互的游戏周
}
```

---

## 7. 应用功能详述

### 7.1 Mail（邮件）

**定位**：正式商务沟通渠道

**布局**：三栏（文件夹 / 邮件列表 / 详情）

**邮件类型**：
| 类型 | 说明 |
|------|------|
| A | 纯叙事，自动应用效果 |
| B | 带选项，玩家决策影响资源 |
| C | 时效性机会（特定周内不处理则过期） |
| AI 生成 | AI 事件引擎实时生成 |

**叙事时间轴（预设）**：
- 第 1 周：仅裁员通知（1封，需玩家确认）
- 第 2 周：根据玩家行为，可能出现朋友的顾问邀请
- 第 3-4 周：基于积累，可能出现客户线索（由 AI 事件引擎生成）
- 第 5 周起：更多商业机会

### 7.2 iMessage（即时消息）

**定位**：非正式沟通渠道，王子墨 + 已建立关系的专家

**与 Messages（专家对话）的区别**：
| 维度 | iMessage | Messages |
|------|---------|---------|
| 对象 | 朋友（王子墨）+ 非正式联系 | 专家（付费/深度咨询） |
| 风格 | 日常聊天气泡，轻松 | 更正式，有咨询费机制 |
| 触发 | 游戏事件自动推送 + 玩家可回复 | 玩家主动发起 |
| App | iMessage（独立 App） | Messages |

**iMessage App 功能**：
- 联系人列表（王子墨、已认识专家）
- 聊天记录
- 专家分享卡片（带「添加联系人」按钮）
- 对话由 AI 驱动（王子墨人格 prompt）

### 7.3 TodoApp（待办）

**定位**：任务管理，记录游戏中需要跟进的所有事项

**Dock 图标**：📝，默认解锁（从游戏开始就可用）

**布局**：
- 顶部：任务数量统计（今日 / 全部 / 已完成）
- 主区：任务列表，按优先级排序
- 底部：手动添加输入框

**任务卡片显示**：
- 标题（粗体）
- 来源标签（Mail / iMessage / 系统 / AI）
- 优先级标签（🔴 高 / 🟡 普通 / 🟢 低）
- 截止时间（若有）
- 勾选按钮

**自动任务创建场景**：
| 触发 | 待办内容 | 优先级 |
|------|---------|-------|
| 裁员确认 | 「思考接下来做什么」 | 高 |
| 王子墨推荐 Lenny | 「收听 Lenny 的播客」 | 高 |
| 收到客户线索邮件 | 「跟进：[客户名] — 本周内回复」 | 高 |
| 搜索「如何找客户」 | 「研究冷启动方法」 | 普通 |
| 第一次聊天后 Lenny 建议 | 记录 Lenny 建议的行动项 | 普通 |

### 7.4 Calendar（日历）

**定位**：周视图日历，展示和安排本周行动

**视图**：7 天格子（周一到周日），每天分上午/下午两时段

**交互**：
- 左侧行动面板：选择行动类型
- 点击某天 → 将该行动排入对应天
- 游戏时钟到达该天 → 自动触发效果
- 已发生事件：显示在格子中（灰色只读）
- 计划事件：蓝色高亮

**AI 事件引擎生成的日程**：
- 系统自动添加到 Calendar（不需要玩家手动排入）
- 例如：「周四 10:00 — 与陈思远视频通话」

### 7.5 Numbers（数据看板）

展示 5 种核心资源的实时数据，以及：
- 进度条（现金安全性 / 声誉 / 洞察碎片）
- 最近 5 周历史记录
- 成就徽章
- 人脉统计（已发现专家数）

### 7.6 Messages（专家深度对话）

**定位**：与专家进行 AI 驱动的深度对话，可付费咨询

**前提**：专家已通过 iMessage 或其他渠道发现并「添加联系人」

**功能**：
- 联系人列表（仅已添加的专家）
- 聊天记录（每位专家独立记忆）
- 打字指示器
- 付费咨询（关系≥认识时解锁）
- 无 API Key 时显示配置提示，禁用输入

### 7.7 Podcast（播客）

**功能**：收听 Lenny's Podcast，发现专家，获取洞察碎片

**收听流程**：
1. 选择集数（按专家分类）
2. 点击「收听」— 消耗 1 行动点
3. 获得洞察碎片 +1，该专家「可发现」（显示「添加联系人」按钮）
4. 玩家点击「添加联系人」→ 专家加入 Messages
5. 第 2 次收听解锁深度知识片段

### 7.8 Safari（浏览器）

**功能**：真实搜索 + 剧情触发

**搜索后端**：DuckDuckGo Instant Answer API

**结果展示**：
- 真实可点击链接（新标签打开）
- 命中关键词时顶部显示「剧情卡片」（专家发现 / 社群入口 / 待办创建）

**Safari 触发专家发现**：
- 搜索专家名字 → 显示专家卡片 → 「添加联系人」
- 搜索相关关键词 → 显示关联专家卡片

### 7.9 Discord（社群）

**功能**：模拟创业者社群，积累贡献，发现隐藏专家郑磊

**解锁时机**：第 3 游戏周自动解锁（或搜索「OPC」触发）

### 7.10 Contacts（人脉图）

**功能**：Canvas 可视化关系图

**节点**：仅显示已添加的专家（在 Messages 中）

**解锁时机**：第一位专家添加联系人后解锁

### 7.11 Settings（设置）

**4 个标签页**：
1. 🤖 AI 模型配置（9 个服务商，自定义接口）
2. 🎮 游戏设置（进度、成就）
3. 💾 存档管理（导出、重置）
4. 🌐 语言（中/英切换）

---

## 8. 技术架构

### 8.1 运行环境

- **纯前端**：单页 HTML + CSS + JS，无构建工具，无服务端
- **浏览器**：现代 Chrome / Safari / Firefox（ES2020+）
- **存储**：localStorage（键前缀 `opc_`）
- **外部 API**：用户配置的 AI 接口 + DuckDuckGo Instant Answer

### 8.2 模块依赖图

```
data/i18n.js
    ↓
js/core.js          (EventBus, SaveSystem, GameState, AIConfig)
    ↓
js/clock.js         (GameClock, ActivityLogger)
    ↓
js/engine.js        (EVENT_TEMPLATES, ACTION_DEFS, WeekCycleEngine)
    ↓
data/experts/*.js   (10 个专家文件 + index.js 汇总)
    ↓
js/ui.js            (Window/Dock/MenuBar/Spotlight/ContextMenu/Battery)
    ↓
js/apps/            (settings, mail, imessage, todo, calendar, numbers,
                     messages, podcast, safari, discord, contacts)
    ↓
js/ai-event-engine.js  (每 2 游戏小时评估)
    ↓
js/main.js          (init, Onboarding)
```

### 8.3 EventBus 事件表

| 事件 | 发布者 | 订阅者 | 说明 |
|------|-------|-------|------|
| `state:changed` | GameState | NumbersApp, MenuBar, Calendar | 状态变更 |
| `phase:changed` | WeekCycleEngine | MenuBarManager | 阶段切换 |
| `actions:updated` | WeekCycleEngine | CalendarApp | 行动变化 |
| `clock:hour` | GameClock | AIEventEngine, TodoApp | 每游戏小时 |
| `clock:day` | GameClock | CalendarApp | 每游戏天，触发日程 |
| `clock:week` | GameClock | WeekCycleEngine | 周结算 |
| `clock:paused/resumed` | GameClock | 暂停遮罩 | 时钟控制 |
| `activity:logged` | ActivityLogger | — | 行为记录 |
| `relationship:changed` | MemoryManager | ContactsApp | 关系变化 |
| `mail:new` | AIEventEngine | MailApp | 新邮件 |
| `imessage:new` | AIEventEngine, Onboarding | iMessageApp | 新消息 |
| `todo:add` | 多处 | TodoApp | 新增待办 |
| `expert:discovered` | 多处 | ContactsApp, iMessageApp | 发现专家 |
| `expert:added` | iMessageApp, Podcast, Safari | MessagesApp, ContactsApp | 添加联系人 |

### 8.4 localStorage 结构

| 键 | 类型 | 说明 |
|----|------|------|
| `opc_gamestate` | JSON | 完整游戏状态 |
| `opc_ai_config` | JSON | AI 配置 |
| `opc_clock` | JSON | 时钟状态 |
| `opc_lang` | String | 语言设置 |
| `opc_todos` | JSON | 待办列表 |

---

## 9. 数据结构

### 9.1 GameState（完整字段）

```js
{
  cash: 47200, energy: 5, reputation: 10, network: 5,
  insightFragments: 0, communityContribution: 0,
  week: 1, phase: 'early', actionsRemaining: 5,
  milestones: {
    firstPaidClient: false, monthlyRevenue3k: false,
    monthlyRevenue10k: false, podcastInvited: false, vcOfferReceived: false,
    terminationAcknowledged: false  // 新增：裁员确认
  },
  playerProfile: { direction: null, actions: [], milestones: [] },
  recentActivity: [],          // ActivityLogger 最近 30 条
  listenedEpisodes: [],
  npcMemory: {},               // expertId → MemoryObject
  discoveredExperts: {},       // expertId → { discoveredAt, channel, added: bool }
  addedContacts: [],           // 已「添加联系人」的专家 ID 列表（可在 Messages 中对话）
  pendingEmails: [],
  pendingIMessages: [],        // iMessage 队列
  achievements: [],
  vcOffersDeclined: 0,
  unlockedApps: ['mail', 'imessage', 'todo', 'calendar', 'numbers', 'podcast', 'settings'],
  gameStartedAt: null
}
```

**关键变化**：
- `discoveredExperts` 新增 `added: bool` 字段，区分「发现」和「已添加联系人」
- 新增 `addedContacts[]`：只有在此列表中的专家才能在 Messages 中对话
- 新增 `pendingIMessages[]`：iMessage 消息队列
- `unlockedApps` 默认新增 `imessage` 和 `todo`

### 9.2 待办对象

```js
{
  id: 'todo_xxx',
  title: '收听 Lenny 的播客',
  source: 'imessage',           // mail | imessage | system | ai_event | player
  sourceRef: 'onboarding_lenny',
  priority: 'high',             // high | normal | low
  dueDay: 3,                    // 游戏天（可选）
  completed: false,
  createdAt: 1,                 // 游戏周
  completedAt: null
}
```

### 9.3 iMessage 对象

```js
{
  id: 'msg_xxx',
  from: 'wangzimo',             // 发送者 ID
  fromName: '王子墨',
  body: '消息文本',
  timestamp: Date.now(),
  read: false,
  attachedExpert: 'lenny_rachitsky',  // 若附带专家卡片
  choices: []                          // 若需玩家回复选项
}
```

---

## 10. AI 集成规范

### 10.1 支持的 AI 服务商（9 个）

| provider | 名称 | 协议 | 默认模型 |
|---------|------|------|---------|
| `claude` | Claude (Anthropic) | `claude` | claude-3-5-haiku |
| `openai` | OpenAI | `openai_compat` | gpt-4o-mini |
| `gemini` | Google Gemini | `gemini` | gemini-2.0-flash |
| `glm` | 智谱 GLM | `openai_compat` | **glm-4-flash（免费，推荐）** |
| `kimi` | Kimi (月之暗面) | `openai_compat` | moonshot-v1-8k |
| `minimax` | MiniMax | `openai_compat` | abab6.5s-chat |
| `deepseek` | DeepSeek | `openai_compat` | deepseek-chat |
| `qwen` | 通义千问 | `openai_compat` | qwen-turbo |
| `custom` | 自定义兼容接口 | `openai_compat` | 用户填写 |

### 10.2 AI 用途分类

| 用途 | System Prompt | 调用频率 |
|------|-------------|---------|
| 专家对话（Messages） | PromptBuilder.build(expert) | 玩家发消息时 |
| 王子墨对话（iMessage） | WANGZIMO_SYSTEM | 触发事件时 / 玩家回复时 |
| AI 事件引擎 | GAME_MASTER_SYSTEM | 每 2 游戏小时 |

### 10.3 叙事约束注入 GAME_MASTER_SYSTEM

AI 事件引擎的 system prompt 必须包含叙事约束：

```
NARRATIVE CONSTRAINTS:
- Week 1: Only allow friend check-in messages (iMessage). No business opportunities.
- Week 2+: Events must be earned through player actions. 
  Nobody knows about the player's project unless they've talked about it.
- VC contact: Only allowed if reputation >= 40 AND at least 1 content piece published.
- Referrals: Only from contacts with relationship >= "Collaborating".
- Event frequency: Max 1 significant event per game day.
  Same event type must have 3+ day gap.
```

---

## 11. i18n 规范

`data/i18n.js`，`t('key', {vars})`，`getLang()` / `setLang()`

覆盖所有 UI 文本（100+ keys），AI prompt 根据 `getLang()` 选择语言。

---

## 12. 文件结构

```
LennyOPC/
├── index.html
├── css/
│   ├── base.css
│   ├── apps.css
│   └── overlays.css
├── js/
│   ├── core.js              (EventBus, SaveSystem, GameState, AIConfig)
│   ├── clock.js             (GameClock, ActivityLogger)
│   ├── engine.js            (EVENT_TEMPLATES, ACTION_DEFS, WeekCycleEngine)
│   ├── ui.js                (Window/Dock/MenuBar/Spotlight/Context/Battery)
│   ├── ai-event-engine.js   (AIEventEngine, GAME_MASTER_SYSTEM)
│   ├── main.js              (init, Onboarding)
│   └── apps/
│       ├── settings.js
│       ├── mail.js
│       ├── imessage.js      ← 新增
│       ├── todo.js          ← 新增
│       ├── calendar.js      (改为日历视图)
│       ├── numbers.js
│       ├── messages.js
│       ├── podcast.js
│       ├── safari.js
│       ├── discord.js
│       └── contacts.js
├── data/
│   ├── i18n.js
│   └── experts/
│       ├── [10 个专家文件].js
│       └── index.js
└── Doc/
    ├── PRD_v1.md
    ├── PRD_v2.md            ← 本文档
    └── lenny/
```

**脚本加载顺序**：
```
data/i18n.js → js/core.js → js/clock.js → js/engine.js
→ data/experts/*.js → data/experts/index.js
→ js/ui.js
→ js/apps/settings.js → mail.js → imessage.js → todo.js → calendar.js
→ numbers.js → messages.js → podcast.js → safari.js → discord.js → contacts.js
→ js/ai-event-engine.js → js/main.js
```

---

## 13. 开发路线图

### 已完成（P1-P7）

| Phase | 内容 |
|-------|------|
| P1 | macOS 桌面骨架（窗口、Dock、Menu Bar、Settings） |
| P2 | 核心游戏循环（Mail + Calendar + Numbers + 周结算） |
| P3 | AI 专家对话（Messages + MemoryManager） |
| P4 | 发现渠道（Podcast + Safari 虚拟搜索） |
| P5 | 内容层：10 位专家 + Lenny 播客知识片段 |
| P6 | 社群（Discord）+ 人脉图（Contacts） |
| P7 | AI 模型扩展（9商）+ 新手引导 + i18n + Safari 真实搜索 + 实时时钟 + AI 事件引擎 |

### P8（当前，本次开发）

| 任务 | 说明 | 优先级 |
|------|------|-------|
| iMessage App | 新建，王子墨 AI 朋友 + 专家推荐卡片 | P0 |
| TodoApp | 新建，待办列表，自动写入 | P0 |
| Onboarding 重构 | 裁员确认机制 + 王子墨引导 + 「添加联系人」流程 | P0 |
| 专家发现解耦 | 区分「发现」和「添加联系人」，移除初始解锁 | P0 |
| AI 事件引擎叙事约束 | 注入时间/知情/频率约束，修复「第一周就收到 VC 邮件」问题 | P0 |
| Safari 剧情触发 | 搜索特定词触发专家发现卡片 | P1 |
| Calendar 日历视图 | 改为周视图，时钟驱动自动触发 | P1 |

### P9（规划中）

| 任务 | 说明 |
|------|------|
| 更多专家内容 | 扩展至 20 位 |
| 专家引荐流程完善 | 通过 iMessage 自动推送引荐消息 |
| Numbers 图表化 | 折线图显示资源历史趋势 |
| 音效系统 | 系统音效 + 通知音 |

### 已知技术债

1. Calendar 行动点手动触发与实时时钟并存，需统一为时钟驱动
2. `data/experts.js`（旧文件）未删除，不加载但占用空间
3. MemoryManager 关系标签在切换语言后不更新历史存档
4. Safari DuckDuckGo 超时无错误提示

---

## 附录：核心术语

| 术语 | 定义 |
|------|------|
| OPC | One Person Company，一人公司 |
| iMessage | 游戏内即时消息 App，对应非正式沟通渠道 |
| 王子墨 | 玩家的 AI 朋友，贯穿全程的 iMessage 伴侣 |
| 发现专家 | 通过播客/搜索/社群等渠道找到专家信息 |
| 添加联系人 | 玩家主动点击后专家才进入 Messages 联系人 |
| ActivityLogger | 玩家行为追踪器，为 AI 事件引擎提供上下文 |
| GAME_MASTER_SYSTEM | AI 事件引擎的 system prompt，含叙事约束 |
| PromptBuilder | 专家对话的 system prompt 动态构建器 |
| 叙事约束 | 限制 AI 事件引擎生成事件的时机和类型，保证真实感 |
