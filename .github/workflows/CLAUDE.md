# .github/workflows/
> L2 | 父级: ../CLAUDE.md

成员清单
deploy.yml: GitHub Actions 生产发布工作流，push main 后构建 Astro 静态产物并用 Wrangler 发布到 Cloudflare Worker `yeshu-dev`。

法则: main 即生产输入·dist 只在 CI 生成·Cloudflare token 只进 GitHub Secret

[PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
