# Phase 3 Runtime Validation

## 验收目标

本次验收只覆盖 JobFlow Phase 3 已设计并实现的 AI 增强层，不扩展产品边界，不进入 Gmail / Automation，不改 Auth、看板状态、Offer 规则或核心数据模型。

验收目标分为四类：

1. 验证 `/applications/new` 的 JD 自动解析在 fallback 路径下可真实运行。
2. 验证 `/applications/[id]` 的 AI 下一步建议与 AI 面试准备摘要在 fallback 路径下可真实运行。
3. 如果本地存在有效 `OPENAI_API_KEY`，再验证真实 provider 路径；如果不存在，则明确记录为“环境不具备，未执行”。
4. 验证 AI 输出不会污染业务主流程，并确认 `ai_tasks` 能正确记录输入、输出和状态。

## 验收环境

- 日期：2026-04-18
- 操作系统：Windows
- 运行目录：`D:\桌面\codex\260418-Meituan-AI-Codex`
- 应用启动方式：`next start`
- 基础地址：`http://127.0.0.1:3000`
- 数据库：PostgreSQL（本地 Docker 容器）
- 验收账号：`demo@jobflow.local`
- 浏览器自动化：本机 Chrome
- AI 环境变量状态：
  - `OPENAI_API_KEY`：未配置有效值
  - `OPENAI_BASE_URL`：空
  - `OPENAI_MODEL`：空

结论：本轮可真实验证 fallback 路径；provider 路径因环境不具备而跳过。

## 实际执行命令

### 应用启动与验收

```powershell
npm run start
node .runtime\phase3-runtime-validation.cjs
```

### 验收辅助与清理

```powershell
Get-Content .env.local -Encoding utf8
Get-Content .runtime\phase3-runtime-report.json -Encoding utf8
Stop-Process <phase3 validation related process ids> -Force
```

### 本轮临时依赖

```powershell
npm install --no-save playwright@1.59.1
```

说明：
- 该临时依赖仅用于本地页面级自动化验收，不属于产品正式依赖。
- 本轮未修改业务 schema，未新增 migration。

## Fallback 路径验证结果

### A. `/applications/new` 的 JD 自动解析

验收结果：通过

已验证内容：
- 在未配置有效 `OPENAI_API_KEY` 的前提下，点击“解析 JD”后页面能返回结构化结果。
- 页面明确显示来源为 `fallback 规则`。
- 点击“应用到申请表单”后，只会预填表单，不会自动创建 application。
- 本轮实际观测到被预填的字段包括：
  - `title`
  - `deadlineAt`
  - `notes`
- 本轮 fallback 结果中，`companyName` 与 `location` 未被提取到，因此对应表单字段保持空值。这是当前 fallback 的保守行为，不是写库错误。

数据库验证：
- `applications` 计数前后未变化。
- 最新 `ai_tasks(task_type=parse_jd)` 记录状态为 `success`。
- 最新 `ai_tasks.output_payload.source` 为 `fallback`。

### B. `/applications/[id]` 的 AI 下一步建议

验收结果：通过

已验证内容：
- 在未配置有效 `OPENAI_API_KEY` 的前提下，点击“生成建议”后能显示：
  - 下一步动作
  - 风险提示
  - 建议补的事件类型
  - 建议说明
- 页面明确显示来源为 `fallback 规则`。
- AI 建议只做展示，不会自动修改 application 状态，不会自动写入 events / notes。

数据库验证：
- `applications.current_status` 前后未变化。
- `application_events` 数量前后未变化。
- `application_notes` 数量前后未变化。
- 最新 `ai_tasks(task_type=suggest_next_step)` 记录状态为 `success`。
- 最新 `ai_tasks.output_payload.source` 为 `fallback`。

### C. `/applications/[id]` 的 AI 面试准备摘要

验收结果：通过

已验证内容：
- 在未配置有效 `OPENAI_API_KEY` 的前提下，点击“生成准备摘要”后能显示：
  - 核心能力
  - 问题方向
  - 准备清单
  - 公司 / 团队研究方向
  - 简历可展开点
  - 提醒事项
- 页面明确显示来源为 `fallback 规则`。
- AI 输出只做只读展示，不会写入业务主表。

数据库验证：
- `applications.current_status` 前后未变化。
- `application_events` 数量前后未变化。
- `application_notes` 数量前后未变化。
- 最新 `ai_tasks(task_type=interview_prep)` 记录状态为 `success`。
- 最新 `ai_tasks.output_payload.source` 为 `fallback`。

## Provider 路径验证结果

本轮状态：跳过

原因：
- 当前本地 `.env.local` 未配置有效 `OPENAI_API_KEY`。
- 因此无法对真实 provider 路径做在线调用验收。

结论：
- 当前仓库已经具备 provider 接入代码路径，但这轮只完成了 fallback 路径的真实运行验证。
- 若后续本地补齐有效 `OPENAI_API_KEY`，应补做以下三项 provider 验证：
  1. JD 自动解析返回结构化预填结果，页面来源显示为 `AI provider`
  2. AI 下一步建议返回建议、风险、建议事件类型，且不改业务主表
  3. AI 面试准备摘要返回准备信息，且不写入业务主表

## 各功能入口与行为边界验证结果

### `/applications/new`

- 入口存在：是
- 解析按钮可触发：是
- 可生成结构化结果：是
- 可应用到表单草稿：是
- 会不会自动创建 application：不会

### `/applications/[id]` 的 AI 下一步建议

- 入口存在：是
- 可触发生成：是
- 可展示建议结果：是
- 会不会自动改状态：不会
- 会不会自动写 events / notes：不会

### `/applications/[id]` 的 AI 面试准备摘要

- 入口存在：是
- 可触发生成：是
- 可展示准备摘要：是
- 会不会写入业务主表：不会

### 无 AI 环境变量时主系统是否正常

- Dashboard 可正常打开：是
- 登录后主系统可继续使用：是
- AI 功能会降级为 fallback，而不是阻塞应用：是

## ai_tasks 记录情况

本轮运行前后观测值：

- 验收前 `ai_tasks` 数量：`3`
- 验收后 `ai_tasks` 数量：`6`
- 本轮新增记录：`3`

本轮新增的任务类型与结果：

| task_type | status | source |
| --- | --- | --- |
| `parse_jd` | `success` | `fallback` |
| `suggest_next_step` | `success` | `fallback` |
| `interview_prep` | `success` | `fallback` |

结论：
- `ai_tasks` 已正确记录 AI 输入 / 输出流程对应的任务结果。
- 在 provider 不可用时，系统仍会把 fallback 结果以成功任务的形式记录下来，便于后续审计与排查。

## 中途报错与修复说明

### 1. 直接用 CLI 导入 AI service 做验收失败

现象：
- 直接用 `tsx` / CLI 导入 `features/ai/server/services.ts` 时，被 `server-only` 拦截。

原因：
- 该模块是按 Next.js Server Component / Server Action 语境设计的，不能直接作为普通 CLI 脚本导入。

处理：
- 改为真实启动应用后，用页面自动化方式做运行层验收。

### 2. Playwright 临时脚本第一次执行时找不到 `playwright`

现象：
- `npx -p playwright` 没有让本地脚本成功 `require("playwright")`。

处理：
- 使用 `npm install --no-save playwright@1.59.1` 临时安装浏览器自动化依赖，仅用于本轮验收。

### 3. 页面自动化首次失败在表单 selector

现象：
- 自动化最初通过 `getByLabel()` 查找部分新建申请页字段时超时。

原因：
- 部分字段使用的是视觉层 `Label`，并非完整原生 label 关联。

处理：
- 验收脚本改为按 `name` 与实际输入元素定位，随后通过。

## 当前已知限制 / Technical Debt

1. 当前本机未配置有效 `OPENAI_API_KEY`，因此 provider 路径尚未做真实在线验收。
2. fallback 版本的 JD 解析较保守，本轮只稳定预填了 `title`、`deadlineAt`、`notes`，未提取出公司名和地点。
3. `server-only` 使 AI service 不适合直接用普通 CLI 方式做白盒验收；后续若要补更稳定的自动化回归，建议继续走页面级或专门的 Next 运行环境测试。
4. 本轮页面验收依赖临时安装的 Playwright，本地可复现，但不应作为正式产品依赖提交。

## 最终结论

在当前本地环境下，JobFlow 已达到 **“Phase 3 可运行 AI 增强层”** 标准，依据如下：

1. Phase 3 的三个 AI 功能入口都已真实可用。
2. 在没有有效 AI 环境变量时，系统会稳定走 fallback，而不会影响主系统可用性。
3. JD 自动解析只会预填表单，不会自动创建 application。
4. AI 下一步建议不会自动改状态、不会自动写 events / notes。
5. AI 面试准备摘要不会写入业务主表。
6. `ai_tasks` 能正确记录输入 / 输出链路对应的任务结果。

补充说明：
- 真实 provider 路径代码已接入，但因为本地未配置有效 `OPENAI_API_KEY`，本轮未做在线调用验证。
- 因此本次结论是：**Phase 3 已达到“可运行 AI 增强层”标准，fallback 路径已真实验收通过；provider 路径待有有效环境变量后补充在线验收。**
