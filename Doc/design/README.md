# OPC 创始人 — 设计文档索引

> 版本：3.1（与代码库同步）
> 更新日期：2026-04-09
> 状态：Active · 与 `main` 分支代码一致

## 文档结构

| 文件 | 内容 |
|------|------|
| [01-product.md](./01-product.md) | 产品定位、核心叙事、设计原则 |
| [02-mechanics.md](./02-mechanics.md) | 游戏机制：时间、资源、Onboarding、自由探索、AI 事件引擎 |
| [03-milestones.md](./03-milestones.md) | 里程碑系统、OPC 目标、进度驱动 |
| [04-achievements.md](./04-achievements.md) | 成就系统、NPC 解锁条件、App 解锁时机 |
| [05-tech.md](./05-tech.md) | 技术架构、数据结构、模块依赖、AI 集成 |

## 已实现功能概览

### 核心系统
- ✅ macOS 风格桌面 UI（窗口拖拽/最大化/最小化、Dock、菜单栏）
- ✅ 实时游戏时钟（2 分钟=1 游戏小时，可调速 0.5x/1x/2x/4x，可暂停）
- ✅ 天数计时系统（连续天数，Day 1/2/3...）
- ✅ 每日 ¥430 生活成本自动扣除
- ✅ 时钟状态持久化（刷新页面后接续）
- ✅ 9 个 AI 服务商（国内外全覆盖）
- ✅ i18n 双语（中/英，711 行翻译键值）
- ✅ localStorage 全局存档

### Onboarding 流程（已实现）
- ✅ 登录屏（输入名字 + 语言选择）
- ✅ AI 配置向导（必须完成或跳过）
- ✅ 裁员邮件（需主动确认，¥47,200 到账）
- ✅ 王子墨 Telegram 推荐 Lenny（分批推送，Safari 自动解锁）
- ✅ Safari 搜索 Lenny → 个人资料页 → 虚拟 X 私信 → 添加到 Telegram

### 应用（10 个）
- ✅ **Mail** — 三栏布局，A/B/C 类型邮件，选项效果，过期机制
- ✅ **Telegram** — 王子墨 AI 伴侣，专家 Telegram 频道，分批推送
- ✅ **Todo** — 多来源待办，优先级，NPC 承诺追踪，日期绑定
- ✅ **Calendar** — 只读时间线，按周展示有日期的待办
- ✅ **Numbers** — 资源看板（现金/声誉/人脉/洞察碎片），进度条，成就
- ✅ **Podcast** — YouTube 嵌入，首次/再次收听奖励差异，发现专家
- ✅ **Safari** — 真实 DuckDuckGo 搜索，关键词触发专家卡片，Lenny X DM 流程
- ✅ **Discord** — 虚拟创业社群，5 个频道，互动触发隐藏专家郑磊
- ✅ **Contacts** — Canvas 人脉图，关系层级，信任分显示
- ✅ **Settings** — 5 个 Tab（AI 配置/玩家档案/游戏状态/存档管理/语言）

### NPC 系统（10 位专家 + 王子墨）
- ✅ 所有对话强制 LLM 实时生成，无 fallback 路由
- ✅ 每位专家有 `boundaries`（话题边界），超范围柔性拒绝
- ✅ PromptBuilder 注入对话上下文（最近 4 条消息）、玩家动态、专业知识片段
- ✅ NPC 记忆（beliefs/trustScore/relationship），信任度驱动关系升级
- ✅ 10 个专家各有真实 YouTube 视频 ID

### AI 事件引擎
- ✅ 每 2 游戏小时评估玩家状态
- ✅ Game Master 系统 prompt 约束叙事真实性
- ✅ 支持 mail/telegram/notification 三种事件渠道
- ✅ 严格时间约束（Day 1-3 禁商业机会，VC 需声誉≥40）

## v3.0 → v3.1 变更（与旧版 PRD 的差异）

| 旧设计 | 实际实现 |
|--------|---------|
| 周数（Week X）| 天数（Day X） |
| 破冰期/起步期等阶段名 | 已移除，由里程碑驱动 |
| 行动点系统 | 已移除 |
| Messages App（专家深度对话）| 已移除，合并到 Telegram |
| `opc_clock` 独立 localStorage key | 合并到 `opc_gamestate` |
| LennyOnboarding AI 对话分解里程碑 | 计划中（未实现） |
| 玩家自设 OPC 目标（`opc_goals`）| GameState 字段已加，UI 待实现 |
