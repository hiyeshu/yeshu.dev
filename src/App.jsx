/**
 * [INPUT]: 依赖 ScrollVelocity 的滚动速度文字动效，依赖 styles.css 的主页布局
 * [OUTPUT]: 对外提供 App 根组件
 * [POS]: src 的页面编排层，保持主页只表达 yeshu.dev 一个核心信号
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import ScrollVelocity from './components/ScrollVelocity.jsx';

const velocityText = ['YESHU.DEV', 'YESHU.DEV'];

export default function App() {
  return (
    <main className="home" aria-label="yeshu.dev home">
      <div className="velocity-stage" aria-hidden="true">
        <ScrollVelocity
          texts={velocityText}
          velocity={36}
          className="velocity-copy"
          damping={42}
          stiffness={360}
          numCopies={8}
          parallaxClassName="home-parallax"
          scrollerClassName="home-scroller"
        />
      </div>
      <h1>YESHU.DEV</h1>
    </main>
  );
}
