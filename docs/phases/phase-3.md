# Phase 3 实施记录

## 目标

在不改变 JobFlow Phase 2 产品本体的前提下，把 AI 作为增强层接入，完成三项能力：

1. JD 自动解析
2. AI 下一步建议
3. AI 面试准备摘要

核心原则：

- AI 只做辅助层
- AI 失败不能影响主流程
- AI 输出默认是草稿 / 建议 / 提纲
- 不让 AI 直接污染 `applications`、`application_events`、`materials`、`offers` 主数据

## 本轮范围

### 已实现

- `features/ai` 领域层
- OpenAI-compatible provider abstraction
- Prompt 与 response schema 分离
- `ai_tasks` 调用记录
- provider 调用失败后的 fallback
- `/applications/new` 中的 AI JD 解析
- `/applications/[id]` 中的 AI 下一步建议
- `/applications/[id]` 中的 AI 面试准备摘要

### 明确未做

- Gmail / Mail
- Automation
- 自动创建 application
- 自动创建 event
- 自动写 note
- 自动改 application 状态

## Schema 结论

本轮没有新增 migration。

原因：

- 现有 `ai_tasks` 已足够承载 Phase 3 第一版能力
- 通过 `input_payload` / `output_payload` 已能保存请求上下文与结构化结果

Phase 3 继续复用：

- `applications`
- `application_events`
- `application_materials`
- `materials`
- `application_notes`
- `offers`
- `ai_tasks`

## 关键实现

## 1. Provider abstraction

已新增统一的 OpenAI-compatible provider 抽象：

- 统一走 `generateStructuredObject`
- 页面和 Server Action 不直接调用模型接口
- provider 只负责：
  - 调模型
  - 返回文本
  - 交给 Zod schema 校验

好处：

- 后续可以替换 provider / model
- 不会把模型细节耦合进页面组件

## 2. Prompt / schema / service 分层

当前已拆分为：

- `features/ai/prompts/*`
- `features/ai/schema/*`
- `features/ai/server/services.ts`
- `features/ai/server/actions.ts`

职责边界：

- prompt：定义如何问
- schema：定义如何校验输出
- service：定义如何组装上下文、调用 provider、记录 `ai_tasks`
- action：作为页面入口

## 3. Fallback

三项 AI 能力都已提供 fallback：

### JD 自动解析 fallback

- 使用本地规则做保守解析
- 尝试提取公司、岗位、地点、岗位类型、截止日期、技能关键词

### 下一步建议 fallback

- 基于当前 application / events / materials / offer 数据生成保守建议
- 例如：
  - 缺 deadline
  - 缺材料
  - 缺 follow_up
  - offer 缺回复时间

### 面试准备 fallback

- 结合岗位信息、当前材料和上下文，生成通用但可执行的准备清单

结论：

- 即使不配置 AI provider，Phase 3 页面仍然能给出可用结果

## 页面入口

## 1. `/applications/new`

已新增：

- AI JD 解析卡片
- 用户粘贴 JD 文本后生成结构化结果
- 用户点击“应用到申请表单”后，才把结果写入表单草稿

注意：

- 不直接写库
- 不自动创建 application

## 2. `/applications/[id]`

已新增：

- AI 下一步建议卡片
- AI 面试准备摘要卡片

注意：

- AI 输出只展示，不直接回写业务表
- 用户若认同 AI 建议，需要手动去维护 timeline / notes / materials / offer

## 运行逻辑

每次 AI 调用都会：

1. 写一条 `ai_tasks` queued 记录
2. 尝试走 provider
3. 成功则记录为 `success`
4. 若 provider 失败，则走 fallback 并仍记录为 `success`
5. 若出现不可恢复错误，再记录为 `failed`

这样可以保证：

- AI 调用可追踪
- 结果来源可区分
- 失败不会拖垮主流程

## 主要新增文件

- `features/ai/prompts/*`
- `features/ai/schema/*`
- `features/ai/server/provider.ts`
- `features/ai/server/repository.ts`
- `features/ai/server/fallbacks.ts`
- `features/ai/server/services.ts`
- `features/ai/server/actions.ts`
- `features/ai/components/jd-parse-assistant.tsx`
- `features/ai/components/application-ai-panel.tsx`
- `features/applications/components/new-application-workspace.tsx`

同时扩展了：

- `features/applications/components/application-form.tsx`
- `app/(app)/applications/new/page.tsx`
- `app/(app)/applications/[id]/page.tsx`
- `README.md`

## 验证结果

本轮已执行：

```bash
npm run typecheck
npm run lint
npm run build
```

结果：

- `typecheck` 通过
- `lint` 通过
- `build` 通过

补充说明：

- 当前环境下未对真实外部 AI provider 做线上调用验证
- 若未配置 `OPENAI_API_KEY`，系统会走 fallback 路径

## 已知限制

- 当前没有把 JD 原文持久化到业务表，所以面试准备摘要默认基于已有岗位信息和用户补充上下文
- AI 输出没有历史展示页，当前只记录在 `ai_tasks`
- 当前 AI 输出不会自动写 note / event，这属于有意设计，不是缺失
- provider 调用使用通用 OpenAI-compatible chat completions 方式，若某些兼容服务要求特殊参数，需要后续扩展 provider 层
- 目前只做同步调用，没有引入异步任务队列

## 阶段结论

Phase 3 第一版已经完成：

- JD 自动解析
- AI 下一步建议
- AI 面试准备摘要

同时继续保持：

- Phase 2 产品本体不被破坏
- AI 只做增强层
- 主流程仍由用户主导

当前仓库已经具备进入后续 AI 优化迭代的基础，但还没有进入 Gmail / Automation 范围。
