/**
 * [INPUT]: 依赖 react 的挂载后退场状态和 sessionStorage 会话标记
 * [OUTPUT]: 对外提供 LoadingIntro React island，用 Scrambl 风格块字符扫场展示 YESHU LOADING.....
 * [POS]: components 的通用首次进入反馈原语，内置固定字宽文字 reveal，后续站内导航不再显示
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { useEffect, useMemo, useState } from 'react';

const SCRAMBLE_CHARACTERS = '█▓▒░';
const CURSOR_CHARACTERS = '░▒▓█';
const EXIT_DURATION = 420;
const STORAGE_KEY = 'yeshu.loading-intro.seen';

function getCharacterList(value) {
  return Array.from(value);
}

function prefersReducedMotion() {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function computeOrder(length, from) {
  const order = Array.from({ length }, (_, index) => index);

  if (from === 'right') return order.reverse();
  if (from === 'center') {
    const middle = (length - 1) / 2;
    return order.sort((a, b) => Math.abs(a - middle) - Math.abs(b - middle));
  }
  if (from === 'random') {
    for (let index = order.length - 1; index > 0; index -= 1) {
      const target = Math.floor(Math.random() * (index + 1));
      [order[index], order[target]] = [order[target], order[index]];
    }
  }

  return order;
}

function ScrambleLine({
  text,
  from = 'left',
  delay = 0,
  duration = 900,
  className = ''
}) {
  const finalCells = useMemo(() => getCharacterList(text), [text]);
  const [cells, setCells] = useState(finalCells);
  const [revealed, setRevealed] = useState(() => new Set(Array.from({ length: finalCells.length }, (_, index) => index)));

  useEffect(() => {
    const length = finalCells.length;
    if (prefersReducedMotion() || length === 0) {
      setCells(finalCells);
      setRevealed(new Set(Array.from({ length }, (_, index) => index)));
      return undefined;
    }

    const order = computeOrder(length, from);
    const positionByIndex = new Map(order.map((cellIndex, orderIndex) => [cellIndex, orderIndex]));
    const scrambleChars = getCharacterList(SCRAMBLE_CHARACTERS);
    const cursorChars = getCharacterList(CURSOR_CHARACTERS);
    const emptySet = new Set();
    let frameId;
    let startedAt = 0;

    setRevealed(emptySet);
    setCells(finalCells.map((cell) => (cell === ' ' ? ' ' : SCRAMBLE_CHARACTERS[0])));

    function renderFrame(now) {
      if (!startedAt) startedAt = now;
      const progress = Math.min((now - startedAt) / duration, 1);
      const count = Math.floor(progress * (length + 1));
      const nextRevealed = new Set(order.slice(0, count));
      const cursorEnd = Math.min(count + cursorChars.length, length);

      setRevealed(nextRevealed);
      setCells(finalCells.map((cell, index) => {
        if (cell === ' ') return ' ';
        if (nextRevealed.has(index)) return cell;

        const orderIndex = positionByIndex.get(index);
        if (orderIndex >= count && orderIndex < cursorEnd) {
          return cursorChars[(orderIndex - count) % cursorChars.length];
        }

        return scrambleChars[Math.floor(Math.random() * scrambleChars.length)];
      }));

      if (progress < 1) {
        frameId = window.requestAnimationFrame(renderFrame);
        return;
      }

      setCells(finalCells);
      setRevealed(new Set(Array.from({ length }, (_, index) => index)));
    }

    const timer = window.setTimeout(() => {
      frameId = window.requestAnimationFrame(renderFrame);
    }, delay);

    return () => {
      window.clearTimeout(timer);
      if (frameId) window.cancelAnimationFrame(frameId);
    };
  }, [delay, duration, finalCells, from]);

  return (
    <span className={['loading-scramble-line', className].filter(Boolean).join(' ')} aria-label={text}>
      {cells.map((cell, index) => (
        <span
          className={[
            'loading-scramble-cell',
            revealed.has(index) ? 'is-revealed' : 'is-scrambled'
          ].join(' ')}
          key={`${text}-${index}`}
          aria-hidden="true"
        >
          {cell === ' ' ? '\u00A0' : cell}
        </span>
      ))}
    </span>
  );
}

export default function LoadingIntro({
  text = 'YESHU LOADING.....',
  duration = 1850,
  className = '',
  copyClassName = ''
}) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    try {
      if (window.sessionStorage.getItem(STORAGE_KEY) === '1') {
        setVisible(false);
        return undefined;
      }

      window.sessionStorage.setItem(STORAGE_KEY, '1');
    } catch {
      // sessionStorage 失效时仍显示一次，不阻塞页面。
    }

    const timer = window.setTimeout(() => setVisible(false), duration);
    return () => window.clearTimeout(timer);
  }, [duration]);

  if (!visible) return null;

  const exitDelay = Math.max(duration - EXIT_DURATION, 0);
  const rootClassName = ['loading-intro', className].filter(Boolean).join(' ');
  const contentClassName = ['loading-intro-copy', copyClassName].filter(Boolean).join(' ');

  return (
    <aside className={rootClassName} style={{ '--loading-intro-exit-delay': `${exitDelay}ms` }} aria-hidden="true">
      <div className={contentClassName}>
        <ScrambleLine text={text} duration={1080} from="left" />
      </div>
    </aside>
  );
}
