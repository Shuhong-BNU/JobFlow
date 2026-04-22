# docs/assets

README 和其他文档引用的静态资源统一放在这里。

## 目录

- `screenshots/`：产品界面截图，主要给 README、阶段文档、部署文档使用。
- `diagrams/`：架构图、流程图、对比图等说明性素材。

## 命名规范

统一格式：

```text
<page>-<theme>-<locale>.<ext>
```

示例：

```text
hero.png
landing-light-zh.png
sign-in-light-zh.png
dashboard-light-zh.png
board-light-zh.png
list-light-zh.png
detail-light-zh.png
timeline-light-zh.png
language-toggle.webp
```

字段约定：

- `<page>`：页面关键词，例如 `landing`、`sign-in`、`dashboard`、`board`、`list`、`detail`、`timeline`。
- `<theme>`：`light` 或 `dark`。主 README 优先使用 `light`，保持视觉统一。
- `<locale>`：`zh` 或 `en`。主 README 优先使用中文截图；英文 README 可以先复用中文截图。
- `<ext>`：静态截图推荐 `.png`，短动图推荐 `.webp`，只在必要时使用 `.gif`。

## 分辨率与压缩

- 浏览器建议宽度：`1440px`
- 导出建议：2x 截图，控制在 `2880px` 宽度以内
- 单张 PNG 压缩后建议 `< 500 KB`
- 动图建议 `< 2 MB`
- 动图时长建议 `3s - 8s`

## README 引用方式

Hero 图建议居中展示：

```html
<p align="center">
  <img src="docs/assets/screenshots/hero.png" alt="JobFlow hero" width="880">
</p>
```

截图区建议用 Markdown 表格，GitHub 渲染更稳定：

```md
| Dashboard | Board | List |
|---|---|---|
| ![](docs/assets/screenshots/dashboard-light-zh.png) | ![](docs/assets/screenshots/board-light-zh.png) | ![](docs/assets/screenshots/list-light-zh.png) |
```

## 截图清单

### 1. `landing-light-zh.png`

- 用途：README 首屏说明产品定位。
- 建议保留：标题、主按钮、语言切换入口。
- 不建议：截到太多浏览器工具栏和空白区域。

### 2. `sign-in-light-zh.png`

- 用途：展示登录链路和默认入口。
- 建议保留：邮箱、密码输入框、登录按钮、语言切换按钮。
- 注意：演示账号可以使用示例值，不要暴露真实邮箱和密码。

### 3. `sign-up-light-zh.png`

- 用途：展示新账号注册链路可用。
- 建议保留：注册字段、提交按钮、切换到登录页的入口。
- 注意：如果页面文案有错误提示，可以保留一版正常态即可，不必特意截报错态。

### 4. `dashboard-light-zh.png`

- 用途：作为最核心的一张总览图。
- 建议保留：统计卡片、近期提醒、最近活动。
- 注意：让页面内容填满，不要出现大片空白。

### 5. `board-light-zh.png`

- 用途：展示求职流程推进感。
- 建议保留：至少 5 列有数据，卡片分布自然。
- 注意：最好先准备一组更像真实申请的演示数据。

### 6. `list-light-zh.png`

- 用途：展示搜索、筛选、排序和表格管理。
- 建议保留：筛选条、表格表头、若干行数据。
- 注意：同屏体现“管理感”，不要只截表格局部。

### 7. `detail-light-zh.png`

- 用途：展示单条申请的完整信息。
- 建议保留：公司、岗位、状态、关键日期、备注摘要。
- 注意：尽量让页面主体同屏，不要只截中间一小块。

### 8. `timeline-light-zh.png`

- 用途：展示过程可追溯。
- 建议保留：事件、备注、时间顺序。
- 注意：至少保留 3 到 5 条时间线记录，看起来更完整。

### 9. `language-toggle.webp`

- 用途：展示中英切换是即时生效的。
- 建议内容：同一页面点击按钮后，文案切换前后对比。
- 注意：优先录成短 `webp` 动图；如果不方便，也可以做一张左右拼图。

## 拍图前的小检查

- 统一使用浅色主题作为 README 主图。
- 优先使用中文界面，和中文主 README 保持一致。
- 准备 6 到 10 条更像真实数据的演示内容，避免 `Company A / Role B` 这种占位感太强的数据。
- 裁掉浏览器无关 UI，尽量让产品本身占画面主体。
- 如果同一组图会同时用于中英文文档，优先保证布局一致，再决定是否补英文版截图。
