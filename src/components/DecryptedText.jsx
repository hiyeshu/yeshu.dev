/**
 * [INPUT]: 依赖 react 的状态/副作用能力，依赖 framer-motion 的 motion.span
 * [OUTPUT]: 对外提供 DecryptedText React 组件，用字符扰动在 load/view/hover/click 时揭示文本
 * [POS]: components 的文字动效原语，被 LoadingIntro 等展示组件消费，不持有页面语义
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';

const srOnlyStyle = {
  position: 'absolute',
  width: '1px',
  height: '1px',
  padding: 0,
  margin: '-1px',
  overflow: 'hidden',
  clip: 'rect(0, 0, 0, 0)',
  border: 0
};

function prefersReducedMotion() {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export default function DecryptedText({
  text,
  speed = 42,
  maxIterations = 10,
  sequential = false,
  revealDirection = 'start',
  useOriginalCharsOnly = false,
  characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+',
  className = '',
  parentClassName = '',
  encryptedClassName = '',
  animateOn = 'hover',
  clickMode = 'once',
  startDelay = 0,
  ...props
}) {
  const [displayText, setDisplayText] = useState(text);
  const [isAnimating, setIsAnimating] = useState(false);
  const [revealedIndices, setRevealedIndices] = useState(new Set());
  const [hasAnimated, setHasAnimated] = useState(false);
  const [isDecrypted, setIsDecrypted] = useState(animateOn !== 'click');
  const [direction, setDirection] = useState('forward');

  const containerRef = useRef(null);
  const orderRef = useRef([]);
  const pointerRef = useRef(0);
  const intervalRef = useRef();

  const availableChars = useMemo(() => {
    if (useOriginalCharsOnly) {
      return Array.from(new Set(text.split(''))).filter((char) => char !== ' ');
    }
    return characters.split('');
  }, [characters, text, useOriginalCharsOnly]);

  const shuffleText = useCallback((originalText, currentRevealed) => originalText
    .split('')
    .map((char, index) => {
      if (char === ' ') return ' ';
      if (currentRevealed.has(index)) return originalText[index];
      return availableChars[Math.floor(Math.random() * availableChars.length)] ?? char;
    })
    .join(''), [availableChars]);

  const computeOrder = useCallback((length) => {
    if (revealDirection === 'end') {
      return Array.from({ length }, (_, index) => length - index - 1);
    }
    if (revealDirection === 'center') {
      const middle = Math.floor(length / 2);
      return Array.from({ length }, (_, index) => {
        const offset = Math.ceil(index / 2);
        return index % 2 === 0 ? middle + offset : middle - offset;
      }).filter((index) => index >= 0 && index < length);
    }
    return Array.from({ length }, (_, index) => index);
  }, [revealDirection]);

  const triggerDecrypt = useCallback(() => {
    if (prefersReducedMotion()) {
      setDisplayText(text);
      setIsDecrypted(true);
      return;
    }

    const emptySet = new Set();
    orderRef.current = computeOrder(text.length);
    pointerRef.current = 0;
    setRevealedIndices(emptySet);
    setDisplayText(shuffleText(text, emptySet));
    setDirection('forward');
    setIsAnimating(true);
  }, [computeOrder, shuffleText, text]);

  const triggerReverse = useCallback(() => {
    const fullSet = new Set(Array.from({ length: text.length }, (_, index) => index));
    orderRef.current = computeOrder(text.length).slice().reverse();
    pointerRef.current = 0;
    setRevealedIndices(fullSet);
    setDisplayText(shuffleText(text, fullSet));
    setDirection('reverse');
    setIsAnimating(true);
  }, [computeOrder, shuffleText, text]);

  useEffect(() => {
    if (animateOn !== 'load') return undefined;
    const timer = window.setTimeout(triggerDecrypt, startDelay);
    return () => window.clearTimeout(timer);
  }, [animateOn, startDelay, triggerDecrypt]);

  useEffect(() => {
    if (animateOn !== 'view' && animateOn !== 'inViewHover') return undefined;
    const current = containerRef.current;
    if (!current) return undefined;

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting && !hasAnimated) {
          triggerDecrypt();
          setHasAnimated(true);
        }
      });
    }, { threshold: 0.1 });

    observer.observe(current);
    return () => observer.unobserve(current);
  }, [animateOn, hasAnimated, triggerDecrypt]);

  useEffect(() => {
    if (!isAnimating) return undefined;

    let iteration = 0;
    intervalRef.current = window.setInterval(() => {
      setRevealedIndices((previous) => {
        if (direction === 'reverse') {
          const next = new Set(previous);
          const index = sequential ? orderRef.current[pointerRef.current] : undefined;
          if (sequential && index !== undefined) {
            next.delete(index);
            pointerRef.current += 1;
          }
          setDisplayText(shuffleText(text, next));
          iteration += 1;
          if (next.size === 0 || iteration >= maxIterations) {
            window.clearInterval(intervalRef.current);
            setIsAnimating(false);
            setIsDecrypted(false);
          }
          return next;
        }

        if (sequential) {
          const next = new Set(previous);
          const index = orderRef.current[pointerRef.current];
          if (index !== undefined) {
            next.add(index);
            pointerRef.current += 1;
          }
          setDisplayText(shuffleText(text, next));
          if (next.size >= text.length) {
            window.clearInterval(intervalRef.current);
            setIsAnimating(false);
            setIsDecrypted(true);
            setDisplayText(text);
          }
          return next;
        }

        iteration += 1;
        setDisplayText(shuffleText(text, previous));
        if (iteration >= maxIterations) {
          window.clearInterval(intervalRef.current);
          setIsAnimating(false);
          setIsDecrypted(true);
          setDisplayText(text);
        }
        return previous;
      });
    }, speed);

    return () => window.clearInterval(intervalRef.current);
  }, [direction, isAnimating, maxIterations, sequential, shuffleText, speed, text]);

  const animateProps = {};
  if (animateOn === 'hover' || animateOn === 'inViewHover') {
    animateProps.onMouseEnter = triggerDecrypt;
    animateProps.onMouseLeave = () => {
      window.clearInterval(intervalRef.current);
      setDisplayText(text);
      setIsAnimating(false);
      setIsDecrypted(true);
    };
  }
  if (animateOn === 'click') {
    animateProps.onClick = () => {
      if (clickMode === 'toggle' && isDecrypted) {
        triggerReverse();
        return;
      }
      if (clickMode === 'once' && isDecrypted) return;
      triggerDecrypt();
    };
  }

  return (
    <motion.span
      ref={containerRef}
      className={parentClassName}
      style={{ display: 'inline-block', whiteSpace: 'pre-wrap' }}
      {...animateProps}
      {...props}
    >
      <span style={srOnlyStyle}>{text}</span>
      <span aria-hidden="true">
        {displayText.split('').map((char, index) => {
          const revealed = revealedIndices.has(index) || (!isAnimating && isDecrypted);
          return (
            <span key={`${char}-${index}`} className={revealed ? className : encryptedClassName}>
              {char}
            </span>
          );
        })}
      </span>
    </motion.span>
  );
}
