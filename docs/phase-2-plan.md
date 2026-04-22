# Phase 2 规划（历史版）

> **这是规划阶段的文档**（对应 Phase 1 末期的设想）。真正落地的内容与取舍见 [`phase-2.md`](./phase-2.md)。
> 本文保留在仓库里是作为"当初打算怎么做 vs. 实际做了什么"的对照，不再更新。
>
> 最主要的偏差：Materials 做成了 URL-first（存外部链接），没有启用 Supabase Storage 上传；Calendar 只做了月视图、没做拖拽改期；Analytics 只出基础事实、没做环比趋势与渠道漏斗。

## 0. 共同原则

- **所有写操作仍由 server actions 承接**，Phase 1 沉淀下来的 `actions.ts / queries.ts / schema.ts` 分层不改变。
- **所有数据仍以 `user_id` 做 ownership 过滤**，不因为新模块放松这一约束。
- **文案走字典**：任何新页面的可见文本都在 `lib/i18n/dictionaries/*.ts` 增键，不在组件里硬编码。
- **不引入未经讨论的库**：日历、图表、上传等可选依赖先列好候选，再在 Phase 2 启动时统一决策。

---

## 1. Calendar（日历视图）

### 产品目标
把 `applications.deadlineAt` 与 `application_events.startsAt` 聚合到一张月/周视图上，替代用户在 Excel / Notion 里手工维护的 deadline 清单。

### 关键能力
- 月视图、周视图切换；默认月视图。
- 来源区分：deadline / OA / interview / offer response / custom，不同颜色。
- 点击单元格跳转到对应申请详情 Tab。
- 可按「公司 / 状态 / 优先级」筛选，筛选状态持久化到 URL querystring。
- 拖拽改期：拖动一个事件落到另一天 → 调用 `updateEvent` server action → 同步刷新申请时间线。

### 技术要点
- 视图库候选：`react-big-calendar` 或自研一个轻量月视图（已有 `components/ui/calendar.tsx` 的底子）。
- 数据模型：沿用现有 `applications` 与 `application_events`，不新增表。
- 时区：DB 全部存 UTC，渲染时使用浏览器时区 + `date-fns`。

### 验收门槛
一个用户可以在日历里看到最近两个月的所有 deadline 与面试事件；拖拽改期后申请详情页的时间线实时刷新。

---

## 2. Materials（材料库）

### 产品目标
把简历、Cover Letter、作品集、成绩单、证书集中管理，并且能清楚看到每一份材料在哪个岗位被用过。

### 关键能力
- 文件上传 + 版本命名（例如 `resume-v3-2026春招`）。
- 按类型分组：resume / cover_letter / portfolio / transcript / certificate / other。
- 绑定到具体申请：详情页的 Materials Tab 支持添加/解绑。
- 过期与冗余提示：超过 N 天未使用的材料，在库里打标签提醒清理。

### Schema 草案（Phase 2 再建）
```
materials(
  id pk, user_id fk,
  type MaterialType, name, file_url, version, tags jsonb, notes,
  created_at, updated_at,
  idx(user_id, type)
)
application_materials(
  id pk, application_id fk, material_id fk,
  purpose,            -- 'submitted_resume' / 'submitted_cl' / 'reference'
  created_at,
  unique(application_id, material_id, purpose)
)
```

### 技术要点
- 存储候选：Supabase Storage（已在 `.env.example` 预留位，Phase 1 未启用）。
- 文件大小限制：简历无所谓，作品集建议 50MB 以内；超限给前端提示。
- 不做在线预览，MVP 阶段只给下载链接。

### 验收门槛
用户上传一份简历 → 在新建申请表单里勾选「绑定简历 v3」→ 申请详情页 Materials Tab 能直接下载这份文件。

---

## 3. Offers（Offer 对比）

### 产品目标
当用户同时拿到多个 Offer 时，把薪资、地点、团队、响应截止时间横向铺开，辅助决策。

### 关键能力
- 自动聚合所有 `current_status = 'offer'` 的申请，生成一张对比表。
- 每列一个 Offer，可自由排序。
- 记录关键字段：base / bonus / 总包 / 地点 / 团队 / 响应截止日 / 决策状态（pending / accepted / declined / expired）。
- 记录 pros / cons 文本。
- 临近响应截止的 Offer 回传给 Dashboard 置顶提醒。

### Schema 草案（Phase 2 再建）
```
offers(
  id pk, application_id fk unique,
  base_salary, bonus, location, team,
  response_deadline_at,
  decision_status OfferDecision default 'pending',
  pros text, cons text,
  created_at, updated_at
)
```

### 技术要点
- 1:1（`application_id` unique）：一个申请最多一个 offer 行；若未来要支持 rebase 再放开。
- 响应截止时间与 `applications.deadlineAt` 语义不同，不复用同一字段。

### 验收门槛
用户拿到 3 个 offer 后打开 `/app/offers` 能看到并排对比表，能编辑每一个 offer 的 pros / cons；Dashboard 顶部出现「7 天内需回复」的提醒卡。

---

## 4. Analytics（分析）

### 产品目标
从已有数据里反馈投递节奏、响应时间、渠道效果，帮用户调整下一批投递策略。**不做花哨图表**，只给三张真正有用的视图。

### 关键视图
1. **状态漏斗**：wishlist → applied → oa → interview → offer，每一层显示数量与通过率。
2. **等待时间分布**：每个状态转移的平均天数，箱线或中位数即可。
3. **渠道效果**：按 `applications.source` 分组统计响应率（进入 oa 或 interview 的比例）。

### 数据来源
- 漏斗直接数 `applications.current_status`。
- 等待时间需要 `application_events` 上的 `event_type = 'applied'/'oa'/'interview'/'offer_response'` 时间戳；Phase 1 的事件表已覆盖。
- 渠道效果基于 `applications.source` + 当前状态。

### 技术要点
- 图表库候选：`recharts`（体积小、声明式、无 canvas 依赖）。
- 查询在 `features/analytics/queries.ts` 聚合，不把聚合计算放到前端。

### 验收门槛
一个有 20+ 申请的用户打开 `/app/analytics`，30 秒内能得到「我的 BOSS 直聘投递回复率比内推低很多」这类可操作结论。

---

## 5. 明确不做的

- 不做任务系统（todo / reminder），Phase 2 仍以「事件 + 截止日」驱动 Dashboard。
- 不做团队/分享功能。
- 不做 JD 解析、AI 建议，这些属于 Phase 3。
- 不做邮件识别，属于 Phase 4。

---

## 6. 启动 Phase 2 前的检查清单

- [ ] Phase 1 的 bug 收尾完毕（典型：表单日期、i18n 漏翻、拖拽边界）。
- [ ] `materials` 与 `offers` 的 schema 由一次单独讨论敲定，再写 migration。
- [ ] Storage 与 Supabase 的成本估算（材料库会带上传流量）。
- [ ] 明确日历库选型，避免动工后来回换库。
