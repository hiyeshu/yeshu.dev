/**
 * [INPUT]: 依赖 react 的 useEffect，依赖浏览器 Web Audio API、Pointer Events、链接/按钮交互事件和 main surface 滚动事件
 * [OUTPUT]: 对外提供无 UI 的 soft 交互音效与可拖动 overlay 滚动条，映射 hover/click/scroll 到轻量触感反馈
 * [POS]: components 的感官反馈层，被 JournalLayout 和 NoteLayout 挂载，统一 Field Journal Annex 的 soft-interactive 行为
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { useEffect } from 'react';

const MASTER_VOLUME = 0.16;
const HOVER_COOLDOWN_MS = 110;
const SCROLLBAR_IDLE_DELAY_MS = 720;
const SCROLL_SURFACE_SELECTOR = '.journal-main, .notes-main';

const soundMap = {
  forward: [329.63, 392],
  backward: [392, 329.63],
  open: [261.63, 329.63],
  close: [329.63, 261.63]
};

const softInstrument = {
  gain: 0.7,
  pitch: 0.8,
  decay: 1.5,
  q: 1
};

let audioContext;
let lastHoverTarget;
let lastHoverAt = 0;

function shouldSuppressAudio() {
  if (typeof window === 'undefined') return true;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return true;
  return window.localStorage.getItem('yeshu.sound') === 'off';
}

function getAudioContext() {
  if (!audioContext) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    audioContext = new AudioContextClass();
  }
  if (audioContext.state === 'suspended') {
    void audioContext.resume();
  }
  return audioContext;
}

function playTone(ctx, frequency, start, duration, volume) {
  const oscillator = ctx.createOscillator();
  const filter = ctx.createBiquadFilter();
  const gain = ctx.createGain();

  oscillator.type = 'sine';
  oscillator.frequency.setValueAtTime(frequency * 0.82, start);
  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(1100, start);
  filter.Q.setValueAtTime(0.5, start);

  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.linearRampToValueAtTime(volume, start + 0.018);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);

  oscillator.connect(filter);
  filter.connect(gain);
  gain.connect(ctx.destination);
  oscillator.start(start);
  oscillator.stop(start + duration + 0.03);
  oscillator.addEventListener('ended', () => {
    oscillator.disconnect();
    filter.disconnect();
    gain.disconnect();
  }, { once: true });
}

function playButtonClick(ctx, role) {
  const start = ctx.currentTime;
  const isSubtle = role === 'subtle';
  const tune = isSubtle
    ? { duration: 0.008, filterFreq: 3600, filterQ: 3.5, volume: 0.8, decayConstant: 25 }
    : { duration: 0.008, filterFreq: 3800, filterQ: 2.5, volume: 1, decayConstant: 35 };
  const duration = Math.max(0.004, tune.duration) * softInstrument.decay;
  const length = Math.max(1, Math.floor(ctx.sampleRate * duration));
  const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  const tauSeconds = (tune.decayConstant / ctx.sampleRate) * softInstrument.decay;

  for (let i = 0; i < length; i += 1) {
    const time = i / ctx.sampleRate;
    data[i] = (Math.random() * 2 - 1) * Math.exp(-time / tauSeconds);
  }

  const source = ctx.createBufferSource();
  const filter = ctx.createBiquadFilter();
  const gain = ctx.createGain();

  source.buffer = buffer;
  filter.type = 'bandpass';
  filter.frequency.value = tune.filterFreq * softInstrument.pitch;
  filter.Q.value = tune.filterQ * softInstrument.q;
  gain.gain.value = MASTER_VOLUME * tune.volume * softInstrument.gain;

  source.connect(filter);
  filter.connect(gain);
  gain.connect(ctx.destination);
  source.start(start);
  source.addEventListener('ended', () => {
    source.disconnect();
    filter.disconnect();
    gain.disconnect();
  }, { once: true });
}

function playSound(role) {
  if (shouldSuppressAudio()) return;
  const ctx = getAudioContext();
  if (role === 'tap' || role === 'subtle') {
    playButtonClick(ctx, role);
    return;
  }

  const notes = soundMap[role] ?? soundMap.forward;
  const now = ctx.currentTime;

  notes.forEach((frequency, index) => {
    const start = now + index * 0.055;
    const duration = role === 'subtle' ? 0.075 : 0.105;
    const volume = MASTER_VOLUME * (role === 'subtle' ? 0.48 : 1);
    playTone(ctx, frequency, start, duration, volume);
  });
}

export default function SensoryLayer() {
  useEffect(() => {
    const scrollbars = [...document.querySelectorAll(SCROLL_SURFACE_SELECTOR)].map((surface) => {
      const wrapper = surface.closest('.journal-wrapper');
      if (!wrapper) return undefined;

      const scrollbar = document.createElement('div');
      const thumb = document.createElement('div');
      let idleTimer;
      let isDragging = false;
      let dragStartY = 0;
      let dragStartScrollTop = 0;
      let lastMetrics = {
        scrollableHeight: 0,
        thumbTravel: 0
      };

      scrollbar.className = 'surface-scrollbar';
      thumb.className = 'surface-scrollbar-thumb';
      scrollbar.appendChild(thumb);
      wrapper.appendChild(scrollbar);

      function syncScrollbar() {
        const wrapperRect = wrapper.getBoundingClientRect();
        const surfaceRect = surface.getBoundingClientRect();
        const scrollableHeight = surface.scrollHeight - surface.clientHeight;
        const trackHeight = surface.clientHeight;

        scrollbar.style.top = `${surfaceRect.top - wrapperRect.top}px`;
        scrollbar.style.right = `${wrapperRect.right - surfaceRect.right}px`;
        scrollbar.style.height = `${trackHeight}px`;

        if (scrollableHeight <= 0) {
          scrollbar.hidden = true;
          return;
        }

        const thumbHeight = Math.max(28, Math.round((surface.clientHeight / surface.scrollHeight) * trackHeight));
        const thumbTravel = Math.max(0, trackHeight - thumbHeight);
        const thumbTop = Math.round((surface.scrollTop / scrollableHeight) * thumbTravel);

        lastMetrics = { scrollableHeight, thumbTravel };
        scrollbar.hidden = false;
        thumb.style.height = `${thumbHeight}px`;
        thumb.style.transform = `translateY(${thumbTop}px)`;
      }

      function showScrollbar() {
        syncScrollbar();
        scrollbar.classList.add('surface-is-scrolling');
        window.clearTimeout(idleTimer);
        if (isDragging) return;
        idleTimer = window.setTimeout(() => {
          scrollbar.classList.remove('surface-is-scrolling');
        }, SCROLLBAR_IDLE_DELAY_MS);
      }

      function keepScrollbarVisible() {
        syncScrollbar();
        scrollbar.classList.add('surface-is-scrolling');
        window.clearTimeout(idleTimer);
      }

      function onScrollbarPointerEnter() {
        keepScrollbarVisible();
      }

      function onScrollbarPointerLeave() {
        if (isDragging) return;
        idleTimer = window.setTimeout(() => {
          scrollbar.classList.remove('surface-is-scrolling');
        }, SCROLLBAR_IDLE_DELAY_MS);
      }

      function onThumbPointerDown(event) {
        if (event.button !== 0) return;
        event.preventDefault();
        isDragging = true;
        dragStartY = event.clientY;
        dragStartScrollTop = surface.scrollTop;
        thumb.setPointerCapture(event.pointerId);
        scrollbar.classList.add('surface-is-dragging');
        keepScrollbarVisible();
        playSound('subtle');
      }

      function onThumbPointerMove(event) {
        if (!isDragging || lastMetrics.thumbTravel <= 0) return;
        event.preventDefault();
        const deltaY = event.clientY - dragStartY;
        const scrollDelta = (deltaY / lastMetrics.thumbTravel) * lastMetrics.scrollableHeight;
        surface.scrollTop = dragStartScrollTop + scrollDelta;
        syncScrollbar();
      }

      function endThumbDrag(event) {
        if (!isDragging) return;
        isDragging = false;
        if (thumb.hasPointerCapture(event.pointerId)) {
          thumb.releasePointerCapture(event.pointerId);
        }
        scrollbar.classList.remove('surface-is-dragging');
        onScrollbarPointerLeave();
      }

      surface.addEventListener('scroll', showScrollbar, { passive: true });
      window.addEventListener('resize', syncScrollbar);
      scrollbar.addEventListener('pointerenter', onScrollbarPointerEnter);
      scrollbar.addEventListener('pointerleave', onScrollbarPointerLeave);
      thumb.addEventListener('pointerdown', onThumbPointerDown);
      thumb.addEventListener('pointermove', onThumbPointerMove);
      thumb.addEventListener('pointerup', endThumbDrag);
      thumb.addEventListener('pointercancel', endThumbDrag);
      syncScrollbar();

      return {
        cleanup() {
          window.clearTimeout(idleTimer);
          surface.removeEventListener('scroll', showScrollbar);
          window.removeEventListener('resize', syncScrollbar);
          scrollbar.removeEventListener('pointerenter', onScrollbarPointerEnter);
          scrollbar.removeEventListener('pointerleave', onScrollbarPointerLeave);
          thumb.removeEventListener('pointerdown', onThumbPointerDown);
          thumb.removeEventListener('pointermove', onThumbPointerMove);
          thumb.removeEventListener('pointerup', endThumbDrag);
          thumb.removeEventListener('pointercancel', endThumbDrag);
          scrollbar.remove();
        }
      };
    });

    function onPointerOver(event) {
      const target = event.target.closest('a, button, [role="button"]');
      if (!target || target === lastHoverTarget) return;

      const now = window.performance.now();
      if (now - lastHoverAt < HOVER_COOLDOWN_MS) return;

      lastHoverTarget = target;
      lastHoverAt = now;
      playSound('subtle');
    }

    function onFocusIn(event) {
      const target = event.target.closest('a, button, [role="button"]');
      if (!target) return;
      playSound('subtle');
    }

    function onPointerOut(event) {
      if (event.target === lastHoverTarget) {
        lastHoverTarget = undefined;
      }
    }

    function onClick(event) {
      const target = event.target.closest('a, button, [role="button"]');
      if (!target) return;
      playSound('tap');
    }

    document.addEventListener('pointerover', onPointerOver);
    document.addEventListener('pointerout', onPointerOut);
    document.addEventListener('focusin', onFocusIn);
    document.addEventListener('click', onClick);

    return () => {
      document.removeEventListener('pointerover', onPointerOver);
      document.removeEventListener('pointerout', onPointerOut);
      document.removeEventListener('focusin', onFocusIn);
      document.removeEventListener('click', onClick);
      scrollbars.forEach((scrollbar) => scrollbar?.cleanup());
    };
  }, []);

  return null;
}
