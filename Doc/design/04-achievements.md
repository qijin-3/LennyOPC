# 04 — 成就系统 & NPC 解锁

## 4.1 成就系统

成就是对玩家特定行为的奖励，不影响游戏核心机制，但提供额外满足感。

### 基础成就

| 成就 ID | 名称 | 触发条件 | 说明 |
|--------|------|---------|------|
| `night_owl` | 深夜创业者 | 真实时间凌晨 0-5 点开启游戏 | 向所有在深夜工作的人致敬 |
| `first_client` | 第一桶金 | 获得第一笔收入 | 无论金额大小 |
| `community_pillar` | 社群支柱 | Discord 贡献 ≥ 30 | 活跃社群成员 |
| `no_vc` | 断舍离 | 拒绝 VC 邀约 3 次 | 坚守 OPC 路线 |
| `tidy_desk` | 整洁桌面 | 右键菜单「整理桌面」 | 一个轻松的彩蛋 |
| `speed_runner` | 快速启动 | 7 天内找到第一个付费客户 | 快速执行力 |
| `deep_thinker` | 深度思考者 | 洞察碎片达到 20 个 | 大量学习和研究 |
| `well_connected` | 人脉王 | 添加 5 位专家联系人 | 广泛的社交网络 |
| `trusted_advisor` | 信任伙伴 | 与任意专家达到「深度伙伴」关系 | 深厚的专业关系 |
| `content_creator` | 内容创作者 | 发布 5 篇内容 | 建立个人品牌 |

### 隐藏成就（不预先提示）

| 成就 ID | 名称 | 触发条件 |
|--------|------|---------|
| `lenny_fan` | Lenny 粉丝 | 收听 Lenny 相关的全部播客集 |
| `comeback_kid` | 东山再起 | 现金跌破 ¥5,000 后回到 ¥50,000 |
| `polyglot` | 双语创始人 | 在游戏中切换语言超过 3 次 |
| `midnight_dm` | 午夜私信 | 在游戏内时间 23:00-01:00 私信 NPC |

## 4.2 NPC 解锁系统

### 默认状态

- **王子墨**：游戏开始即可用（Telegram，非专家）
- **Lenny Rachitsky**：Onboarding 阶段 4，X DM 流程后添加

### 其他专家解锁条件

| 专家 | 解锁渠道 | 前置条件 |
|------|---------|---------|
| Jason Fried | 播客收听 / Safari 搜索 `bootstrap` / `一人公司` | 无 |
| April Dunford | 播客收听 / Safari 搜索 `positioning` / `产品定位` | 无 |
| Patrick Campbell | 播客收听 / Safari 搜索 `SaaS pricing` / `定价` | 无 |
| Shreyas Doshi | 播客收听 / Lenny 引荐（关系≥合作中）| 无 |
| Elena Verna | 播客收听 / Safari 搜索 `PLG` | 无 |
| Ryan Hoover | 播客收听 / Safari 搜索 `product launch` | 无 |
| Julie Zhuo | 播客收听 / Safari 搜索 `design` / `设计` | 无 |
| Andrew Wilkinson | 专家引荐（需≥2位专家达到合作中）| 声誉 ≥ 30 |
| Brian Balfour | 播客收听 / Safari 搜索 `distribution` / `分发` | 无 |
| 郑磊（隐藏） | Discord 发言 ≥ 3 次 且 贡献 ≥ 20 | 加入 Discord |

### 专家关系升级路径

```
陌生（0-39）→ 认识（40-59）→ 合作中（60-79）→ 深度伙伴（80-100）
```

**关系升级方式**：
- 每次对话 +3 信任度
- 付费咨询 +10 信任度
- 完成承诺 +5 信任度
- 逾期承诺 -8/-15 信任度

**关系升级解锁**：

| 关系等级 | 解锁内容 |
|---------|---------|
| 认识 | 可发起付费咨询；专家开始通过 Telegram 分享非正式建议 |
| 合作中 | AI 回复更深入；可触发引荐其他专家；可雇佣专家做项目 |
| 深度伙伴 | 专家主动通过 Telegram 推荐新人脉；可发起合作模式 |

## 4.3 App 解锁顺序

| App | 解锁时机 |
|-----|---------|
| Mail, Telegram, Todo, Settings | 游戏开始即解锁 |
| Calendar, Numbers, Podcast | Onboarding 完成后（与 Lenny 确定方向后）|
| Safari | 王子墨推荐 Lenny 后自动解锁 |
| Messages | 第一位专家添加联系人后 |
| Contacts | 第一位专家添加后 |
| Discord | Day 5+ 或 Safari 搜索「OPC」/「一人公司」|

## 4.4 成就通知

成就解锁时：
- 系统通知弹出（右上角）：`🏆 成就解锁 — [成就名称]`
- 在 Settings「玩家档案」页面的成就列表中显示
- Numbers 数据看板底部显示成就徽章
