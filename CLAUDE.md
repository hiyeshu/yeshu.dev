# yeshu.dev - 极简个人主页
Vite + React + motion + CSS

<directory>
src/ - React 源码层 (1子目录: components)
</directory>

<config>
index.html - Vite HTML 壳，提供 root 挂载点
package.json - npm 依赖与脚本，声明 React、motion、Vite
package-lock.json - npm 锁文件，固定依赖解析结果
vite.config.js - Vite React 插件配置
.gitignore - 忽略依赖、构建产物和系统文件
CLAUDE.md - L1 项目宪法，记录当前架构地图
</config>

法则: 极简·稳定·导航·版本精确

## 变更日志
- 2026-05-13: 固定浅色底和纯黑标识，移除系统暗色模式下的反色分支。
- 2026-05-13: 主页标识改为全大写 YESHU.DEV，标题与动效字体权重提升至 900。
- 2026-05-13: 主页字体从衬线体切换为 Helvetica 系列，标题与动效共享同一字体变量。
- 2026-05-13: npm install 生成 package-lock.json，锁定 motion 与 React 构建依赖。
- 2026-05-13: 升级为 Vite React 应用，接入 React Bits ScrollVelocity 与 motion。
- 2026-05-13: 播种静态主页，建立 L1/L3 文档同构。
