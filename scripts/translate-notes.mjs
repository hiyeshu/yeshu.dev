/**
 * [INPUT]: 依赖 src/content/notes/*.md 中文 notes、Google Translate 公开端点和 i18n routeSlug frontmatter 字段
 * [OUTPUT]: 对外提供 src/content/notes/*-en.md 英文镜像、translation-sync-manifest.json、sitemap.xml、llms.txt 和 content/notes/CLAUDE.md
 * [POS]: scripts 的 notes i18n 生成器，把中文 Think 内容翻译为英文 Markdown 并维护机器入口
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import fs from 'node:fs';
import path from 'node:path';

const projectRoot = process.cwd();
const notesDir = path.join(projectRoot, 'src/content/notes');
const siteUrl = 'https://yeshu.dev';
const endpoint = 'https://translate.googleapis.com/translate_a/single';
const chunkLimit = 3600;

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function yamlString(value) {
  return JSON.stringify(String(value || '').replace(/\n/g, ' ').trim());
}

function yamlArray(values) {
  if (!values?.length) return '[]';
  return `\n${values.map((value) => `  - ${yamlString(value)}`).join('\n')}`;
}

function slugify(value, fallback) {
  const slug = String(value || '')
    .normalize('NFKD')
    .replace(/[^\p{L}\p{N}\s-]/gu, '')
    .trim()
    .toLowerCase()
    .replace(/[_\s]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');

  return slug || fallback;
}

function parseFrontmatter(text) {
  const match = text.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  if (!match) throw new Error('Missing frontmatter');

  const data = {};
  let currentKey = '';

  for (const line of match[1].split('\n')) {
    const pair = line.match(/^(\w+):\s*(.*)$/);
    if (pair) {
      const [, key, raw] = pair;
      currentKey = key;
      if (raw === '') {
        data[key] = [];
      } else {
        try {
          data[key] = JSON.parse(raw);
        } catch {
          data[key] = raw.replace(/^"|"$/g, '');
        }
      }
      continue;
    }

    const item = line.match(/^\s+-\s*(.*)$/);
    if (item && currentKey) {
      const raw = item[1];
      try {
        data[currentKey].push(JSON.parse(raw));
      } catch {
        data[currentKey].push(raw.replace(/^"|"$/g, ''));
      }
    }
  }

  return { data, body: match[2] };
}

function noteFiles() {
  return fs.readdirSync(notesDir)
    .filter((file) => file.endsWith('.md') && file !== 'CLAUDE.md')
    .sort();
}

function sourceSlugFromFile(file) {
  return file.replace(/\.md$/, '');
}

function splitText(text) {
  const parts = text.split(/(\n{2,})/);
  const chunks = [];
  let current = '';

  for (const part of parts) {
    if ((current + part).length > chunkLimit && current.trim()) {
      chunks.push(current);
      current = '';
    }
    current += part;
  }

  if (current) chunks.push(current);
  return chunks;
}

async function translateText(text) {
  if (!text.trim()) return text;

  const chunks = splitText(text);
  const translated = [];

  for (const chunk of chunks) {
    const url = new URL(endpoint);
    url.searchParams.set('client', 'gtx');
    url.searchParams.set('sl', 'zh-CN');
    url.searchParams.set('tl', 'en');
    url.searchParams.set('dt', 't');
    url.searchParams.set('q', chunk);

    let payload = null;
    let lastError = '';

    for (let attempt = 1; attempt <= 4; attempt += 1) {
      try {
        const response = await fetch(url);
        if (response.ok) {
          payload = await response.json();
          break;
        }
        lastError = `${response.status} ${await response.text()}`;
      } catch (error) {
        lastError = error.message;
      }
      await delay(350 * attempt);
    }

    if (!payload) throw new Error(`Translate failed: ${lastError}`);

    translated.push((payload[0] || []).map((segment) => segment?.[0] || '').join(''));
    await delay(120);
  }

  return translated.join('')
    .replace(/\]\s+\(/g, '](')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function readNotes() {
  return noteFiles().map((file) => {
    const text = fs.readFileSync(path.join(notesDir, file), 'utf8');
    const parsed = parseFrontmatter(text);
    return {
      file,
      slug: sourceSlugFromFile(file),
      ...parsed
    };
  });
}

function noteRoute(note) {
  const slug = note.data.routeSlug || note.slug.replace(/-en$/, '');
  return note.data.lang === 'en' ? `/en/notes/${slug}/` : `/notes/${slug}/`;
}

function noteOrigin(note) {
  if (note.data.generatedTranslation) return '机器翻译自中文源';
  if (note.data.notionUrl?.includes('app.notion.com/p/')) return '同步自 Notion 页面并本地整理';
  if (note.data.notionId) return '同步自 Notion Thinking 数据库';
  return '本地手写内容';
}

function writeIndexes(notes) {
  const publicNotes = notes
    .filter((note) => !note.data.draft && note.data.listed !== false)
    .sort((a, b) => String(b.data.pubDate).localeCompare(String(a.data.pubDate)) || noteRoute(a).localeCompare(noteRoute(b)));

  const claude = [
    '# content/notes/',
    '> L2 | 父级: ../CLAUDE.md',
    '',
    '成员清单',
    ...publicNotes.map((note) => `${note.file}: Think ${note.data.lang === 'en' ? '英文' : '中文'}文章，${noteOrigin(note)}，标题《${note.data.title}》。`),
    'notion-sync-manifest.json: Notion Thinking 同步清单，记录最近一次同步时间、数量和生成 slug。',
    'translation-sync-manifest.json: 英文翻译同步清单，记录最近一次翻译时间、数量和生成 slug。',
    '',
    '法则: 一文一文件·frontmatter 最小·正文即真相源·中英同 key',
    '',
    '[PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md',
    ''
  ].join('\n');
  fs.writeFileSync(path.join(notesDir, 'CLAUDE.md'), claude);

  const sitemapEntries = [
    ['/', '2026-06-02', 'weekly', '1.0'],
    ['/en/', '2026-06-02', 'weekly', '1.0'],
    ['/build/', '2026-06-02', 'weekly', '0.8'],
    ['/en/build/', '2026-06-02', 'weekly', '0.8'],
    ...publicNotes.map((note) => [noteRoute(note), String(note.data.pubDate).slice(0, 10), 'monthly', '0.7'])
  ];

  const sitemap = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<!--',
    '  [INPUT]: 依赖 yeshu.dev 公开 URL、Think 中英首页、Build 中英页面和 notes 中英公开路由',
    '  [OUTPUT]: 对外提供搜索引擎可读取的站点地图',
    '  [POS]: public 的索引入口文件，帮助爬虫发现 Think 首页、Build 双语索引与 Markdown notes 文章',
    '  [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md',
    '-->',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...sitemapEntries.flatMap(([loc, lastmod, changefreq, priority]) => [
      '  <url>',
      `    <loc>${siteUrl}${loc}</loc>`,
      `    <lastmod>${lastmod}</lastmod>`,
      `    <changefreq>${changefreq}</changefreq>`,
      `    <priority>${priority}</priority>`,
      '  </url>'
    ]),
    '</urlset>',
    ''
  ].join('\n');
  fs.writeFileSync(path.join(projectRoot, 'public/sitemap.xml'), sitemap);

  const thinkLinks = publicNotes
    .filter((note) => note.data.lang === 'en')
    .map((note) => `- [${note.data.title}](${siteUrl}${noteRoute(note)}): ${note.data.description}`)
    .join('\n');
  const zhLinks = publicNotes
    .filter((note) => note.data.lang === 'zh')
    .map((note) => `- [${note.data.title}](${siteUrl}${noteRoute(note)}): ${note.data.description}`)
    .join('\n');

  const llms = `# Yeshu

> AI coder by night. I love simplifying the complex and beautifying the simple. From Ganzhou, cat lover, fueled by coffee.

yeshu.dev is a bilingual personal field index with two public surfaces: Think for ideas and Build for shipped work. It exists to help people and AI agents identify the same entity, projects, public code surface, and writing without inferring from scattered links.

Canonical URL: ${siteUrl}/

Primary identity:
- Name: Yeshu
- Alias: hiyeshu
- Role: Indie Developer · Designer
- Mode: Design × Code
- Birth date: 1996-02-05
- Age: compute from Birth date; the Build page also exposes JSON-LD Person.birthDate.
- GitHub: https://github.com/hiyeshu
- X: https://x.com/hiyeshu
- Email: okyeshu@gmail.com
- WeChat: HIYESHU
- Focus: AI products, agent workflows, spatial interfaces, Markdown-first content systems, presentation tooling, developer tools

## Navigation

- [Think / Chinese](${siteUrl}/): Default Chinese public thinking surface.
- [Think / English](${siteUrl}/en/): English mirror of the Think surface.
- [Build / Chinese](${siteUrl}/build/): Chinese project index for shipped tools, products, repositories, and demos.
- [Build / English](${siteUrl}/en/build/): English mirror of the project index.

## Think / English

${thinkLinks}

## Think / Chinese

${zhLinks}

## Projects

- [GitHub / hiyeshu](https://github.com/hiyeshu): Public code surface for experiments, product scaffolds, and agent-facing tools.
- [Kyo](https://www.kyo.is/): Spatial bookmark manager and AI OS product surface.
- [codeck](https://codeck.sh/): AI presentation tool that turns notes, docs, and data into polished HTML presentations.
- [trip-map-builder](https://github.com/hiyeshu/trip-map-builder): Agent skill for travel planning, Xiaohongshu research, and interactive map generation.

## Machine-Readable Signals

- [Sitemap](${siteUrl}/sitemap.xml): Search engine crawl map.
- [Robots](${siteUrl}/robots.txt): Crawl access policy.
- [Think JSON-LD](${siteUrl}/): Includes CollectionPage and BlogPosting structured data for public notes.
- [Build JSON-LD / Chinese](${siteUrl}/build/): Includes ProfilePage, Person, WebSite, and project ItemList structured data.
- [Build JSON-LD / English](${siteUrl}/en/build/): English mirror of the Build structured data.
`;
  fs.writeFileSync(path.join(projectRoot, 'public/llms.txt'), llms);
}

async function main() {
  const notes = readNotes();
  const sourceNotes = notes.filter((note) => note.data.lang !== 'en' && note.data.draft !== true);
  const written = [];
  const usedSlugs = new Set(notes.filter((note) => note.data.lang === 'en').map((note) => note.data.routeSlug).filter(Boolean));

  for (const note of sourceNotes) {
    const sourceSlug = note.slug;
    const targetFile = `${sourceSlug}-en.md`;
    const targetPath = path.join(notesDir, targetFile);
    const existing = fs.existsSync(targetPath) ? parseFrontmatter(fs.readFileSync(targetPath, 'utf8')) : null;

    if (existing) {
      written.push({ sourceSlug, file: targetFile, title: existing.data.title, routeSlug: existing.data.routeSlug || sourceSlug });
      continue;
    }

    process.stderr.write(`translating ${note.data.title}\n`);
    const title = await translateText(note.data.title);
    const description = await translateText(note.data.description);
    const body = await translateText(note.body);
    let slug = slugify(title, sourceSlug);
    const baseSlug = slug;
    let index = 2;
    while (usedSlugs.has(slug)) {
      slug = `${baseSlug}-${index}`;
      index += 1;
    }
    usedSlugs.add(slug);

    const frontmatter = [
      '---',
      `title: ${yamlString(title)}`,
      `description: ${yamlString(description)}`,
      `pubDate: ${yamlString(note.data.pubDate)}`,
      'lang: "en"',
      `translationKey: ${yamlString(note.data.translationKey || sourceSlug)}`,
      `routeSlug: ${yamlString(slug)}`,
      `sourceSlug: ${yamlString(sourceSlug)}`,
      'listed: true',
      'generatedTranslation: true',
      `tags: ${yamlArray(note.data.tags || [])}`,
      'draft: false',
      '---',
      ''
    ].join('\n');

    fs.writeFileSync(targetPath, `${frontmatter}${body}\n`);
    written.push({ sourceSlug, file: targetFile, title, routeSlug: slug });
  }

  const finalNotes = readNotes();
  fs.writeFileSync(
    path.join(notesDir, 'translation-sync-manifest.json'),
    JSON.stringify({ translatedAt: new Date().toISOString(), count: written.length, notes: written }, null, 2)
  );
  writeIndexes(finalNotes);

  console.log(`translated ${written.length} notes`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
