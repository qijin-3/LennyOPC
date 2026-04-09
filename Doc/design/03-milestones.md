# 03 — 里程碑系统

## 3.1 设计理念

游戏进程不由时间周期驱动，而由**玩家完成里程碑**驱动。每个玩家的路径不同，节奏不同，这两种情况都合法：

- 7 天内找到付费客户（执行力强）
- 30 天才开始变现（花更多时间学习和建立人脉）

## 3.2 系统内置里程碑（GameState.milestones）

这些是游戏系统追踪的关键节点，影响叙事事件触发：

| milestone ID | 触发条件 | 触发效果 |
|-------------|---------|---------|
| `terminationAcknowledged` | 确认裁员邮件 | ¥47,200 到账；Onboarding 推进 |
| `onboardingComplete` | Lenny 添加到联系人后（计划：OPC 方向设定完成）| 解锁全部 App |
| `firstIncome` | 收到第一笔收入 | 王子墨 Telegram 祝贺 |
| `firstPaidClient` | 接受第一个付费客户邮件选项 | 成就解锁；叙事事件触发 |

## 3.3 OPC 目标与玩家里程碑（计划中）

> 当前状态：GameState 中 `opc_goals` 字段已预留，UI 流程待实现。

在 Onboarding 完成后，玩家与 Lenny 通过 AI 对话共同制定：

```js
// GameState.opc_goals（字段已存在，内容待填充）
{
  direction: 'B2B SaaS 产品顾问',
  targetAudience: '10-50 人规模的初创公司',
  goal: '6 个月内月收入 ¥10,000',
  createdAt: 5,     // 游戏第几天
  milestones: [
    { id: 'ms_001', title: '确定服务定价和方案', priority: 'high', dueDay: 7, completed: false },
    { id: 'ms_002', title: '找到第一个付费客户', priority: 'high', dueDay: 30, completed: false },
    { id: 'ms_003', title: '完成 3 次付费咨询',   priority: 'normal', dueDay: 60, completed: false },
    { id: 'ms_004', title: '建立个人品牌（发布 3 篇文章）', priority: 'normal', dueDay: 90, completed: false }
  ]
}
```

## 3.4 系统预置 Todo（Onboarding 期间自动创建）

| 待办标题 | 来源 | 优先级 | 创建时机 |
|---------|------|-------|---------|
| 思考接下来做什么 | system | high | 裁员邮件确认后 |
| 在 Safari 搜索 Lenny 并在 X 上私信他 | telegram | high | 王子墨推荐后 |
| 打开 Telegram，和 Lenny 聊聊你的 OPC 方向 | system | high | 添加 Lenny 后 |

## 3.5 里程碑与 Todo 的关系

Todo 系统支持 `isMilestone` 字段，里程碑 Todo 与普通待办在 UI 上有差异化展示。

Todo 字段结构：
```js
{
  id: 'todo_xxx',
  title: '找到第一个付费客户',
  source: 'lenny_onboarding',  // mail | telegram | system | ai_event | player
  priority: 'high',            // high | normal | low
  npcId: null,                 // 关联 NPC，逾期扣信任分
  scheduledDay: null,          // 计划完成日
  dueDay: 30,                  // 截止日（显示在 Calendar）
  completed: false,
  createdAt: 3,
  isMilestone: true
}
```

## 3.6 里程碑完成触发（计划中）

| 里程碑类型 | 触发效果 |
|-----------|---------|
| 第一个付费客户 | 王子墨 Telegram 庆祝；声誉 +5；成就解锁 |
| 完成首次付费咨询 | NPC 信任度提升；AI 事件引擎评分更新 |
| 内容发布 | 声誉 +5；可能触发媒体关注事件 |
| Product Hunt 发布 | 大幅声誉提升；触发社群事件 |
| 月收入目标达成 | 成就解锁；触发下一阶段叙事 |

## 3.7 游戏结束条件

**唯一失败条件**：现金归零。

```js
// clock.js 中每天触发
if (newCash <= 0) EventBus.emit('game:over', { reason: 'cash' });

// engine.js 中监听
EventBus.on('game:over', () => this._triggerGameOver());
// → 弹出确认框，可重置存档（保留 50% 人脉分）
```

没有「成功结局」的强制终点。玩家完成了自己设定的目标，就是完成了。
