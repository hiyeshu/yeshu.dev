/**
 * [INPUT]: 依赖 three 的 WebGLRenderer/CanvasTexture，依赖 imageSrc 或 text 作为图标源
 * [OUTPUT]: 对外提供 ASCIIIcon React island，把项目图标渲染成悬停才运动的 ASCII 场
 * [POS]: components 的图版视觉引擎，被 FieldFigure 消费，替代静态点阵 logo 层
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { useEffect, useRef } from 'react';
import * as THREE from 'three';

const vertexShader = `
varying vec2 vUv;
uniform float uTime;
uniform float uEnableWaves;

void main() {
  vUv = uv;

  vec3 transformed = position;
  float wave = uEnableWaves;
  float time = uTime * 4.0;

  transformed.x += sin(time + position.y * 1.25) * 0.22 * wave;
  transformed.y += cos(time + position.x * 1.1) * 0.08 * wave;
  transformed.z += sin(time + position.x + position.y) * 0.42 * wave;

  gl_Position = projectionMatrix * modelViewMatrix * vec4(transformed, 1.0);
}
`;

const fragmentShader = `
varying vec2 vUv;
uniform float uTime;
uniform sampler2D uTexture;

void main() {
  vec2 pos = vUv;
  float shift = sin(uTime + pos.y * 4.0) * 0.004;

  float r = texture2D(uTexture, pos + vec2(shift, 0.0)).r;
  float g = texture2D(uTexture, pos).g;
  float b = texture2D(uTexture, pos - vec2(shift, 0.0)).b;
  float a = texture2D(uTexture, pos).a;

  gl_FragColor = vec4(r, g, b, a);
}
`;

function mapRange(value, inputMin, inputMax, outputMin, outputMax) {
  return ((value - inputMin) / (inputMax - inputMin)) * (outputMax - outputMin) + outputMin;
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.decoding = 'async';
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = src;
  });
}

class AsciiFilter {
  constructor(renderer, { fontSize = 8, fontFamily = 'ui-monospace, SFMono-Regular, Menlo, monospace' } = {}) {
    this.renderer = renderer;
    this.fontSize = fontSize;
    this.fontFamily = fontFamily;
    this.charset = ' .,:;i1tfLCG08@';

    this.domElement = document.createElement('div');
    this.domElement.className = 'ascii-icon-filter';

    this.pre = document.createElement('pre');
    this.pre.setAttribute('aria-hidden', 'true');
    this.domElement.appendChild(this.pre);

    this.canvas = document.createElement('canvas');
    this.canvas.setAttribute('aria-hidden', 'true');
    this.context = this.canvas.getContext('2d', { willReadFrequently: true });

    this.context.imageSmoothingEnabled = false;
  }

  setSize(width, height) {
    this.width = Math.max(1, width);
    this.height = Math.max(1, height);
    this.renderer.setSize(this.width, this.height, false);
    this.reset();
  }

  reset() {
    this.context.font = `${this.fontSize}px ${this.fontFamily}`;
    const charWidth = Math.max(1, this.context.measureText('M').width);

    this.cols = Math.max(1, Math.floor(this.width / charWidth));
    this.rows = Math.max(1, Math.floor(this.height / this.fontSize));

    this.canvas.width = this.cols;
    this.canvas.height = this.rows;
    this.pre.style.fontFamily = this.fontFamily;
    this.pre.style.fontSize = `${this.fontSize}px`;
  }

  render(scene, camera) {
    this.renderer.render(scene, camera);

    const width = this.canvas.width;
    const height = this.canvas.height;
    this.context.clearRect(0, 0, width, height);
    this.context.drawImage(this.renderer.domElement, 0, 0, width, height);
    this.pre.textContent = this.asciify(this.context.getImageData(0, 0, width, height).data, width, height);
  }

  asciify(data, width, height) {
    let output = '';

    for (let y = 0; y < height; y += 1) {
      for (let x = 0; x < width; x += 1) {
        const index = x * 4 + y * 4 * width;
        const alpha = data[index + 3];

        if (alpha < 8) {
          output += ' ';
          continue;
        }

        const red = data[index];
        const green = data[index + 1];
        const blue = data[index + 2];
        const gray = (0.3 * red + 0.59 * green + 0.11 * blue) / 255;
        const charIndex = Math.round((1 - gray) * (this.charset.length - 1));
        output += this.charset[charIndex];
      }
      output += '\n';
    }

    return output;
  }

  dispose() {
    this.pre.textContent = '';
  }
}

class IconCanvas {
  constructor({ imageSrc, text, color = '#000000', fontSize = 430 }) {
    this.imageSrc = imageSrc;
    this.text = text;
    this.color = color;
    this.fontSize = fontSize;
    this.canvas = document.createElement('canvas');
    this.context = this.canvas.getContext('2d');
  }

  async init() {
    this.image = this.imageSrc ? await loadImage(this.imageSrc) : null;
    this.resize();
    this.render();
  }

  resize() {
    this.canvas.width = 720;
    this.canvas.height = 720;
  }

  render() {
    const ctx = this.context;
    const size = this.canvas.width;
    const padding = this.image ? size * 0.1 : size * 0.05;

    ctx.clearRect(0, 0, size, size);

    if (this.image) {
      const aspect = this.image.naturalWidth / this.image.naturalHeight || 1;
      const maxSide = size - padding * 2;
      const width = aspect >= 1 ? maxSide : maxSide * aspect;
      const height = aspect >= 1 ? maxSide / aspect : maxSide;
      const x = (size - width) / 2;
      const y = (size - height) / 2;

      ctx.drawImage(this.image, x, y, width, height);
      return;
    }

    ctx.fillStyle = this.color;
    ctx.font = `900 ${this.fontSize}px Inter, Arial, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    while (ctx.measureText(this.text).width > size * 0.78 && this.fontSize > 120) {
      this.fontSize -= 12;
      ctx.font = `900 ${this.fontSize}px Inter, Arial, sans-serif`;
    }
    ctx.fillText(this.text, size / 2, size / 2 + this.fontSize * 0.02);
  }

  get texture() {
    return this.canvas;
  }
}

class AsciiIconScene {
  constructor(options, container) {
    this.options = options;
    this.container = container;
    this.mouse = { x: 0.5, y: 0.5 };
    this.isRunning = false;
    this.animationFrameId = null;
    this.onPointerEnter = this.onPointerEnter.bind(this);
    this.onPointerLeave = this.onPointerLeave.bind(this);
    this.onPointerMove = this.onPointerMove.bind(this);
  }

  async init(width, height) {
    this.width = width;
    this.height = height;
    this.camera = new THREE.PerspectiveCamera(45, width / height, 1, 1000);
    this.camera.position.z = 16;
    this.scene = new THREE.Scene();

    this.iconCanvas = new IconCanvas(this.options);
    await this.iconCanvas.init();

    this.texture = new THREE.CanvasTexture(this.iconCanvas.texture);
    this.texture.minFilter = THREE.NearestFilter;
    this.texture.magFilter = THREE.NearestFilter;

    this.geometry = new THREE.PlaneGeometry(12.5, 12.5, 36, 36);
    this.material = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      transparent: true,
      uniforms: {
        uTime: { value: 0 },
        uTexture: { value: this.texture },
        uEnableWaves: { value: 0 }
      }
    });

    this.mesh = new THREE.Mesh(this.geometry, this.material);
    this.scene.add(this.mesh);

    this.renderer = new THREE.WebGLRenderer({ alpha: true, antialias: false });
    this.renderer.setPixelRatio(1);
    this.renderer.setClearColor(0xffffff, 0);

    this.filter = new AsciiFilter(this.renderer, {
      fontSize: this.options.asciiFontSize,
      fontFamily: this.options.fontFamily
    });
    this.container.appendChild(this.filter.domElement);
    this.setSize(width, height);

    this.container.addEventListener('pointerenter', this.onPointerEnter);
    this.container.addEventListener('pointerleave', this.onPointerLeave);
    this.container.addEventListener('pointermove', this.onPointerMove);
    this.renderStill();
  }

  setSize(width, height) {
    this.width = Math.max(1, width);
    this.height = Math.max(1, height);
    this.camera.aspect = this.width / this.height;
    this.camera.updateProjectionMatrix();
    this.filter.setSize(this.width, this.height);
    if (!this.isRunning) this.renderStill();
  }

  onPointerEnter() {
    this.start();
  }

  onPointerLeave() {
    this.stop();
  }

  onPointerMove(event) {
    const rect = this.container.getBoundingClientRect();
    this.mouse = {
      x: (event.clientX - rect.left) / rect.width,
      y: (event.clientY - rect.top) / rect.height
    };
  }

  start() {
    if (this.isRunning) return;
    this.isRunning = true;
    this.material.uniforms.uEnableWaves.value = this.options.enableWaves ? 1 : 0;
    this.animate();
  }

  stop() {
    if (this.animationFrameId) cancelAnimationFrame(this.animationFrameId);
    this.animationFrameId = null;
    this.isRunning = false;
    this.mouse = { x: 0.5, y: 0.5 };
    this.renderStill();
  }

  animate() {
    const frame = () => {
      if (!this.isRunning) return;
      this.animationFrameId = requestAnimationFrame(frame);
      this.renderActive();
    };

    frame();
  }

  renderStill() {
    if (!this.material || !this.mesh || !this.filter) return;
    this.material.uniforms.uTime.value = 0;
    this.material.uniforms.uEnableWaves.value = 0;
    this.mesh.rotation.x = 0;
    this.mesh.rotation.y = 0;
    this.filter.render(this.scene, this.camera);
  }

  renderActive() {
    const time = performance.now() * 0.001;
    this.material.uniforms.uTime.value = time;
    this.material.uniforms.uEnableWaves.value = this.options.enableWaves ? 1 : 0;

    const rotX = mapRange(this.mouse.y, 0, 1, 0.35, -0.35);
    const rotY = mapRange(this.mouse.x, 0, 1, -0.42, 0.42);
    this.mesh.rotation.x += (rotX - this.mesh.rotation.x) * 0.045;
    this.mesh.rotation.y += (rotY - this.mesh.rotation.y) * 0.045;

    this.filter.render(this.scene, this.camera);
  }

  dispose() {
    if (this.animationFrameId) cancelAnimationFrame(this.animationFrameId);
    this.container.removeEventListener('pointerenter', this.onPointerEnter);
    this.container.removeEventListener('pointerleave', this.onPointerLeave);
    this.container.removeEventListener('pointermove', this.onPointerMove);

    if (this.filter?.domElement?.parentNode) {
      this.container.removeChild(this.filter.domElement);
    }
    this.filter?.dispose();

    this.geometry?.dispose();
    this.material?.dispose();
    this.texture?.dispose();
    this.renderer?.dispose();
    this.renderer?.forceContextLoss();
  }
}

export default function ASCIIIcon({
  imageSrc,
  text = 'MAP',
  asciiFontSize = 8,
  enableWaves = true
}) {
  const containerRef = useRef(null);
  const sceneRef = useRef(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return undefined;

    let cancelled = false;
    let observer = null;
    let resizeObserver = null;

    const mount = async (width, height) => {
      const scene = new AsciiIconScene({
        imageSrc,
        text,
        asciiFontSize,
        enableWaves,
        fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace'
      }, container);

      await scene.init(width, height);

      if (cancelled) {
        scene.dispose();
        return;
      }

      sceneRef.current = scene;
      resizeObserver = new ResizeObserver(([entry]) => {
        if (!entry || !sceneRef.current) return;
        const { width: nextWidth, height: nextHeight } = entry.contentRect;
        sceneRef.current.setSize(nextWidth, nextHeight);
      });
      resizeObserver.observe(container);
    };

    const rect = container.getBoundingClientRect();
    if (rect.width > 0 && rect.height > 0) {
      mount(rect.width, rect.height);
    } else {
      observer = new IntersectionObserver(([entry]) => {
        if (!entry?.isIntersecting || cancelled) return;
        observer.disconnect();
        observer = null;
        mount(entry.boundingClientRect.width, entry.boundingClientRect.height);
      });
      observer.observe(container);
    }

    return () => {
      cancelled = true;
      observer?.disconnect();
      resizeObserver?.disconnect();
      sceneRef.current?.dispose();
      sceneRef.current = null;
    };
  }, [imageSrc, text, asciiFontSize, enableWaves]);

  return <div ref={containerRef} className="ascii-icon-surface" aria-hidden="true" />;
}
