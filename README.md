# AI极简清单

一句话记录待办，自动识别分类与时间，支持云端同步的极简 H5 清单应用。

## 作品集入口

- 在线体验（推荐）：[AI极简清单](https://ai-life-todo-h5.pages.dev)
- 源码仓库：[1291712594/ai-life-todo-h5](https://github.com/1291712594/ai-life-todo-h5)
- 备用域名：[ai-life-todo-h5.vercel.app](https://ai-life-todo-h5.vercel.app)
- 展示关键词：React / Vite / Cloudflare Pages / Cloudflare Worker / Vercel Functions / MongoDB Atlas

> 说明：在部分网络环境下，`vercel.app` 域名可能无法稳定访问，作品集展示建议优先使用 `pages.dev` 地址。

## 项目截图 / 演示

### 推荐演示路径

1. 输入一句自然语言，例如 `明天下午3点开会`
2. 观察系统自动识别内容、时间与分类
3. 长按卡片，打开操作菜单
4. 修改时间、修改分类、标记完成
5. 删除事项并验证列表同步更新

### 页面展示要点

- 首页：输入框、分类标签、待办列表、在线状态
- 卡片交互：长按唤起操作菜单，支持修改时间 / 修改分类 / 删除
- 数据能力：新增、更新、删除都走云端接口，多设备可同步
- 设置页：支持用户类型切换与动态标签开关

## 项目简介

这个项目的目标是让用户尽量少思考“该放到哪个分类、要不要手动写时间”。

输入一句自然语言，例如：

- `明天下午3点开会`
- `周六买牛奶`
- `晚上 7 点健身`

前端会自动解析内容、时间和分类，并将数据同步到云端。应用同时支持：

- 购物 / 日程 / 其他 分类
- 中文时间表达解析
- 长按卡片修改时间 / 修改分类 / 删除
- 已完成状态切换
- 多设备云端同步
- 用户隔离存储（通过 `X-User-Id`）

## 当前架构

当前线上采用的是一个“前端可访问、后端稳定连库”的混合架构：

1. **Cloudflare Pages** 提供前端静态站点
2. **Cloudflare Worker** 作为 API 代理层
3. **Vercel Serverless Functions** 负责实际的 Node.js 后端逻辑
4. **MongoDB Atlas** 负责数据持久化

这样做的原因是：

- Cloudflare Pages 在当前网络环境下访问更稳定
- Vercel 的 Node.js 运行时对 MongoDB 官方驱动支持更稳定
- Cloudflare Worker 负责跨域与代理，前端只需要请求 `/api`

## 技术栈

- 前端：React 18 + Vite + React Router
- 状态管理：React Context
- 后端：Vercel Serverless Functions
- 代理：Cloudflare Worker
- 数据库：MongoDB Atlas
- 部署：Cloudflare Pages + Cloudflare Workers + Vercel

## 功能特性

- 智能输入解析：支持自然语言时间与分类提取
- 动态标签：根据文本内容计算动态标签
- 长按操作：支持修改时间、修改分类、删除
- 已完成切换：支持完成状态更新
- 下拉刷新：移动端列表支持下拉刷新
- 本地开发 Mock：开发环境可直接使用前端 mock 数据

## 本地开发

### 环境要求

- Node.js 18+
- npm

### 安装依赖

```bash
npm install
```

### 启动开发环境

```bash
npm run dev
```

默认访问：

```text
http://localhost:5173
```

### 本地开发说明

开发模式下，前端默认走 `src/api.js` 中的 mock 数据逻辑，因此即使后端未启动也可以调试主要交互。

生产模式下，请求会走：

```text
/api -> Cloudflare Worker -> Vercel API -> MongoDB Atlas
```

## 环境变量

### 前端

生产环境使用：

```env
VITE_API_BASE_URL=/api
```

### Vercel

Vercel 需要配置：

```env
MONGODB_URI=你的 MongoDB Atlas 连接字符串
```

### Cloudflare Worker

Worker 当前主要依赖：

```env
ALLOWED_ORIGINS=允许访问的前端域名列表
MONGODB_DB=todoDB
```

## 目录结构

```text
.
├─ api/                    # Vercel Serverless Functions
│  ├─ todos.js
│  └─ todos/
│     └─ [id].js
├─ functions/              # Cloudflare Pages Functions（历史/备用代理方案）
│  └─ api/
│     └─ [[path]].js
├─ src/                    # React 前端源码
│  ├─ components/
│  ├─ context/
│  ├─ hooks/
│  ├─ pages/
│  ├─ utils/
│  ├─ App.jsx
│  ├─ api.js
│  ├─ index.css
│  └─ main.jsx
├─ worker/                 # Cloudflare Worker 代理层
│  ├─ index.js
│  ├─ package.json
│  └─ wrangler.toml
├─ index.html
├─ package.json
├─ vercel.json
└─ vite.config.js
```

## API 说明

前端统一通过 `/api` 访问：

- `GET /api/todos`：获取当前用户事项列表
- `POST /api/todos`：创建事项
- `PATCH /api/todos/:id`：更新事项
- `DELETE /api/todos/:id`：删除事项

请求头需要带上：

```text
X-User-Id
```

前端会在本地自动生成并持久化这个 ID，用于隔离不同用户的数据。

## 构建

```bash
npm run build
```

## 已知说明

- `npm run lint` 脚本已存在，但当前仓库缺少 ESLint 配置文件，因此暂时无法直接运行
- 浏览器控制台中的以下提示不影响主要功能：
  - `apple-mobile-web-app-capable` 已废弃提示
  - `navigator.vibrate` 在部分浏览器手势限制下被拦截

## 后续可优化方向

- 补充 ESLint 配置并恢复 lint 校验
- 为后端接口补充更系统的日志与错误追踪
- 增加 README 截图与交互演示
- 统一整理 Cloudflare Pages Functions 与 Worker 的职责边界

## License

MIT
