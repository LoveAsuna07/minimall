# Mini Mall — 项目说明

微型电商演示项目，中文界面，货币 CNY。用户可以浏览/搜索商品、注册登录、加购、下单并模拟支付；管理员可以管理商品、分类和订单状态。

## 技术栈

| 层 | 选型 |
|---|---|
| 框架 | Next.js 16（App Router + Turbopack） |
| 语言 | TypeScript 5（strict） |
| 数据库 | SQLite（`prisma/dev.db`） |
| ORM | Prisma 5.22（`prisma` + `@prisma/client` 同版本） |
| 样式 | Tailwind CSS 4（`@tailwindcss/turbopack`，无 `tailwind.config.js`） |
| 认证 | 自建数据库 Session + httpOnly Cookie + bcryptjs |
| 校验 | Zod 3 |
| 运行时 | **Node.js 22 LTS**（Prisma 5 未官方验证 Node 24） |

## 常用命令

```bash
npm run dev          # 开发服务器 http://localhost:3000
npm run build        # 生产构建
npm run start        # 运行生产构建
npm run lint         # ESLint（Next 16 已移除 next lint）
npm run typecheck    # tsc --noEmit

npx prisma generate
npx prisma migrate dev --name <name>
npx prisma db seed
npx prisma migrate reset --force   # 重置并重新 seed
npx prisma studio
```

Windows 注意：若 `node` 不在 PATH，可使用 winget 安装路径
`C:\Users\29443\AppData\Local\Microsoft\WinGet\Packages\OpenJS.NodeJS.22_Microsoft.Winget.Source_8wekyb3d8bbwe\node-v22.23.2-win-x64`。
`DATABASE_URL="file:./dev.db"` 相对于 `prisma/schema.prisma`，实际文件是 `prisma/dev.db`。

## 目录结构

```text
prisma/
  schema.prisma          # 数据模型
  seed.ts                # 分类/商品/演示账号
src/
  app/                   # 路由（App Router）
    layout.tsx           # Header（登录态、购物车数量）/ Footer
    page.tsx             # 首页
    products/            # 列表、搜索、分类筛选、分页、详情
    login/ register/     # 认证页
    cart/ checkout/      # 购物车、结算
    orders/              # 用户订单列表/详情
    admin/               # 后台：商品、分类、订单、仪表盘
  actions/               # Server Actions（auth/cart/orders/admin-*）
  components/            # UI 组件
  lib/
    prisma.ts            # PrismaClient 单例（server-only）
    auth.ts              # Session、getCurrentUser、requireUser/Admin、safeNext
    orders.ts            # 事务化下单/取消
    constants.ts         # 角色、订单状态、状态流转、运费、分页
    validation.ts        # Zod schema、yuanToCents
    format.ts            # 金额/日期格式化
```

## 数据模型要点

- `User`：`role` 为 `"USER"` / `"ADMIN"` 字符串。
- `Session`：只存 token 的 SHA-256（`tokenHash`），Cookie 保存原始随机 token，有效期 7 天。
- `Product`：`price` 为**整数分**；`active` 表示上架状态；删除时历史订单依赖快照。
- `CartItem`：`@@unique([userId, productId])`，仅登录用户。
- `Order` / `OrderItem`：`status` 为字符串；订单项保存名称、价格、图片快照，商品删除后仍可查看历史订单。
- **Prisma 5 + SQLite 不支持 `enum`**。所有枚举用 `String` + `src/lib/constants.ts` 的 `as const` 联合类型 + Zod 校验，不要向 schema 添加 `enum` 块。

## 业务规则

**运费**：满 ¥99（9900 分）包邮，否则 ¥10（1000 分）。

**订单状态机**（服务端强制校验，不能只靠 UI）：

```text
PENDING --用户模拟支付--> PAID --管理员--> SHIPPED --管理员--> COMPLETED
PENDING --用户/管理员取消--> CANCELLED   （取消时回补库存）
```

`ADMIN_TRANSITIONS` 定义在 `src/lib/constants.ts`。非法流转必须返回错误。

**库存与下单**：

- 下单读取购物车后，在**同一个 `prisma.$transaction` 内**重新校验价格、库存并创建订单。
- 扣库存使用条件更新：`updateMany({ where: { id, active: true, stock: { gte: qty } }, data: { stock: { decrement: qty } } })`，`count !== 1` 即失败，防止超卖。
- 取消订单时在事务内改为 `CANCELLED` 并回补库存。
- 事务成功后才调用 `redirect()`，不要放在会吞异常的 `try/catch` 中。

**权限**：

- `requireUser(nextPath)`：未登录跳转 `/login?next=...`。
- `requireAdmin()`：未登录跳登录；非管理员跳 `/`。
- `app/admin/layout.tsx` 的保护只影响页面，**每个 Server Action 必须独立重新校验** `getCurrentUser()?.role === "ADMIN"`。
- 用户查询订单必须同时限定 `{ id, userId }`，防止越权。
- 登录回跳参数必须经过 `safeNext()`，只允许站内单斜杠路径，防开放重定向。

## 编码约定

- 写操作全部用 **Server Actions**（文件首行 `"use server"`），不新增 REST API。
- 普通校验失败返回 `{ ok: false, message, errors }`，不要抛异常；只有编程错误才抛。
- 表单：`useActionState` 从 `react` 导入，`useFormStatus` 从 `react-dom` 导入。
- 写操作后按需 `revalidatePath`；涉及 Header 登录态/购物车数量时调用 `revalidatePath("/", "layout")`。
- DB/Cookie 页面加 `export const dynamic = "force-dynamic"`。
- Next 16 的 `params`、`searchParams`、`cookies()`、`headers()` 均为 Promise，必须 `await`。
- 价格输入用字符串解析转分（`yuanToCents`），禁止浮点运算；展示统一用 `formatCents`。
- 商品图片统一使用 `ProductImage` 组件（普通 `<img loading="lazy">`），不要用 `next/image` 加载任意外链。
- Tailwind 4 用 `@theme` 定义设计 token；不要创建 `tailwind.config.js`；不要动态拼接类名。
- UI 文案、错误提示、金额与日期格式统一为中文。

## 版本注意事项

- **Node 22**：不要升级到 Node 24 后再排查 Prisma 5 的兼容问题。
- 脚手架默认开启 `cacheComponents` / `partialPrefetching`，本项目**不使用**；在 `next.config.ts` 中移除。
- `next lint` 已移除，`package.json` 的 lint 脚本是 `eslint`。
- Prisma 需要 `serverExternalPackages: ["@prisma/client", "prisma"]`，且 `lib/prisma.ts` 加 `import "server-only"`。
- 使用纯 JS 的 `bcryptjs`，不要换成需要原生编译的 `bcrypt`。
- Next.js 16 存在破坏性变更；写代码前可查阅 `node_modules/next/dist/docs/` 与根目录 `AGENTS.md`。

## 种子账号

| 角色 | 邮箱 | 密码 |
|---|---|---|
| 管理员 | `admin@minimall.test` | `Admin123456` |
| 普通用户 | `user@minimall.test` | `User123456` |

种子数据包含 4 个分类、12 个商品，可重复执行（全部使用 upsert）。

## 验证清单

```bash
npm run lint && npm run typecheck && npm run build
```

核心流程手工验证：

1. 注册 → 自动登录；重复邮箱、短密码被拒。
2. 未登录加购 → 跳登录并回跳原页面。
3. 购物车增删改、库存上限、¥99 包邮阈值。
4. 搜索 / 分类 / 分页组合；非法参数不报错。
5. 下单后购物车清空、库存扣减；取消 PENDING 订单后库存回补。
6. 模拟支付；重复支付被拒。
7. 普通用户访问 `/admin` 被拒；管理员完成商品/分类 CRUD 与订单状态流转。
8. 并发下单同一件库存为 1 的商品，只有一个成功且库存不为负。

<!-- superpowers-zh:begin (do not edit between these markers) -->
# Superpowers-ZH 中文增强版

本项目已安装 superpowers-zh 技能框架（21 个 skills）。

## 核心规则

1. **收到任务时，先检查是否有匹配的 skill** — 哪怕只有 1% 的可能性也要检查
2. **设计先于编码** — 收到功能需求时，先用 brainstorming skill 做需求分析
3. **测试先于实现** — 写代码前先写测试（TDD）
4. **验证先于完成** — 声称完成前必须运行验证命令

## 可用 Skills

Skills 位于 `.claude/skills/` 目录，每个 skill 有独立的 `SKILL.md` 文件。

- **brainstorming**: 在任何创造性工作之前必须使用此技能——创建功能、构建组件、添加功能或修改行为。在实现之前先探索用户意图、需求和设计。
- **chinese-code-review**: 中文 review 沟通参考——话术模板、分级标注（必须修复/建议修改/仅供参考）、国内团队常见反模式应对。仅在用户显式 /chinese-code-review 时调用，不要根据上下文自动触发。
- **chinese-commit-conventions**: 中文 commit 与 changelog 配置参考——Conventional Commits 中文适配、commitlint/husky/commitizen 中文模板、conventional-changelog 中文配置。仅在用户显式 /chinese-commit-conventions 时调用，不要根据上下文自动触发。
- **chinese-documentation**: 中文文档排版参考——中英文空格、全半角标点、术语保留、链接格式、中文文案排版指北约定。仅在用户显式 /chinese-documentation 时调用，不要根据上下文自动触发。
- **chinese-git-workflow**: 国内 Git 平台配置参考——Gitee、Coding.net、极狐 GitLab、CNB 的 SSH/HTTPS/凭据/CI 接入差异与镜像同步配置。仅在用户显式 /chinese-git-workflow 时调用，不要根据上下文自动触发。
- **diagnosing-superpowers**: 当一次 superpowers 会话出了问题、你的人类伙伴想知道原因时使用——重复劳动、无视计划、磕磕绊绊、结果质量差、某个技能没触发、"太慢了"、"为什么这么贵"、"它到底在干什么"——或者想给 superpowers 维护者整理一份 bug 报告；适用于当前会话，或按 id / 路径指定的过往会话，任何工具均可
- **dispatching-parallel-agents**: 当面对 2 个以上可以独立进行、无共享状态或顺序依赖的任务时使用
- **executing-plans**: 当你要在当前会话里亲自担任实现者执行一份实现计划时使用——你的人类伙伴选择了内联执行，或者没有可用的子智能体工具
- **finishing-a-development-branch**: 当实现完成、所有测试通过、需要决定如何集成这份工作时使用
- **mcp-builder**: 在构建 MCP 服务器或 MCP 工具时使用 —— 系统化的生产级 MCP 构建方法论，覆盖工具设计、错误处理、传输层选择与测试，让 AI 助手连接外部能力
- **receiving-code-review**: 收到代码审查反馈后、实施建议之前使用，尤其当反馈不明确或技术上有疑问时——需要技术严谨性和验证，而非敷衍附和或盲目执行
- **requesting-code-review**: 完成任务、实现重要功能或合并前使用，用于验证工作成果是否符合要求
- **subagent-driven-development**: 当在当前会话中执行包含独立任务的实现计划时使用
- **systematic-debugging**: 遇到任何 bug、测试失败或异常行为时使用，在提出修复方案之前执行
- **test-driven-development**: 在实现任何功能或修复 bug 时使用，在编写实现代码之前
- **using-git-worktrees**: 当需要开始与当前工作区隔离的功能开发，或在执行实现计划之前使用——通过原生工具或 git worktree 回退机制确保隔离工作区存在
- **using-superpowers**: 在开始任何对话时使用——确立如何查找和使用技能，要求在任何响应（包括澄清性问题）之前调用 Skill 工具
- **verification-before-completion**: 在宣称工作完成、已修复或测试通过之前使用，在提交或创建 PR 之前——必须运行验证命令并确认输出后才能声称成功；始终用证据支撑断言
- **workflow-runner**: 在 Claude Code / OpenClaw / Cursor 中直接运行 agency-orchestrator YAML 工作流——无需 API key，使用当前会话的 LLM 作为执行引擎。当用户提供 .yaml 工作流文件或要求多角色协作完成任务时触发。
- **writing-plans**: 当你有规格说明或需求用于多步骤任务时使用，在动手写代码之前
- **writing-skills**: 当创建新技能、编辑现有技能或在部署前验证技能是否有效时使用

## 如何使用

当任务匹配某个 skill 时，使用 `Skill` 工具加载对应 skill 并严格遵循其流程。绝不要用 Read 工具读取 SKILL.md 文件。

如果你认为哪怕只有 1% 的可能性某个 skill 适用于你正在做的事情，你必须调用该 skill 检查。
<!-- superpowers-zh:end -->
