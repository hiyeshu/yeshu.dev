# scripts/
> L2 | 父级: ../CLAUDE.md

成员清单
sync-notion-thinking.mjs: Node 同步器，读取本机 Notion cookie 与 notion.db，调用 Notion loadPageChunk，把 Thinking 数据库投射成 Astro notes Markdown；支持 NOTION_SYNC_OFFLINE=1 只刷新本地缓存、目录地图和机器入口。
translate-notes.mjs: Node 翻译器，读取中文 notes Markdown，生成带 routeSlug 的英文 `*-en.md` 镜像并刷新 translation manifest、sitemap、llms 和 content/notes 地图。

法则: 只读外部源·不打印密钥·生成内容可重复·缓存可自修复

[PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
