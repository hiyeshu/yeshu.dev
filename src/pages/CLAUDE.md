# pages/
> L2 | 父级: ../CLAUDE.md

成员清单
index.astro: Astro 默认中文 Think 路由，读取 notes collection 并生成中文公共思考目录。
build.astro: Astro 中文 Build 路由，读取 pages/build.md 并交给 JournalLayout 渲染 /build/ 项目索引。
en/: Astro 英文镜像路由目录，生成 /en/ 英文目录、/en/build/ 英文项目索引与 /en/notes/[slug]/ 英文文章页。
notes/: Astro 中文 notes 文章路由目录，读取 notes collection 并生成 /notes/[slug]/ 静态页面。

法则: 路由薄·数据外置·渲染委托

[PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
