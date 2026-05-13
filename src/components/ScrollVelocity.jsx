/**
 * [INPUT]: 依赖 motion/react 的滚动、弹簧、变换和逐帧动画能力
 * [OUTPUT]: 对外提供 ScrollVelocity 组件
 * [POS]: components 的 React Bits 动效组件，被 App.jsx 用作主页背景文字流
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { useLayoutEffect, useRef, useState } from 'react';
import {
  motion,
  useAnimationFrame,
  useMotionValue,
  useScroll,
  useSpring,
  useTransform,
  useVelocity
} from 'motion/react';
import './ScrollVelocity.css';

function useElementWidth(ref) {
  const [width, setWidth] = useState(0);

  useLayoutEffect(() => {
    function updateWidth() {
      if (ref.current) {
        setWidth(ref.current.offsetWidth);
      }
    }

    updateWidth();
    window.addEventListener('resize', updateWidth);
    return () => window.removeEventListener('resize', updateWidth);
  }, [ref]);

  return width;
}

function wrap(min, max, value) {
  const range = max - min;
  const mod = (((value - min) % range) + range) % range;
  return mod + min;
}

function VelocityText({
  children,
  baseVelocity,
  scrollContainerRef,
  className,
  damping,
  stiffness,
  numCopies,
  velocityMapping,
  parallaxClassName,
  scrollerClassName,
  parallaxStyle,
  scrollerStyle
}) {
  const baseX = useMotionValue(0);
  const directionFactor = useRef(1);
  const copyRef = useRef(null);
  const copyWidth = useElementWidth(copyRef);
  const scrollOptions = scrollContainerRef ? { container: scrollContainerRef } : {};
  const { scrollY } = useScroll(scrollOptions);
  const scrollVelocity = useVelocity(scrollY);
  const smoothVelocity = useSpring(scrollVelocity, { damping, stiffness });
  const velocityFactor = useTransform(
    smoothVelocity,
    velocityMapping.input,
    velocityMapping.output,
    { clamp: false }
  );
  const x = useTransform(baseX, value => {
    if (copyWidth === 0) {
      return '0px';
    }

    return `${wrap(-copyWidth, 0, value)}px`;
  });

  useAnimationFrame((time, delta) => {
    let moveBy = directionFactor.current * baseVelocity * (delta / 1000);
    const factor = velocityFactor.get();

    if (factor < 0) {
      directionFactor.current = -1;
    } else if (factor > 0) {
      directionFactor.current = 1;
    }

    moveBy += directionFactor.current * moveBy * factor;
    baseX.set(baseX.get() + moveBy);
  });

  return (
    <div className={parallaxClassName} style={parallaxStyle}>
      <motion.div className={scrollerClassName} style={{ x, ...scrollerStyle }}>
        {Array.from({ length: numCopies }, (_, index) => (
          <span className={className} key={index} ref={index === 0 ? copyRef : null}>
            {children}&nbsp;
          </span>
        ))}
      </motion.div>
    </div>
  );
}

export default function ScrollVelocity({
  scrollContainerRef,
  texts = [],
  velocity = 100,
  className = '',
  damping = 50,
  stiffness = 400,
  numCopies = 6,
  velocityMapping = { input: [0, 1000], output: [0, 5] },
  parallaxClassName = 'parallax',
  scrollerClassName = 'scroller',
  parallaxStyle,
  scrollerStyle
}) {
  return (
    <section>
      {texts.map((text, index) => (
        <VelocityText
          key={index}
          className={className}
          baseVelocity={index % 2 === 0 ? velocity : -velocity}
          scrollContainerRef={scrollContainerRef}
          damping={damping}
          stiffness={stiffness}
          numCopies={numCopies}
          velocityMapping={velocityMapping}
          parallaxClassName={parallaxClassName}
          scrollerClassName={scrollerClassName}
          parallaxStyle={parallaxStyle}
          scrollerStyle={scrollerStyle}
        >
          {text}
        </VelocityText>
      ))}
    </section>
  );
}
