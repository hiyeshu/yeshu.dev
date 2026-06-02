/**
 * [INPUT]: 依赖 DecryptedText 的 load 动效，依赖 react 的挂载后退场状态和 sessionStorage 会话标记
 * [OUTPUT]: 对外提供 LoadingIntro React island，首个站点加载渲染居中载入文字，后续站内导航不再阻挡阅读
 * [POS]: components 的通用首次进入反馈原语，被布局按页面语义配置文本
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { useEffect, useState } from 'react';
import DecryptedText from './DecryptedText.jsx';

const DEFAULT_CHARACTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789笔记模型判断';
const EXIT_DURATION = 420;
const STORAGE_KEY = 'yeshu.loading-intro.seen';

export default function LoadingIntro({
  text = 'YESHU LOADING.....',
  duration = 1700,
  speed = 34,
  startDelay = 90,
  maxIterations = 10,
  revealDirection = 'start',
  characters = DEFAULT_CHARACTERS,
  className = '',
  copyClassName = '',
  encryptedClassName = 'decrypting-glyph'
}) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    if (window.sessionStorage.getItem(STORAGE_KEY) === '1') {
      setVisible(false);
      return undefined;
    }

    window.sessionStorage.setItem(STORAGE_KEY, '1');

    const timer = window.setTimeout(() => setVisible(false), duration);
    return () => window.clearTimeout(timer);
  }, [duration]);

  if (!visible) return null;

  const exitDelay = Math.max(duration - EXIT_DURATION, 0);
  const rootClassName = ['loading-intro', className].filter(Boolean).join(' ');
  const contentClassName = ['loading-intro-copy', copyClassName].filter(Boolean).join(' ');

  return (
    <aside
      className={rootClassName}
      style={{ '--loading-intro-exit-delay': `${exitDelay}ms` }}
      aria-hidden="true"
    >
      <div className={contentClassName}>
        <DecryptedText
          text={text}
          animateOn="load"
          sequential
          speed={speed}
          maxIterations={maxIterations}
          startDelay={startDelay}
          revealDirection={revealDirection}
          characters={characters}
          encryptedClassName={encryptedClassName}
        />
      </div>
    </aside>
  );
}
