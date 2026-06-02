/**
 * [INPUT]: 依赖 notes collection entry 的 lang、routeSlug、translationKey 和 sourceSlug 字段
 * [OUTPUT]: 对外提供语言常量、UI 文案、首页路径、Build 路径、note slug/path 和语言互链函数；首页副标题不进 i18n
 * [POS]: src/lib 的 i18n 路由真相源，被 Think 首页、Build 页面、note 详情页和布局层消费
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

export const languages = ['zh', 'en'];

export const languageLabels = {
  zh: 'CN',
  en: 'EN'
};

export const languageNames = {
  zh: '中文',
  en: 'English'
};

export const uiText = {
  zh: {
    htmlLang: 'zh-CN',
    siteTitle: 'Yeshu Think',
    siteDescription: '关于 AI 产品、agent 工作流、界面设计和小型软件系统的公开思考。',
    navThink: 'Think',
    navBuild: 'Build',
    notesLabel: '笔记',
    projectsLabel: '作品',
    indexKicker: 'Think Log',
    indexTitle: '笔记',
    noteKicker: 'Think'
  },
  en: {
    htmlLang: 'en',
    siteTitle: 'Yeshu Think',
    siteDescription: 'Public thinking on AI products, agent workflows, interface design, and small software systems.',
    navThink: 'Think',
    navBuild: 'Build',
    notesLabel: 'Notes',
    projectsLabel: 'Projects',
    indexKicker: 'Think Log',
    indexTitle: 'Notes',
    noteKicker: 'Think'
  }
};

export function homePath(lang = 'zh') {
  return lang === 'en' ? '/en/' : '/';
}

export function buildPath(lang = 'zh') {
  return lang === 'en' ? '/en/build/' : '/build/';
}

export function noteSlug(note) {
  return note.data.routeSlug || note.id.replace(/\.mdx?$/, '').replace(/-en$/, '');
}

export function noteKey(note) {
  return note.data.translationKey || note.data.sourceSlug || noteSlug(note);
}

export function notePath(note) {
  const slug = noteSlug(note);
  return note.data.lang === 'en' ? `/en/notes/${slug}/` : `/notes/${slug}/`;
}

export function notesForLang(notes, lang) {
  return notes
    .filter((note) => !note.data.draft && note.data.listed && note.data.lang === lang)
    .sort((a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf());
}

export function languageLinksForPath(currentLang, paths) {
  return languages.map((lang) => ({
    href: paths[lang],
    label: languageLabels[lang],
    active: lang === currentLang
  }));
}

export function languageLinksForNote(note, notes) {
  const key = noteKey(note);
  const variants = new Map(
    notes
      .filter((entry) => noteKey(entry) === key && !entry.data.draft)
      .map((entry) => [entry.data.lang, entry])
  );

  return languages
    .filter((lang) => variants.has(lang))
    .map((lang) => {
      const entry = variants.get(lang);
      return {
        href: notePath(entry),
        label: languageLabels[lang],
        active: entry.id === note.id
      };
    });
}
