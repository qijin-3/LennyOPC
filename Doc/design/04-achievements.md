# 04 — 成就系统 & NPC 解锁

## 4.1 成就系统

成就是对玩家特定行为的奖励，不影响游戏核心机制，提供额外满足感。

解锁时：系统通知弹出 `🏆 成就解锁 — [名称]`，在 Settings「游戏状态」Tab 和 Numbers 数据看板中展示。

### 已实现的成就触发

| 成就 ID | 触发条件 | 触发代码位置 |
|--------|---------|------------|
| `late_night_coder` | 真实时间凌晨 0–5 点打开游戏 | `main.js init()` |
| `断舍离` | 拒绝 VC 邀约累计 3 次 | `mail.js` 选项处理（`vcOffersDeclined >= 3`）|

### 计划中的成就

| 成就 ID | 名称 | 触发条件 |
|--------|------|---------|
| `first_client` | 第一桶金 | 获得第一笔收入（`milestone.firstIncome`）|
| `community_pillar` | 社群支柱 | Discord 互动 ≥ 30 次 |
| `no_vc` | 断舍离 | 拒绝 VC 3 次（已实现触发，badge 待完善）|
| `tidy_desk` | 整洁桌面 | 右键菜单「整理桌面」|
| `speed_runner` | 快速启动 | Day 7 内获得第一个付费客户 |
| `deep_thinker` | 深度思考者 | 洞察碎片 ≥ 20 |
| `well_connected` | 人脉王 | 添加 5 位专家联系人 |
| `trusted_advisor` | 信任伙伴 | 与任意专家达到「深度伙伴」关系 |
| `lenny_fan` | Lenny 粉丝 | 收听所有 Lenny 相关播客 |
| `comeback_kid` | 东山再起 | 现金跌破 ¥5,000 后回到 ¥50,000+ |

---

## 4.2 NPC 专家解锁条件

### 当前 10 位专家

| 专家 | `unlockCondition` | 主要发现渠道 | 咨询费 |
|------|----------|------------|-------|
| Lenny Rachitsky | `initial` | Safari 搜 lenny → X DM | ¥800 |
| Jason Fried | `podcast` | 播客收听 / Safari 搜 `bootstrap` | ¥1,200 |
| April Dunford | `podcast` | 播客收听 / Safari 搜 `positioning` | ¥1,000 |
| Patrick Campbell | `podcast` | 播客收听 / Safari 搜 `pricing` | ¥1,000 |
| Shreyas Doshi | `podcast` | 播客收听 / Lenny 引荐 | ¥900 |
| Elena Verna | `podcast` | 播客收听 / Safari 搜 `PLG` | ¥1,000 |
| Ryan Hoover | `podcast` | 播客收听 / Safari 搜 `launch` | ¥900 |
| Julie Zhuo | `podcast` | 播客收听 / Safari 搜 `design` | ¥950 |
| Andrew Wilkinson | `referral` | 专家引荐（需 ≥2 个合作中关系）| ¥1,500 |
| Brian Balfour | `podcast` | 播客收听 / Safari 搜 `distribution` | ¥900 |
| 郑磊（隐藏） | `discord` | Discord 互动 ≥ 3 次 | ¥500 |

### 专家发现流程

无论通过哪种渠道，流程统一为：

```
发现专家（播客/搜索/引荐/Discord）
    ↓
显示专家卡片（头像、简介、专长标签）
    ↓
点击「联系专家」/ 「添加到 Telegram」
    ↓
`discoveredExperts[id]` 更新 + 信任度 +5
Telegram 联系人列表出现该专家
    ↓
收到专家的 introMessage（首次欢迎消息）
```

---

## 4.3 NPC 专业边界（Boundaries）

每位专家都有明确的话题边界定义，PromptBuilder 会将其注入 system prompt：

```js
// 示例：Jason Fried
boundaries: {
  offTopic: ['风险投资', 'VC 融资策略', '增长黑客', '广告投放', '销售漏斗优化', '技术架构'],
  deflect: '这块我不擅长——我们 37signals 一直避开这些，所以我没什么实际经验可以分享',
  enDeflect: "I don't have useful experience there — we've actively avoided that at 37signals, so I'd be making things up"
}
```

各专家专业范围：

| 专家 | 专业范围 | 明确排除 |
|------|---------|---------|
| Lenny | PMF、增长、定价、产品策略、职业发展 | 法律、财务会计、技术架构、健康 |
| Jason Fried | Bootstrap、盈利性、产品设计、远程文化 | VC 融资、增长黑客、广告投放 |
| April Dunford | 产品定位、GTM、B2B 销售、竞争差异化 | 增长黑客、PLG、技术实现、融资 |
| Patrick Campbell | 定价策略、SaaS 指标、流失率、收入优化 | 产品设计、内容营销、技术架构 |
| Shreyas Doshi | 产品策略、优先级、执行框架、PM 职业 | 定价、销售、融资、技术实现 |
| Elena Verna | B2B 增长、PLG、激活留存、增长指标 | 产品定位、销售话术、设计 |
| Ryan Hoover | 产品发布、社区建设、消费者产品 | B2B 销售、SaaS 定价、增长系统 |
| Julie Zhuo | 产品设计、设计领导力、管理、职业成长 | 定价、销售、融资、增长黑客 |
| Andrew Wilkinson | 商业模式、Bootstrap、收购、创业想法验证 | 技术开发、增长黑客、用户研究 |
| Brian Balfour | 增长系统、分发渠道、留存、B2B 增长 | 产品定位、设计、融资、定价 |

---

## 4.4 App 解锁顺序（当前实现）

| App | 解锁时机 | 实现位置 |
|-----|---------|---------|
| Mail, Telegram, Todo, Calendar, Numbers, Podcast, Settings | 游戏开始 | `DEFAULT_STATE.unlockedApps` |
| Safari | 王子墨 Onboarding 推荐后 | `imessage.js triggerOnboarding()` |
| Discord | Day 5+ | `engine.js checkDayUnlocks()` |
| Contacts | 发现 ≥1 名专家 | `engine.js checkDayUnlocks()` |

---

## 4.5 关系层级与解锁权益

```
陌生（0-39）→ 认识（40-59）→ 合作中（60-79）→ 深度伙伴（80-100）
```

| 关系 | 权益 |
|------|------|
| 陌生 | 基本对话 |
| 认识 | 付费咨询解锁；专家开始通过 Telegram 主动分享非正式建议 |
| 合作中 | AI 回复更深入；可触发引荐；可雇佣专家参与项目 |
| 深度伙伴 | 专家主动通过 Telegram 推荐新人脉；可发起联合合作 |
