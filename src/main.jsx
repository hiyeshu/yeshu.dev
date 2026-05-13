/**
 * [INPUT]: 依赖 react-dom/client 的挂载能力，依赖 App 的页面组件
 * [OUTPUT]: 对外提供浏览器端 React 应用启动流程
 * [POS]: src 的运行入口，把根组件接到 index.html 的 root 节点
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import './styles.css';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>
);
