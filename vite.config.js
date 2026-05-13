/**
 * [INPUT]: 依赖 @vitejs/plugin-react 提供 React JSX 转译和开发体验
 * [OUTPUT]: 对外提供 Vite 构建配置
 * [POS]: 项目构建入口，让源码目录保持纯净
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react()]
});
