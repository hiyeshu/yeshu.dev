# components/
> L2 | 父级: ../CLAUDE.md

成员清单
ASCIIIcon.jsx: React + Three 图标视觉引擎，接收 imageSrc/text 并输出悬停才运动的 ASCII 图标场。
DecryptedText.jsx: React + framer-motion 文字扰动原语，接收 text 与触发参数并输出可访问的解密文字动效。
FieldFigure.astro: Astro 项目图版组件，接收 Markdown frontmatter 中的 project 数据和 visual 源并渲染少噪音 ASCII figure 卡片。
LoadingIntro.jsx: React 首次进入载入封面，居中显示 YESHU LOADING..... 并叠加 Scrambl 风格固定单元块字符 reveal；本会话首个页面显示，后续站内导航不再显示。
SensoryLayer.jsx: React 无 UI 感官层，使用 Web Audio API 合成 soft 交互音效并统一 main surface 可拖动 overlay 滚动条。

法则: 成员完整·一行一文件·父级链接·技术词前置

[PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
