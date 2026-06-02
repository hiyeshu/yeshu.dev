/**
 * [INPUT]: 依赖 astro/config 的 defineConfig，依赖 @astrojs/react 提供 React island，依赖 @tailwindcss/vite 编译 Tailwind v4
 * [OUTPUT]: 对外提供 Astro 构建配置、React 集成、Tailwind 插件链和 @/src 路径别名
 * [POS]: 项目构建入口，负责 Markdown 内容管线与少量交互岛装配
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';
import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'astro/config';

import cloudflare from '@astrojs/cloudflare';

export default defineConfig({
  integrations: [react()],

  vite: {
    plugins: [tailwindcss()],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url))
      }
    }
  },

  adapter: cloudflare()
});