# Provider Online Validation TODO

## 背景

JobFlow Phase 3 当前已经完成：

- `/applications/new` 的 JD 自动解析
- `/applications/[id]` 的 AI 下一步建议
- `/applications/[id]` 的 AI 面试准备摘要
- `ai_tasks` 记录 AI 调用输入、输出与状态
- provider 不可用时的 fallback 路径

截至当前，Phase 3 的 fallback 路径已经完成真实运行验收并通过。  
但由于本机尚未配置有效 `OPENAI_API_KEY`，真实 provider 在线路径尚未完成正式验收。

本待办用于固定后续补验收范围，不改变当前 Phase 3 冻结状态，不扩展功能，不改业务边界。

## 待办目标

在本机配置有效 `OPENAI_API_KEY` 后，补做一次 **provider 在线路径验收**。

## 待验收范围

### 1. `/applications/new` 的 JD 自动解析在线路径

需要验证：

- provider 可用时，点击“解析 JD”后是否返回结构化结果
- 页面来源是否显示为 `AI provider`
- 结果是否能正确预填申请表单
- 是否仍然只做表单预填，不会自动创建 application

### 2. `/applications/[id]` 的 AI 下一步建议在线路径

需要验证：

- provider 可用时，是否能输出：
  - 下一步动作
  - 风险提示
  - 建议事件类型
- 页面来源是否显示为 `AI provider`
- 是否仍然不会自动改 application 状态
- 是否仍然不会自动写 `application_events`
- 是否仍然不会自动写 `application_notes`

### 3. `/applications/[id]` 的 AI 面试准备摘要在线路径

需要验证：

- provider 可用时，是否能输出：
  - 核心能力
  - 问题方向
  - 准备清单
  - 公司 / 团队研究方向
  - 简历可展开点
  - 提醒事项
- 页面来源是否显示为 `AI provider`
- 是否仍然不会写入业务主表

### 4. `ai_tasks` 在 provider 模式下的记录是否正确

需要验证：

- `parse_jd`
- `suggest_next_step`
- `interview_prep`

对以上三类任务，确认：

- 是否成功落库
- `status` 是否正确
- `output_payload.source` 是否为 `provider`
- 是否正确记录 provider / model 信息（若当前实现有返回）

### 5. provider 失败时是否仍能安全回退到 fallback

需要验证：

- 在 provider 环境已配置的前提下，若调用失败：
  - 页面是否仍能返回 fallback 结果
  - 主系统是否仍保持可用
  - 不会阻塞 `/applications/new` 和 `/applications/[id]`
  - `ai_tasks` 是否能记录本次失败后回退的结果来源

## 验收前提

开始本待办前，需要满足：

- 本机已配置有效 `OPENAI_API_KEY`
- 如有需要，补齐：
  - `OPENAI_BASE_URL`
  - `OPENAI_MODEL`
- 数据库与应用可以本地正常启动
- Phase 3 当前功能不再继续扩展

## 验收方式建议

建议继续沿用 Phase 3 runtime validation 的方式：

1. 优先做真实页面级验收
2. 页面行为与数据库记录同时核对
3. 验证成功后新增或更新正式文档

建议补充文档位置：

- 更新 [Phase 3 Runtime Validation](/D:/桌面/codex/260418-Meituan-AI-Codex/docs/phases/phase-3-runtime-validation.md)

或补充一份新的 provider 在线验收记录文档。

## 明确不做

本待办只用于补 provider 在线路径验收，不代表进入新阶段。

仍然不做：

- Gmail / Mail
- Automation
- AI 自动写库
- 改 Auth
- 改看板 8 状态
- 改 offers 一对一规则
- 改 `applications` / `application_events` / `materials` 核心模型

## 当前状态

- 状态：待执行
- 优先级：中
- 触发条件：本机配置有效 `OPENAI_API_KEY` 后执行
