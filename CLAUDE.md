# yeshu.dev - Markdown-first personal field index
Astro + Markdown content collections + React islands + Three.js + TailwindCSS v4 + shadcn tokens

<directory>
public/ - 静态直出资产层 (1子目录: marks)
scripts/ - 本地同步脚本层 (2文件: sync-notion-thinking.mjs, translate-notes.mjs)
src/ - Astro 源码层 (6子目录: components, content, layouts, lib, pages, styles)
</directory>

<config>
astro.config.mjs - Astro 构建配置，接入 React island、Tailwind v4 和 @/src 别名
components.json - shadcn 配置文件，记录 Radix Nova 预设、Tailwind v4 CSS 入口和路径别名
DESIGN.md - 设计系统契约，定义 Field Journal Annex 风格、组件抽象顺序和后续重构边界
jsconfig.json - 编辑器路径别名配置，把 @/* 指向 src/*
public/CLAUDE.md - L2 静态资产地图，记录 public 直出文件
public/favicon.svg - 浏览器标签页图标，来自 yeshu.svg
public/llms.txt - LLM 上下文入口，概括身份、Think/Build 导航、文章、项目和机器可读信号
public/marks/ - 项目图版标识资产目录，给 FieldFigure 点阵渲染提供本地 SVG
public/robots.txt - 爬虫访问策略，允许抓取并指向 sitemap.xml
public/sitemap.xml - 搜索引擎站点地图，声明 Think 首页、Build 中英索引和公开 note canonical URL
package.json - npm 依赖与脚本，声明 Astro、React island、Three.js、TailwindCSS v4、shadcn 和 UI 增强库
package-lock.json - npm 锁文件，固定依赖解析结果
scripts/CLAUDE.md - L2 同步脚本地图，记录 Notion 到 notes 的本地投射边界
scripts/sync-notion-thinking.mjs - Notion Thinking 同步脚本，读取本机登录态并生成 notes Markdown，不打印密钥
scripts/translate-notes.mjs - notes 英文镜像生成脚本，翻译中文 Markdown 并刷新 sitemap、llms 和内容地图
.gitignore - 忽略依赖、构建产物、Astro 缓存和系统文件
CLAUDE.md - L1 项目宪法，记录当前架构地图
</config>

法则: 极简·稳定·导航·版本精确

## 变更日志
- 2026-06-02: 补齐 Build 双语路由，新增 /en/build/ 与 build-en.md，让 JournalLayout 接入常驻 CN/EN 切换和 Think/Build i18n 路径。
- 2026-06-02: 新增 notes i18n 路由与翻译同步器，生成 /en/ 英文 Think 首页、英文文章页、translation manifest、sitemap 与 llms 双语入口，并将 CN/EN 切换固定到顶栏导航组；LoadingIntro 改为会话首次加载才显示。
- 2026-06-02: 将载入封面抽象为通用 LoadingIntro，页面载入时居中揭示 YESHU LOADING.....。
- 2026-06-02: 将 Notion 文章的卷首语段抽取为 Think 副标题并从正文移除，补充同步器离线缓存刷新模式。
- 2026-06-02: 简化 Think 文章侧栏为标题日期列表，移除统计与 Index 行，并让当前项沿用顶部导航的小方块标记。
- 2026-06-02: 新增 Notion Thinking 同步脚本，建立 Notion 数据库到 Astro notes 的可重复投射路径。
- 2026-06-02: 还原 Think 详情页 journal annex 阅读风格，保留 CN/EN 语言开关。
- 2026-06-02: 新增《把 Token 花在没用的地方》Think note 与英文版本，加入 CN/EN 关联，并同步 sitemap 与 llms 机器入口。
- 2026-05-31: 将根路由设为 Think 页面，新增 /build 项目索引路由，并发布《不是所有问题都要解决》。
- 2026-05-31: 顶部状态导航收敛为 Think/Build，移除 Home 槽位，将 Notes/Projects 改为观众语义。
- 2026-05-30: 顶部状态导航回退为 Home/Notes/Projects 索引标记样式，current 不再反白成选项卡。
- 2026-05-30: 修复状态导航 current 与 hover 级联冲突，确保悬停反白时文字保持可见。
- 2026-05-30: 恢复 hover 反白反馈，current 保持纸面索引标记，避免状态语义混淆。
- 2026-05-30: 统一 hover/current 边界，避免交互态破坏网格格局。
- 2026-05-30: 将内部滚动条改为 SensoryLayer overlay 指示器，压在内容面上而不参与布局。
- 2026-05-30: 静止时折叠原生滚动条宽度，彻底消除透明滚动条留下的空槽黑边。
- 2026-05-30: 移除滚动面的永久 gutter，避免静止状态出现固定黑边。
- 2026-05-30: 将滚动条纳入 SensoryLayer 统一控制，默认隐藏，仅滚动时显示黑白细条。
- 2026-05-30: 将内部滚动面的滚动条改为黑白细条，避免系统灰色控件破坏纸面风格。
- 2026-05-30: 固定 journal 外框与顶栏，改为仅内部 main surface 滚动。
- 2026-05-30: 将状态导航当前项从整块反黑改为索引标记，保留 hover 的短暂反黑反馈。
- 2026-05-30: 将顶部 Volume/Date/Index 状态读数升级为可点击状态导航，保留原始 meta-datum 视觉。
- 2026-05-30: 新增 SensoryLayer soft 音效层，使用 Web Audio API 为 hover/click/navigation 提供低音量交互反馈。
- 2026-05-30: 提取 DESIGN.md，固定 Field Journal Annex 设计系统、组件集合和后续抽象顺序。
- 2026-05-30: 新增 /notes Markdown 博客框架，保留 journal annex 首页布局并接入 notes collection、列表页、详情页和公开索引。
- 2026-05-16: 增加 GEO 基础层：canonical/OG/Twitter/JSON-LD、robots.txt、sitemap.xml 和 llms.txt。
- 2026-05-15: 将项目图版升级为 React + Three ASCII 图标场，默认静态，悬停时才启动动画。
- 2026-05-14: 为项目图版增加 Markdown visual 数据、本地 marks SVG 资产和黑白点阵渲染层。
- 2026-05-14: 从 Vite React 迁移到 Astro Markdown 内容架构，首页改为 journal annex 风格个人项目索引。
- 2026-05-14: 执行 shadcn Vercel theme registry，生成 components.json、src/lib/utils.js，并写入 shadcn 主题令牌。
- 2026-05-14: 初始化 TailwindCSS v4 Vite 插件、@ 路径别名和 UI 增强库依赖。
- 2026-05-14: 浏览器标签页标题从 yeshu.dev 改为 Yeshu。
- 2026-05-14: 将用户提供的 yeshu.svg 接入为 /favicon.svg，补齐 public 静态资产地图。
- 2026-05-13: 固定浅色底和纯黑标识，移除系统暗色模式下的反色分支。
- 2026-05-13: 主页标识改为全大写 YESHU.DEV，标题与动效字体权重提升至 900。
- 2026-05-13: 主页字体从衬线体切换为 Helvetica 系列，标题与动效共享同一字体变量。
- 2026-05-13: npm install 生成 package-lock.json，锁定 motion 与 React 构建依赖。
- 2026-05-13: 升级为 Vite React 应用，接入 React Bits ScrollVelocity 与 motion。
- 2026-05-13: 播种静态主页，建立 L1/L3 文档同构。
