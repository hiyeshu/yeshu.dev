/**
 * [INPUT]: 依赖 astro:content 的 defineCollection、z
 * [OUTPUT]: 对外提供 pages 内容集合 schema，包含 GEO 元数据、身份数据和项目视觉源 visual 契约
 * [POS]: src 的内容契约层，让 Markdown frontmatter 成为可校验的数据源、图版视觉索引和机器可读身份源
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const linkSchema = z.object({
  label: z.string(),
  href: z.string().url()
});

const visualSchema = z.object({
  type: z.enum(['image', 'text']),
  value: z.string(),
  label: z.string().optional()
});

const identitySchema = z.object({
  name: z.string(),
  alternateNames: z.array(z.string()).default([]),
  description: z.string(),
  sameAs: z.array(z.string().url()).default([]),
  knowsAbout: z.array(z.string()).default([])
});

const projectSchema = z.object({
  id: z.string(),
  figure: z.string(),
  name: z.string(),
  kind: z.string(),
  href: z.string().url(),
  source: z.string().url().optional(),
  visual: visualSchema,
  status: z.string(),
  description: z.string(),
  signal: z.string(),
  metrics: z.array(z.object({
    label: z.string(),
    value: z.string()
  })).default([])
});

const pages = defineCollection({
  loader: glob({
    base: './src/content/pages',
    pattern: ['**/*.{md,mdx}', '!**/CLAUDE.md']
  }),
  schema: z.object({
    title: z.string(),
    siteUrl: z.string().url(),
    canonicalPath: z.string(),
    masthead: z.string(),
    browserTitle: z.string(),
    description: z.string(),
    keywords: z.array(z.string()).default([]),
    dateModified: z.string(),
    identity: identitySchema,
    eyebrow: z.string(),
    volume: z.string(),
    dateLabel: z.string(),
    doi: z.string(),
    abstractTitle: z.string(),
    links: z.array(linkSchema),
    controls: z.array(z.object({
      label: z.string(),
      value: z.string()
    })),
    projects: z.array(projectSchema)
  })
});

export const collections = { pages };
