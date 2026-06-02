/**
 * [INPUT]: 依赖 macOS Keychain 的 Notion Safe Storage、Notion Electron Cookies、本地 notion.db 和 Notion /api/v3/loadPageChunk
 * [OUTPUT]: 对外提供 Thinking 数据库到 src/content/notes/*.md 的同步脚本
 * [POS]: scripts 的 Notion 内容同步器，把 Notion Thinking 数据库投射成 Astro notes Markdown
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import crypto from 'node:crypto';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const projectRoot = process.cwd();
const notionDb = '/Users/yeshu/Library/Application Support/Notion/notion.db';
const cookieDb = '/Users/yeshu/Library/Application Support/Notion/Partitions/notion/Cookies';
const collectionId = '6e446a09-ec42-4542-a287-73c87d22bd0e';
const outputDir = path.join(projectRoot, 'src/content/notes');
const manualFilesToRemove = [
  'agent-native-interfaces.md'
];
const slugOverrides = {
  'dde07be5-ee63-43c5-af87-510570815d60': 'not-all-problems-need-solving'
};

function run(command, args, input) {
  return execFileSync(command, args, {
    input,
    encoding: 'utf8',
    maxBuffer: 1024 * 1024 * 64
  });
}

function getRows() {
  const sql = `
SELECT id, properties, created_time, last_edited_time
FROM block
WHERE parent_id='${collectionId}'
  AND parent_table='collection'
  AND type='page'
  AND alive=1
  AND properties IS NOT NULL
GROUP BY id
ORDER BY created_time DESC;
`;
  return JSON.parse(run('sqlite3', ['-json', notionDb], sql));
}

function parsePropertyText(value) {
  return value?.[0]?.[0]?.trim() || '';
}

function parseDate(properties) {
  const dateToken = properties['cu`k']?.[0]?.[1]?.find((item) => item?.[0] === 'd');
  return dateToken?.[1]?.start_date || '2023-01-01';
}

function parseTags(properties) {
  return (properties.hcjW?.[0]?.[0] || '')
    .split(',')
    .map((tag) => tag.trim())
    .filter(Boolean);
}

function decryptCookie(name) {
  const password = run('security', ['find-generic-password', '-w', '-s', 'Notion Safe Storage']).replace(/\n$/, '');
  const key = crypto.pbkdf2Sync(password, 'saltysalt', 1003, 16, 'sha1');
  const hex = run('sqlite3', [
    cookieDb,
    `SELECT hex(encrypted_value) FROM cookies WHERE host_key='.www.notion.so' AND name='${name}' LIMIT 1`
  ]).trim();
  if (!hex) throw new Error(`Missing Notion cookie: ${name}`);

  let encrypted = Buffer.from(hex, 'hex');
  if (encrypted.subarray(0, 3).toString() === 'v10') encrypted = encrypted.subarray(3);

  const decipher = crypto.createDecipheriv('aes-128-cbc', key, Buffer.alloc(16, ' '));
  let plain = Buffer.concat([decipher.update(encrypted), decipher.final()]);

  // Chromium 130+ prefixes encrypted cookie plaintext with SHA256(host_key).
  if (plain.length > 32 && !/^[\x20-\x7e]+$/.test(plain.toString('utf8'))) {
    plain = plain.subarray(32);
  }

  return plain.toString('utf8');
}

function slugify(title, fallback) {
  const ascii = title
    .normalize('NFKD')
    .replace(/[^\p{L}\p{N}\s-]/gu, '')
    .trim()
    .toLowerCase()
    .replace(/[_\s]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');

  if (ascii) return ascii;
  return fallback.replace(/-/g, '').slice(0, 12);
}

function yamlString(value) {
  return JSON.stringify(String(value).replace(/\n/g, ' ').trim());
}

function yamlArray(values) {
  if (!values.length) return '[]';
  return `\n${values.map((value) => `  - ${yamlString(value)}`).join('\n')}`;
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

class NotionRateLimitError extends Error {}
class NotionUnavailableError extends Error {}

function plainTextFromRichText(richText) {
  return (richText || []).map((segment) => segment?.[0] || '').join('');
}

function renderRichText(richText) {
  return (richText || []).map((segment) => {
    let text = segment?.[0] || '';
    const marks = segment?.[1] || [];
    const link = marks.find((mark) => mark?.[0] === 'a')?.[1];
    if (link) text = `[${text}](${link})`;
    if (marks.some((mark) => mark?.[0] === 'c')) text = `\`${text}\``;
    if (marks.some((mark) => mark?.[0] === 'h')) text = `<mark>${text}</mark>`;
    if (marks.some((mark) => mark?.[0] === 's')) text = `~~${text}~~`;
    if (marks.some((mark) => mark?.[0] === 'i')) text = `*${text}*`;
    if (marks.some((mark) => mark?.[0] === 'b')) text = `**${text}**`;
    return text;
  }).join('');
}

async function fetchPageBlocks(token, pageId) {
  const all = new Map();
  let cursor = { stack: [] };

  for (let chunkNumber = 0; chunkNumber < 8; chunkNumber += 1) {
    let payload = null;
    let lastError = '';

    for (let attempt = 1; attempt <= 4; attempt += 1) {
      let response = null;
      try {
        response = await fetch('https://www.notion.so/api/v3/loadPageChunk', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Cookie: `token_v2=${token}`
          },
          body: JSON.stringify({
            pageId,
            limit: 500,
            cursor,
            chunkNumber,
            verticalColumns: false
          })
        });
      } catch (error) {
        lastError = error.message;
        await delay(650 * attempt);
        continue;
      }

      if (response.ok) {
        payload = await response.json();
        break;
      }

      lastError = `${response.status} ${await response.text()}`;
      if (response.status === 429 || lastError.includes('Error 1015')) {
        throw new NotionRateLimitError('Notion rate limited loadPageChunk');
      }
      await delay(350 * attempt);
    }

    if (!payload) throw new NotionUnavailableError(`Notion loadPageChunk failed: ${lastError}`);

    for (const [id, wrapper] of Object.entries(payload.recordMap?.block || {})) {
      const block = wrapper?.value?.value || wrapper?.value;
      if (block?.id) all.set(id, block);
    }

    cursor = payload.cursor || { stack: [] };
    if (!cursor.stack?.length) break;
  }

  return all;
}

function blockSource(block) {
  return block.format?.display_source
    || block.format?.source
    || block.properties?.source?.[0]?.[0]
    || plainTextFromRichText(block.properties?.title)
    || '';
}

function codeLanguage(block) {
  return plainTextFromRichText(block.properties?.language)
    .toLowerCase()
    .replace(/[^a-z0-9+#-]/g, '');
}

function fencedCode(code, language = '') {
  const fence = code.includes('```') ? '````' : '```';
  return `${fence}${language}\n${code}\n${fence}`;
}

function renderTable(block, records) {
  const rows = (block.content || [])
    .map((id) => records.get(id))
    .filter((row) => row?.type === 'table_row')
    .map((row) => Object.values(row.properties || {}).map((cell) => renderRichText(cell)));

  if (!rows.length) return '';

  const width = Math.max(...rows.map((row) => row.length));
  const normalized = rows.map((row) => Array.from({ length: width }, (_, index) => row[index] || ''));
  const [header, ...body] = normalized;
  const escapeCell = (cell) => cell.replace(/\|/g, '\\|').replace(/\n/g, ' ');

  return [
    `| ${header.map(escapeCell).join(' | ')} |`,
    `| ${header.map(() => '---').join(' | ')} |`,
    ...body.map((row) => `| ${row.map(escapeCell).join(' | ')} |`)
  ].join('\n');
}

function renderChildren(ids, records, depth = 0) {
  let orderedIndex = 0;
  let previousType = '';

  return (ids || [])
    .map((id) => {
      const block = records.get(id);
      if (!block) return '';

      if (block.type === 'numbered_list') {
        orderedIndex = previousType === 'numbered_list' ? orderedIndex + 1 : 1;
      }

      previousType = block.type;
      return renderBlock(block, records, depth, orderedIndex || 1);
    })
    .filter(Boolean)
    .join('\n');
}

function renderBlock(block, records, depth = 0, index = 1) {
  if (!block) return '';

  const title = renderRichText(block.properties?.title);
  const plain = plainTextFromRichText(block.properties?.title);
  const indent = '  '.repeat(depth);
  const childMarkdown = renderChildren(block.content || [], records, depth + 1);

  let current = '';
  switch (block.type) {
    case 'header':
      current = `## ${title}`;
      break;
    case 'sub_header':
      current = `### ${title}`;
      break;
    case 'sub_sub_header':
      current = `#### ${title}`;
      break;
    case 'quote':
      current = plain.split('\n').map((line) => `> ${line}`).join('\n');
      break;
    case 'bulleted_list':
      current = `${indent}- ${title}`;
      break;
    case 'numbered_list':
      current = `${indent}${index}. ${title}`;
      break;
    case 'to_do':
      current = `${indent}- [${block.format?.checked ? 'x' : ' '}] ${title}`;
      break;
    case 'toggle':
      current = `<details>\n<summary>${title}</summary>`;
      break;
    case 'divider':
      current = '---';
      break;
    case 'page':
      current = `## ${title}`;
      break;
    case 'code':
      current = fencedCode(plain, codeLanguage(block));
      break;
    case 'table':
      current = renderTable(block, records);
      break;
    case 'image':
      current = blockSource(block) ? `![${plain || 'image'}](${blockSource(block)})` : '';
      break;
    case 'video':
      current = blockSource(block) ? `<video controls src="${blockSource(block)}"></video>` : '';
      break;
    case 'audio':
      current = blockSource(block) ? `<audio controls src="${blockSource(block)}"></audio>` : '';
      break;
    case 'bookmark':
      current = blockSource(block) ? `[${plain || blockSource(block)}](${blockSource(block)})` : '';
      break;
    case 'file':
    case 'pdf':
      current = blockSource(block) ? `[${plain || 'file'}](${blockSource(block)})` : '';
      break;
    case 'column':
    case 'column_list':
    case 'collection_view':
    case 'collection_view_page':
      current = '';
      break;
    case 'text':
    default:
      current = title;
      break;
  }

  if (block.type === 'toggle') {
    return childMarkdown ? `${current}\n\n${childMarkdown}\n</details>` : `${current}\n</details>`;
  }

  if (!current && !childMarkdown) return '';
  if (!childMarkdown) return current;
  return `${current}\n${childMarkdown}`;
}

function cleanBody(markdown) {
  return markdown
    .replace(/<empty-block\/>/g, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function stripDisplayMarkdown(line) {
  return line
    .replace(/^#+\s*/, '')
    .replace(/^>\s*/, '')
    .replace(/^\s*[-*+]\s+/, '')
    .replace(/\*\*/g, '')
    .replace(/__/g, '')
    .replace(/[*_`]/g, '')
    .replace(/<[^>]+>/g, '')
    .trim();
}

function isDivider(line) {
  return /^-{3,}\s*$/.test(String(line || '').trim());
}

function isHeading(line) {
  return /^#{2,6}\s+/.test(String(line || '').trim());
}

function isPrefaceHeading(line) {
  return stripDisplayMarkdown(line).replace(/^👀\s*/, '').trim() === '卷首语';
}

function isUsefulDeckLine(line) {
  return Boolean(line)
    && line !== '卷首语'
    && line !== '图片加载中'
    && !/^(📚\s*)?Reading$/i.test(line)
    && !/^拓展阅读[:：]?$/i.test(line)
    && !/^推荐阅读[:：]?$/i.test(line)
    && !/^Vol\.?/i.test(line);
}

function prepareBody(markdown) {
  const lines = markdown.split('\n');
  const headingIndex = lines.findIndex(isPrefaceHeading);
  if (headingIndex === -1) {
    return {
      body: normalizeOrderedLists(markdown),
      description: ''
    };
  }

  let cursor = headingIndex + 1;
  const prefaceLines = [];

  while (cursor < lines.length) {
    const line = lines[cursor];
    if (isDivider(line) || isHeading(line)) break;
    prefaceLines.push(line);
    cursor += 1;
  }

  const description = prefaceLines
    .map(stripDisplayMarkdown)
    .find(isUsefulDeckLine) || '';

  if (isDivider(lines[cursor])) cursor += 1;

  const body = [
    ...lines.slice(0, headingIndex),
    ...lines.slice(cursor)
  ].join('\n');

  return {
    body: normalizeOrderedLists(cleanBody(body)),
    description
  };
}

function normalizeOrderedLists(markdown) {
  const counters = new Map();

  return markdown.split('\n').map((line) => {
    const match = line.match(/^(\s*)\d+\.\s+(.*)$/);
    if (!match) {
      counters.clear();
      return line;
    }

    const [, indent, content] = match;
    const count = (counters.get(indent) || 0) + 1;
    counters.set(indent, count);
    return `${indent}${count}. ${content}`;
  }).join('\n');
}

function normalizeCachedFile(filePath) {
  const text = fs.readFileSync(filePath, 'utf8');
  const match = text.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  if (!match) {
    const normalized = normalizeOrderedLists(text);
    if (normalized !== text) fs.writeFileSync(filePath, normalized);
    return;
  }

  const [, frontmatter, body] = match;
  const prepared = prepareBody(body);
  const currentDescription = frontmatter.match(/^description:\s*(.*)$/m)?.[1] || '';
  const description = prepared.description
    || stripDisplayMarkdown(currentDescription.replace(/^"|"$/g, ''))
    || descriptionFromBody(prepared.body);
  const nextFrontmatter = frontmatter.replace(
    /^description:\s*.*$/m,
    `description: ${yamlString(description)}`
  );
  const normalized = `---\n${nextFrontmatter}\n---\n${prepared.body}\n`;
  if (normalized !== text) fs.writeFileSync(filePath, normalized);
}

function descriptionFromBody(body) {
  const first = body
    .split('\n')
    .map(stripDisplayMarkdown)
    .find((line) => isUsefulDeckLine(line) && !line.startsWith('---'));
  return (first || 'Notion Thinking note.').slice(0, 120);
}

function readNoteFrontmatter(filePath) {
  const text = fs.readFileSync(filePath, 'utf8');
  const match = text.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return null;
  const frontmatter = {};
  for (const line of match[1].split('\n')) {
    const pair = line.match(/^(\w+):\s*(.*)$/);
    if (!pair) continue;
    const [, key, rawValue] = pair;
    try {
      frontmatter[key] = JSON.parse(rawValue);
    } catch {
      frontmatter[key] = rawValue.replace(/^"|"$/g, '');
    }
  }
  return frontmatter;
}

function updateGeneratedMaps() {
  const noteFiles = fs.readdirSync(outputDir)
    .filter((file) => file.endsWith('.md') && file !== 'CLAUDE.md')
    .map((file) => {
      const data = readNoteFrontmatter(path.join(outputDir, file));
      return {
        file,
        slug: file.replace(/\.md$/, ''),
        title: data?.title || file,
        description: data?.description || 'Think note.',
        pubDate: data?.pubDate || '2023-01-01',
        listed: data?.listed !== false,
        draft: data?.draft === true,
        notionId: data?.notionId
      };
    })
    .filter((note) => !note.draft)
    .sort((a, b) => b.pubDate.localeCompare(a.pubDate) || a.title.localeCompare(b.title));

  const claude = [
    '# content/notes/',
    '> L2 | 父级: ../CLAUDE.md',
    '',
    '成员清单',
    ...noteFiles.map((note) => `${note.file}: Think 文章，${note.notionId ? '同步自 Notion Thinking 数据库' : '本地手写内容'}，标题《${note.title}》。`),
    'notion-sync-manifest.json: Notion Thinking 同步清单，记录最近一次同步时间、数量和生成 slug。',
    '',
    '法则: 一文一文件·frontmatter 最小·正文即真相源',
    '',
    '[PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md',
    ''
  ].join('\n');
  fs.writeFileSync(path.join(outputDir, 'CLAUDE.md'), claude);

  const sitemapEntries = [
    ['/', '2026-06-02', 'weekly', '1.0'],
    ['/build/', '2026-05-31', 'weekly', '0.8'],
    ...noteFiles.map((note) => [`/notes/${note.slug}/`, note.pubDate, 'monthly', '0.7'])
  ];
  const sitemap = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<!--',
    '  [INPUT]: 依赖 yeshu.dev 公开 URL、Think 默认首页、Build 页面和 notes 文章公开路由',
    '  [OUTPUT]: 对外提供搜索引擎可读取的站点地图',
    '  [POS]: public 的索引入口文件，帮助爬虫发现 Think 首页、Build 索引与 Markdown notes 文章',
    '  [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md',
    '-->',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...sitemapEntries.flatMap(([loc, lastmod, changefreq, priority]) => [
      '  <url>',
      `    <loc>https://yeshu.dev${loc}</loc>`,
      `    <lastmod>${lastmod}</lastmod>`,
      `    <changefreq>${changefreq}</changefreq>`,
      `    <priority>${priority}</priority>`,
      '  </url>'
    ]),
    '</urlset>',
    ''
  ].join('\n');
  fs.writeFileSync(path.join(projectRoot, 'public/sitemap.xml'), sitemap);

  const thinkLinks = noteFiles
    .filter((note) => note.listed)
    .map((note) => `- [${note.title}](https://yeshu.dev/notes/${note.slug}/): ${note.description}`)
    .join('\n');
  const llms = `# Yeshu

> Yeshu is an independent builder focused on AI products, agent workflows, Markdown-first publishing, and small public software systems.

yeshu.dev is a personal field index with two public surfaces: Think for ideas and Build for shipped work. It exists to help people and AI agents identify the same entity, projects, public code surface, and writing without inferring from scattered links.

Canonical URL: https://yeshu.dev/

Primary identity:
- Name: Yeshu
- Alias: hiyeshu
- GitHub: https://github.com/hiyeshu
- Focus: AI products, agent workflows, spatial interfaces, Markdown-first content systems, presentation tooling, developer tools

## Navigation

- [Think](https://yeshu.dev/): Default public thinking surface for notes, models, judgments, and essays.
- [Build](https://yeshu.dev/build/): Project index for shipped tools, products, repositories, and demos.

## Think

${thinkLinks}

## Projects

- [GitHub / hiyeshu](https://github.com/hiyeshu): Public code surface for experiments, product scaffolds, and agent-facing tools.
- [Kyo](https://www.kyo.is/): Spatial bookmark manager and AI OS product surface.
- [codeck](https://codeck.sh/): AI presentation tool that turns notes, docs, and data into polished HTML presentations.
- [trip-map-builder](https://github.com/hiyeshu/trip-map-builder): Agent skill for travel planning, Xiaohongshu research, and interactive map generation.

## Machine-Readable Signals

- [Sitemap](https://yeshu.dev/sitemap.xml): Search engine crawl map.
- [Robots](https://yeshu.dev/robots.txt): Crawl access policy.
- [Think JSON-LD](https://yeshu.dev/): Includes CollectionPage and BlogPosting structured data for public notes.
- [Build JSON-LD](https://yeshu.dev/build/): Includes ProfilePage, Person, WebSite, and project ItemList structured data.

## Optional

- [Kyo product page](https://www.kyo.is/): Useful for understanding Yeshu's product taste and spatial interface direction.
- [codeck product page](https://codeck.sh/): Useful for understanding Yeshu's Markdown-to-artifact workflow.
`;
  fs.writeFileSync(path.join(projectRoot, 'public/llms.txt'), llms);
}

async function main() {
  fs.mkdirSync(outputDir, { recursive: true });

  for (const filename of manualFilesToRemove) {
    const filePath = path.join(outputDir, filename);
    if (fs.existsSync(filePath)) fs.rmSync(filePath);
  }

  const offlineOnly = process.env.NOTION_SYNC_OFFLINE === '1';
  const token = offlineOnly ? '' : decryptCookie('token_v2');
  const rows = getRows();
  const seenSlugs = new Map();
  const written = [];
  let offlineMode = false;

  for (const row of rows) {
    const properties = JSON.parse(row.properties || '{}');
    const title = parsePropertyText(properties.title);
    if (!title || title === '新页面') continue;

    const date = parseDate(properties);
    const tags = parseTags(properties);
    const baseSlug = slugOverrides[row.id] || slugify(title, row.id);
    const collisionCount = seenSlugs.get(baseSlug) || 0;
    seenSlugs.set(baseSlug, collisionCount + 1);
    const slug = collisionCount ? `${baseSlug}-${collisionCount + 1}` : baseSlug;

    const frontmatter = [
      '---',
      `title: ${yamlString(title)}`,
      `description: ${yamlString('Notion Thinking note.')}`,
      `pubDate: ${yamlString(date)}`,
      'lang: "zh"',
      'listed: true',
      `notionId: ${yamlString(row.id)}`,
      `notionUrl: ${yamlString(`https://www.notion.so/${row.id.replace(/-/g, '')}`)}`,
      `tags: ${yamlArray(tags)}`,
      'draft: false',
      '---',
      ''
    ].join('\n');

    const filePath = path.join(outputDir, `${slug}.md`);
    if (offlineOnly) {
      if (!fs.existsSync(filePath)) {
        throw new Error(`Cannot refresh cached note ${title}: ${filePath} is missing`);
      }
      normalizeCachedFile(filePath);
      process.stderr.write(`refreshing cached ${title}\n`);
      written.push({ slug, title, date });
      continue;
    }

    if (offlineMode) {
      if (fs.existsSync(filePath)) {
        normalizeCachedFile(filePath);
        process.stderr.write(`keeping cached ${title}\n`);
        written.push({ slug, title, date });
        continue;
      }
      throw new Error(`Cannot sync ${title}: Notion rate limited and no cached file exists`);
    }

    let records = null;
    try {
      process.stderr.write(`syncing ${title}\n`);
      records = await fetchPageBlocks(token, row.id);
      await delay(900);
    } catch (error) {
      if ((error instanceof NotionRateLimitError || error instanceof NotionUnavailableError) && fs.existsSync(filePath)) {
        offlineMode = true;
        normalizeCachedFile(filePath);
        process.stderr.write(`rate limited; keeping cached ${title}\n`);
        written.push({ slug, title, date });
        continue;
      }
      throw error;
    }

    const page = records.get(row.id);
    const prepared = prepareBody(cleanBody(renderChildren(page.content || [], records, 0)));
    const description = prepared.description || descriptionFromBody(prepared.body);
    const noteFrontmatter = frontmatter.replace(
      `description: ${yamlString('Notion Thinking note.')}`,
      `description: ${yamlString(description)}`
    );

    fs.writeFileSync(filePath, `${noteFrontmatter}${prepared.body}\n`);
    written.push({ slug, title, date });
  }

  fs.writeFileSync(
    path.join(outputDir, 'notion-sync-manifest.json'),
    JSON.stringify({ syncedAt: new Date().toISOString(), count: written.length, notes: written }, null, 2)
  );
  updateGeneratedMaps();

  console.log(`synced ${written.length} Notion notes`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
