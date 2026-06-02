# src/
> L2 | 父级: ../CLAUDE.md

成员清单
content.config.js: Astro 内容集合 schema，校验 pages 与 notes Markdown frontmatter、GEO 元数据、身份数据、笔记元数据和双语版本关联字段，并让 notes 内部 id 与公开 slug 解耦。
index.css: TailwindCSS v4 + shadcn Vercel 主题入口，定义设计令牌、暗色变量和基础层样式。
components/: 展示与感官组件目录，当前承载 FieldFigure 项目图版、ASCIIIcon 图标场、DecryptedText 文字动效、LoadingIntro 通用载入封面和 SensoryLayer soft 音效层。
content/: Markdown 真相源目录，当前承载 pages/build*.md 与 notes/*.md。
layouts/: Astro 布局目录，当前承载 JournalLayout Build 双语骨架和 NoteLayout 笔记骨架。
lib/: 共享工具目录，当前提供 shadcn cn class 合并工具和 Think/Build i18n 路由工具。
pages/: Astro 路由目录，当前提供默认中文 Think 首页、/en 英文 Think 首页、/build 与 /en/build 项目索引和中英 /notes/[slug] 静态文章路由。
styles/: 站点样式目录，当前承载 journal annex 全局视觉系统、notes 阅读版式和语言开关。

法则: 成员完整·一行一文件·父级链接·技术词前置

[PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
