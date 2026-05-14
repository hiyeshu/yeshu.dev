/**
 * [INPUT]: 依赖 clsx 合并条件 class，依赖 tailwind-merge 消解 Tailwind 冲突
 * [OUTPUT]: 对外提供 cn 工具函数
 * [POS]: src/lib 的样式工具，被 shadcn 组件和本地组件复用
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}
