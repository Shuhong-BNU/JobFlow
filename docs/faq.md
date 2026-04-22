# FAQ

这份 FAQ 不是 troubleshooting，而是"设计选择的答辩"。很多问题看起来反常识，其实背后都有权衡。挑八条常被问到的列在这里。

## 为什么端口是 3001 而不是 3000？

`3000` 是 Next.js / CRA / Vite 默认端口，本机开发同时跑三四个 Node 项目是常态。把 JobFlow 锁在 `3001` 让它能和其他项目并存，不用每次 `PORT=... next dev` 来回覆盖。

## 能改回 3000 吗？

能，两处改：`package.json` 的 `dev` 与 `start` 脚本里的 `-p 3001` 删掉，`.env` 里 `AUTH_URL` 改成 `http://localhost:3000`。但**不推荐**：默认值改了以后，CI 脚本、README 样例、dev:doctor 文案都需要同步，维护成本比收益高。

## 为什么日期选择器是自己搓的，不用 `react-day-picker`？

Phase 1 只需要"点一下弹日历、键入 yyyy-mm-dd 也能识别、表单校验走 zod"。`react-day-picker` 是成熟库，但引进来就要吃它的 CSS、locale、accessibility 约定，和现有 Tailwind + shadcn 体系磨合一周。自搓版本 200 行、0 依赖、明暗主题自动跟随。Phase 2 Calendar 视图真要做时再上。

## 为什么中文 UI 里还有 "Offer"、"OA" 这些英文词？

求职圈里"约面"、"在线笔试"这种直译反而陌生，"Offer"、"OA"、"HR 面"是社区共识。界面语言是沟通工具不是纯翻译考题，保留行业黑话比强行汉化更符合用户预期。英文版反过来也不会把 "interview" 翻成 "面谈"。

## 为什么 demo 账号密码直接写在 README 里？

JobFlow 是"本地或单人自托管"定位，demo 账号只存在你自己的数据库里，暴露它不比暴露 localhost 更危险。把账号藏起来只会增加首次启动的摩擦。生产部署前请跑 `npm run db:seed` 之外的清理并创建真实用户。

## 为什么 i18n 不用 URL prefix（`/zh/app/...`）？

URL prefix 适合 SEO 优先的站点。JobFlow 是鉴权后工作台，SEO 权重为零；用 cookie + Accept-Language 识别语言，切换不改 URL，刷新保留偏好。代价是不能通过 URL 分享特定语言的页面，但求职工作台没这种分享场景。

## 为什么 Phase 2 是占位页而不是空白 / 404？

Phase 2 Calendar / Materials / Offers / Analytics 在导航里已经露脸。点进去给 404 会让用户怀疑是 bug；给"规划中 + 详细规划链接"是诚实的：告诉用户这里将来有什么、现阶段为什么没有。占位页复用同一个 `Phase2Plan` 组件，改动集中、不拖累主业。

## 为什么 NextAuth 还在 beta 就用了？

`next-auth@5.0.0-beta.20` 比 v4 稳定版对 App Router 友好太多：Route Handler 原生集成、Server Action 里直接调 `auth()`、Edge Runtime 支持。v4 做 App Router 需要手写 adapter 胶水。beta 的风险是 API 可能微调，但 Phase 1 只用登录 + session 两个基础功能，迁移到稳定版成本可控。
