# 🗺 Roadmap

求职进度管理不是一次性工程。下面这份路线图用状态词而不是承诺，标明 JobFlow 当前在做什么、下一步打算做什么、哪些事不会做。

## 👀 当前一览

| 模块 | 阶段 | 状态 | 价值主张 | 详细文档 |
|---|---|---|---|---|
| 申请看板 / 列表 / 详情 / Timeline / Dashboard | Phase 1 | **Shipping** | 一块看板管完一整条求职流程 | [phase-1.md](./phase-1.md) |
| Calendar（日历视图） | Phase 2 | **Shipping** | 把 deadline 与面试排进月视图，节奏一眼可见 | [phase-2.md#v030--offers--calendar--analytics](./phase-2.md) |
| Materials（材料库） | Phase 2 | **Shipping** | 简历 / Cover Letter / 作品集集中登记，清楚知道每一份投到哪 | [phase-2.md#v040--materials](./phase-2.md) |
| Offers（Offer 对比） | Phase 2 | **Shipping** | 多 Offer 到手时横向对比薪资、地点、响应期限 | [phase-2.md#v030--offers--calendar--analytics](./phase-2.md) |
| Analytics（投递分析） | Phase 2 | **Shipping** | 基础事实：漏斗 / 来源分布 / 等待时间 | [phase-2.md#v030--offers--calendar--analytics](./phase-2.md) |
| 材料文件上传（Supabase Storage） | Phase 3 | Planned | 让材料正文也住在 JobFlow 内，不依赖外链 | — |
| JD 解析 / 面试准备 | Phase 3 | Exploring | 从 JD 粘贴生成结构化申请草稿；面试前的上下文摘要 | — |
| Gmail 邮件识别 | Phase 4 | Exploring | 从邮件自动识别 OA / 面试 / 拒信并匹配到申请 | — |

---

## 🚀 当前版本 — Phase 1（Shipping）

一块看板管完 wishlist → applied → OA → interview → HR → offer → rejected → archived 全流程，配 Dashboard 汇总、列表筛选、详情时间线、双语切换。日期选择、必填提示、启动自检都已到位。

详见 [phase-1.md](./phase-1.md)。

## 📦 已规划版本 — Phase 2

Phase 2 分三轮冻结：v0.2.0（进度视图 + 部署支持）、v0.3.0（Offers + Calendar + Analytics）、v0.4.0（Materials）。

- **Calendar**：月视图；合并 deadline 与事件；URL 驱动（`?m=yyyy-MM`）。拖拽改期留到 Phase 3。
- **Offers**：申请 ↔ offer 1:1，全字段可选；详情 Tab 与总览页双入口。
- **Analytics v1**：诚实的事实——按当前状态累计的漏斗、来源分布、still-waiting 均值。不做环比、不做 AI 洞察。
- **Materials**：URL-first，不做文件上传。外链登记 + 绑定到申请。细节见下方 "Phase 3+"。

完整执行记录见 [phase-2.md](./phase-2.md)。原规划文档保留在 [phase-2-plan.md](./phase-2-plan.md) 作为"当初设想"对照。

---

## 🔭 下一阶段 — Phase 3（Planned / Exploring）

### Materials 文件上传（Planned）
**能力目标**：把材料正文托管到 Supabase Storage，摆脱外链依赖。
**用户价值**：无需 Google Drive / Dropbox 的一站式体验；可以做版本历史与内容预览。
**依赖项**：启用 Supabase Storage bucket、签名 URL、MIME / 大小校验、删除时孤儿清理。

### JD 解析与下一步建议（Exploring）
粘贴 JD 文本 → 结构化成申请草稿；按申请维度给出"下一步做什么"的轻量建议。失败时不阻断核心 CRUD。

### Calendar 拖拽改期（Exploring）
把事件拖到另一天 → 调 `updateEvent`。需要乐观更新 + 冲突回滚；v1 预算不足。

### Analytics 环比趋势（Exploring）
需要 `application_status_history` 或 event 追溯，v1 有意不做。

---

## 🧪 后续方向 — Phase 4+（Exploring）

> 暂无发布时间承诺，仅保留方向边界与优先级参考。

- **Gmail 邮件识别（read-only）**：自动识别 OA 邀请 / 面试邀请 / 拒信 / offer 邮件，归到对应申请的时间线。**不做自动投递、不做自动回复**。

---

## ⛔ Non-goals

- 不做多用户协作。JobFlow 的模型是"一个人的求职档案"。
- 不做招聘方视角（ATS / JD 发布）。
- 不做原生 App。Web 优先，响应式覆盖移动端浏览器即可。
- 不做自动投递 / 自动回复邮件。所有写操作都要用户确认。
- 不做"Excel 导入一键接管"。早期用户手工录入更可靠。

---

## 💬 Feedback

路线图欢迎挑战。有意见开 Issue，有更好的 roadmap 写法也欢迎在 Discussions 里讨论。
