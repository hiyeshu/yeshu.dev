# yeshu.dev - Markdown-first personal field index
Astro + Markdown content collections + React islands + Three.js + TailwindCSS v4 + shadcn tokens

<directory>
public/ - 静态直出资产层 (1子目录: marks)
src/ - Astro 源码层 (6子目录: components, content, layouts, lib, pages, styles)
</directory>

<config>
astro.config.mjs - Astro 构建配置，接入 React island、Tailwind v4 和 @/src 别名
components.json - shadcn 配置文件，记录 Radix Nova 预设、Tailwind v4 CSS 入口和路径别名
jsconfig.json - 编辑器路径别名配置，把 @/* 指向 src/*
public/CLAUDE.md - L2 静态资产地图，记录 public 直出文件
public/favicon.svg - 浏览器标签页图标，来自 yeshu.svg
public/llms.txt - LLM 上下文入口，概括身份、项目和机器可读信号
public/marks/ - 项目图版标识资产目录，给 FieldFigure 点阵渲染提供本地 SVG
public/robots.txt - 爬虫访问策略，允许抓取并指向 sitemap.xml
public/sitemap.xml - 搜索引擎站点地图，声明首页 canonical URL
package.json - npm 依赖与脚本，声明 Astro、React island、Three.js、TailwindCSS v4、shadcn 和 UI 增强库
package-lock.json - npm 锁文件，固定依赖解析结果
.gitignore - 忽略依赖、构建产物、Astro 缓存和系统文件
CLAUDE.md - L1 项目宪法，记录当前架构地图
</config>

法则: 极简·稳定·导航·版本精确

## 变更日志
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
