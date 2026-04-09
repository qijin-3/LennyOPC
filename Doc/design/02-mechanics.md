# 02 — 游戏机制

## 2.1 时间系统

游戏时间以**天**为单位，由实时时钟驱动。

```
真实 2 分钟 = 游戏内 1 小时
真实 48 分钟 = 游戏内 1 天（24小时）
```

**速度控制**（菜单栏右上角）：

```
⏸  [0.5x] [1x] [2x] [4x]   第 3 天 09:00
```

**时钟事件**：

| 事件 | 触发时机 | 效果 |
|------|---------|------|
| `clock:hour` | 每游戏小时 | AI 事件引擎每 2 小时评估；更新时钟 UI |
| `clock:day` | 每游戏天 | 自动扣除 ¥430；检查待办逾期；触发日邮件注入 |
| `game:over` | 现金 ≤ 0 | 弹出游戏结束确认，可重置存档 |

**持久化**：时钟状态（当前小时、速度）随 GameState 一起存储，刷新页面后从 `day × 24h + hour` 重建 `accumulatedMs`，保证时间连续。

**暂停**：全屏遮罩覆盖 window-container + dock，Settings/Todo 不受影响。

---

## 2.2 Onboarding 流程（四阶段，已实现）

### 阶段 1：登录 + AI 配置

```
macOS 风格登录界面
  ├── 输入玩家名称
  ├── 选择语言（中/English）
  └── 点击「开始 →」（Enter 可触发）
      ↓
AI 配置向导（全屏浮层）
  ├── 选择 AI 服务商（9 个，宫格布局）
  ├── 输入 API Key
  ├── 选择具体模型
  ├── 测试连接（实时验证）
  └── [稍后配置] 跳过，NPC 对话受限
      ↓
进入游戏桌面（初始解锁：Mail、Telegram、Todo、Settings）
```

### 阶段 2：裁员邮件确认

```
Mail 自动打开，收件箱唯一一封邮件：BigCorp HR 裁员通知
  └── 玩家阅读全文
  └── 底部按钮：「确认知悉，接受遣散费」（requiresAck 类型）
      ↓
点击后：
  ├── cash += ¥47,200
  ├── milestone.terminationAcknowledged = true
  ├── 自动创建 Todo：「思考接下来做什么」（高优先级）
  └── 2 秒后触发阶段 3
```

### 阶段 3：王子墨 Telegram 推荐 Lenny

```
Telegram 通知弹出，切换到 Telegram App
  └── 王子墨发来 3 条安慰消息（分批，每条间隔 1.8 秒）
  └── 随后推荐 Lenny（3 条，每条间隔 2.2 秒）：
      「你可以用 Safari 搜一下 Lenny Rachitsky，
       他在 X 上很活跃，很多创业者私信过他，回复率挺高的。」
      ↓
Safari 自动解锁 → 弹出解锁通知
自动创建 Todo：「在 Safari 搜索 Lenny 并在 X 上私信他」（高优先级）
Safari 窗口自动打开（1.5 秒后）
```

### 阶段 4：寻找 Lenny（玩家主动完成）

```
玩家在 Safari 搜索「lenny」或「lenny rachitsky」
  └── 显示 Lenny 个人资料页（模拟 lennysnewsletter.com）
  └── 包含：简介 / 标签 / 社交链接 / 「如何联系到 Lenny」提示卡
      ↓
点击「→ 打开 X，给 Lenny 发私信」或「𝕏 @lennysnewsletter」
  └── 打开虚拟 X DM 界面（黑色 X 风格）
  └── 预填消息（玩家可编辑）
  └── 点击「发送」→ 2 秒后 Lenny 回复（给出 Telegram handle）
  └── 显示「+ 添加 Lenny 到 Telegram」按钮
      ↓
点击添加：
  ├── lenny_rachitsky 加入 addedContacts
  ├── MemoryManager.increaseTrust('lenny_rachitsky', 20)
  ├── 自动创建 Todo：「打开 Telegram，和 Lenny 聊聊你的 OPC 方向」
  └── 通知：「Lenny Rachitsky 已添加到联系人！」

（Onboarding 完成。后续 OPC 目标设定功能待实现）
```

---

## 2.3 自由探索阶段

Onboarding 完成后进入无约束的自由探索。玩家可以：

**与 NPC 互动**：
- Telegram 与王子墨聊天（AI 驱动，角色为「普通朋友」，不给专业建议）
- Telegram 与已发现专家通过引荐渠道建立联系
- 专家对话：每条回复都参考对话上下文 + 玩家近期活动 + 知识片段
- 付费咨询（关系≥「认识」时解锁，扣除 `consultFee`）

**主动搜索与学习**：
- Safari 搜索（真实 DuckDuckGo + 关键词触发专家卡片）
- Podcast 收听（YouTube 嵌入，首次/再次收听奖励不同）
- Discord 社群互动（触发隐藏专家郑磊）

**推进里程碑**：
- 在 Todo 中完成里程碑任务
- 完成里程碑触发叙事事件和资源奖励

---

## 2.4 NPC 对话系统

### PromptBuilder 结构

每次 NPC 回复生成的 system prompt 包含：

```
1. 角色定义：[专家名称] + [头衔] + [性格/说话风格]
2. 对话对象：玩家名 + 当前天数 + 关系描述
3. 玩家 beliefs：NPC 对玩家的认知（最多 10 条）
4. 玩家近期活动：ActivityLogger 最近 5 条记录
5. 对话上下文：最近 4 条消息（确保上下文一致）
6. 知识片段：关键词匹配时注入（灵感参考，不得逐字引用）
7. 专业边界：明确的 offTopic 列表
8. 8 条强制规则（不出戏/引用上下文/保持性格/边界拒绝/简短口语化）
```

### 话题边界规则

每位专家在 `boundaries.offTopic` 中定义不回答的话题。当玩家提问超出范围时，NPC 必须：
- 坦诚说「这不是我最擅长的」
- 给出符合自身性格的拒绝话术（`deflect` / `enDeflect`）
- 可以建议找更合适的专家

### 关系层级与信任度

| 关系 | 信任分 | 解锁内容 |
|------|-------|---------|
| 陌生 | 0–39 | 基本对话 |
| 认识 | 40–59 | 付费咨询；专家开始主动发 Telegram |
| 合作中 | 60–79 | 更深度建议；可触发引荐；可雇佣 |
| 深度伙伴 | 80–100 | 专家主动推荐新人脉；联合合作 |

信任度变化：
- 每次对话 +3
- 付费咨询 +10
- 完成 NPC 承诺 +5
- 逾期普通承诺 -8
- 逾期高优先级承诺 -15

---

## 2.5 AI 事件引擎

每 2 游戏小时（偶数整点）由 `clock:hour` 触发评估。

### 叙事约束

| 时间段 | 允许的事件类型 |
|--------|-------------|
| Day 1–3 | 仅朋友问候（王子墨 Telegram），**禁止任何商业机会** |
| Day 4–7 | 可出现轻量机会（朋友的顾问邀请） |
| Day 8+ | 基于声誉和人脉，概率性生成商业机会 |
| 任何时间 | VC 事件需声誉 ≥ 40 且已有公开内容 |
| 任何时间 | 同一天最多 1 个重要事件；同类型间隔 ≥ 3 天 |

### 事件渠道

| 渠道 | 适用场景 |
|------|---------|
| Mail | 正式商务：客户询盘、合同、VC 接触、媒体邀请 |
| Telegram | 朋友关心、引荐、非正式建议 |
| 系统通知 | 待办逾期提醒、成就解锁、App 解锁 |
| Safari 剧情卡片 | 搜索特定关键词触发专家发现 |

### AI 输出格式（JSON）

```json
{
  "event": "mail | telegram | notification | none",
  "type": "opportunity | social | risk | reward | info",
  "from": "王子墨",
  "fromId": "wangzimo",
  "subject": "邮件主题（mail 时使用）",
  "body": "消息正文",
  "effects": { "cash": 0, "reputation": 2, "network": 1 },
  "choices": [
    { "label": "选项文字", "effect": {}, "log": "choice_id" }
  ],
  "addTodo": { "title": "待办标题", "priority": "normal" },
  "reason": "内部原因（不展示给玩家）"
}
```

---

## 2.6 承诺追踪系统

当玩家在对话中对 NPC 做出承诺，系统自动创建带 `npcId` 字段的待办。

- Todo 过期未完成 → NPC 信任度 -8（普通）/ -15（高优先级）
- 完成承诺 → NPC 信任度 +5，触发正向事件
- Calendar 展示有 `scheduledWeek` / `dueWeek` 的待办（只读）

---

## 2.7 Safari 剧情触发

| 搜索内容 | 触发效果 |
|---------|---------|
| `lenny` / `lenny rachitsky` / `lenny podcast` | Lenny 个人资料页 → X DM 流程 |
| `x.com` / `twitter.com` | 虚拟 X DM 界面 |
| `bootstrap` / `一人公司` | Jason Fried 专家卡片 |
| `定价` / `pricing` / `SaaS` | Patrick Campbell、April Dunford 专家卡片 |
| `PLG` / `product led growth` | Elena Verna 专家卡片 |
| `发布` / `launch` / `product hunt` | Ryan Hoover 专家卡片 |
| `定位` / `positioning` | April Dunford 专家卡片 |
| `分发` / `distribution` | Brian Balfour 专家卡片 |
| `设计` / `design` | Julie Zhuo 专家卡片 |
| `OPC` / `商业模式` | Andrew Wilkinson 专家卡片 |
| 其他关键词 | 真实 DuckDuckGo 搜索结果 + 相关专家卡片 |

---

## 2.8 应用解锁时机

| App | 解锁条件 | 实现方式 |
|-----|---------|---------|
| Mail, Telegram, Todo, Settings | 游戏开始即解锁 | `DEFAULT_STATE.unlockedApps` |
| Calendar, Numbers, Podcast | 游戏开始即解锁（当前实现） | `DEFAULT_STATE.unlockedApps` |
| Safari | 王子墨推荐 Lenny 后 | `triggerOnboarding()` 中 `DockManager.unlock('safari')` |
| Discord | Day 5+ | `WeekCycleEngine.checkDayUnlocks()` |
| Contacts | 发现 ≥1 名专家 | `WeekCycleEngine.checkDayUnlocks()` 检查 `discoveredExperts` |
