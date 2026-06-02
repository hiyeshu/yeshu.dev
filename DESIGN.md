<!--
  [INPUT]: 依赖当前 yeshu.dev 的 JournalLayout、NoteLayout、FieldFigure、global.css、build.md 与 notes 内容结构
  [OUTPUT]: 对外提供 yeshu.dev 的设计系统说明、组件风格边界、抽象顺序和禁止事项
  [POS]: 项目根设计契约，作为后续组件重构与新增页面的视觉真相源
  [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
-->

# yeshu.dev DESIGN

yeshu.dev is a monochrome field journal for a builder, not a portfolio template and not a magazine skin.

The current style should be preserved as the base system: black ink, white paper, thin borders, data labels, ASCII/bitmap field marks, dense grids, and Markdown as the source of truth.

## Current Conclusion

We have a component extraction problem.

It affects the Think homepage, Build page, note pages, future blog writing, and sound interactions because the visual language is strong but the component boundaries are still weak.

This design system should extract reusable components from the existing style and should not replace the site with a generic UI kit.

Success means a new page can be assembled from the same journal components without copying large layout blocks.

The biggest risk is turning the current field-journal style into decoration. Every visible frame, label, line, and sound should map to navigation, status, content hierarchy, or interaction feedback.

Recommendation: start with local component extraction, then add small sensory behavior only after the structural components are stable.

## Style Name

**Field Journal Annex**

Keywords:
- monochrome
- indexed
- archival
- technical
- tactile
- Markdown-first
- agent-readable
- soft-interactive

Comparable patterns:
- research annex
- engineering field note
- museum object label
- terminal index
- map legend
- public code catalog

## Design Principles

1. **Index before decoration**
   Every panel should answer where the user is, what the object is, or why it exists.

2. **Markdown is the record**
   Components render structured Markdown data. Components do not become the source of truth.

3. **Frames are information**
   Borders separate semantic surfaces. Do not add boxes only to create visual noise.

4. **Density is allowed**
   The site can feel technical and compressed. The text must still be readable.

5. **Motion and sound are quiet**
   Interaction feedback can be tactile, but it must be subtle, opt-in, and never autoplay.

6. **No generic card language**
   Avoid rounded marketing cards, soft shadows, gradients, bento panels, and decorative blobs.

7. **Interaction never reflows**
   Hover, scroll, and active states must sit on top of the layout. They may add lines, marks, or overlay indicators, but they must not shift grid geometry.

## Visual Tokens

```css
:root {
  --journal-bg: #ffffff;
  --journal-ink: #000000;
  --journal-muted: #333333;
  --hairline: 1px solid var(--journal-ink);
  --grid-gap: 1px;
}
```

Typography:
- body: system sans, readable, neutral
- labels: mono, uppercase, small
- figure titles: uppercase, 900 weight, tight line-height
- note body: normal sentence case, generous line-height

Shape:
- default radius: none
- border: one-pixel black line
- divider: dotted hairline for secondary rows
- shadow: avoid

Color:
- default: black and white
- muted text: near-black gray only
- no color accents unless they carry state or media content

Scrollbar:
- native scrollbars are always hidden
- the visible scrollbar is an overlay indicator drawn by `SensoryLayer`
- white track, black thumb, square geometry
- hidden at rest, visible only while the internal surface is actively scrolling
- the overlay sits on top of the surface and never participates in layout
- no system gray, no rounded pill

Sound:
- pack direction: `soft`
- default volume: low
- roles: tap, subtle, forward, backward, open, close
- no autoplay, no hero sound by default

## Component Set

### JournalShell

Owns the page frame.

Responsibilities:
- outer border
- marginalia text
- header slot
- main content grid
- responsive collapse
- fixed viewport shell with only the inner surface scrolling

Do not put SEO, JSON-LD, or page-specific content logic here.

Rule:
- the outer frame stays stable; Build and Think content move inside `.journal-main` or `.notes-main`

### StatusHeader

Owns the top status navigation. It is not just passive metadata.

Fields:
- mark
- volume
- date
- index

Rules:
- always monochrome
- index should reflect the current route or document id
- mark links back to `/`
- the header belongs to the stable shell, not the scrolling surface
- each datum can act as a navigation target when the destination is semantic
- visible labels use semantic navigation names such as Think and Build
- active/current datum stays paper-white and uses a small index block before the value
- hover/focus use temporary black-white inversion

### MetaDatum

Small label/value unit used inside `StatusHeader`.

Example:

```text
Volume
01.A
```

Rules:
- label is uppercase mono
- value is compact
- left border separates each unit on desktop
- top border separates units on mobile

### DirectoryPanel

Owns the left-side context.

Modes:
- build page: abstract, controls, site links
- Think index: notes count and note list
- note detail: notes directory with active note

Rules:
- navigation links and external links are different groups
- current page should be visibly active
- list items use mono labels and dotted separators
- active/current states use inset lines
- hover may invert as a transient readout state

### LinkBank

Renders link rows.

Variants:
- internal navigation
- external references

Rules:
- internal links do not open new tabs
- external links open new tabs
- hover may trigger `interaction.subtle`

### FigureCard

Current implementation: `FieldFigure.astro`.

Owns project/object display.

Parts:
- data readout
- visual field
- project copy
- figure caption
- metric strip

Rules:
- use for projects, repos, tools, and concrete public artifacts
- do not use for ordinary blog posts
- visual field can use ASCII icon, SVG mark, or text mark

### ASCIIField

Current implementation: `ASCIIIcon.jsx` within `FieldFigure`.

Owns the technical mark rendering.

Rules:
- static by default
- animation only on hover or visibility
- no layout shift
- mark should be inspectable as a real project identity signal, not pure background texture

### NoteIndex

Owns `/`.

Parts:
- kicker
- compact title
- short deck
- dated note list

Rules:
- one Markdown file equals one row
- no tags or types in the first version
- date and title are enough for navigation
- default Think page should not repeat the left directory with a giant hero
- main surface should behave like a reading ledger, not a landing page
- index page is single-column; post sidebar owns article switching

### NoteArticle

Owns `/notes/[slug]/`.

Parts:
- kicker
- title
- description
- date
- Markdown body

Rules:
- body text should be easier to read than figure text
- Markdown output must visibly distinguish headings, quotes, rules, links, lists, and code
- prose line length should stay narrow enough for sustained reading
- code blocks are bordered and scrollable
- headings keep the journal voice without stealing the article from the reader

### SensoryLayer

Current implementation: `SensoryLayer.jsx`.

Owns soft UI sounds for hover, focus, click, local navigation, and overlay scroll surface state.

Rules:
- use Web Audio API
- use the `soft` sound direction from sensory-ui as reference
- do not import the whole sensory-ui component set
- bind sound to semantic events, not decoration
- bind scrollbar visibility to `.surface-scrollbar.surface-is-scrolling`, not native scrollbars
- respect reduced motion / user preference
- expose a hidden kill switch through `localStorage["yeshu.sound"] = "off"`

Suggested first events:
- link hover: `interaction.subtle`
- link/button click: `interaction.tap`, matching sensory-ui Button's default click role
- main surface scroll: show overlay scrollbar, sync thumb geometry, then hide it after idle
- note navigation may later add `navigation.forward`, but current click behavior stays Button-like
- directory active change: `navigation.tab`

## Extraction Order

1. `MetaDatum`
2. `StatusHeader`
3. `JournalShell`
4. `DirectoryPanel`
5. `LinkBank`
6. `NoteIndex`
7. `NoteArticle`
8. `FigureCard`
9. `SensoryLayer`

Reason:
- header and shell duplication already exists between `JournalLayout` and `NoteLayout`
- directory/link semantics are currently mixed
- figure card works well enough and should be refactored after the shell is stable
- sound should come after structure, otherwise it becomes decoration

## Non-Goals

- no CMS
- no theme switcher
- no generic shadcn component migration
- no colorful design system
- no rounded card redesign
- no hover-only content
- no autoplay sound
- no post category system in the first notes version

## Implementation Target

The next refactor should produce:

```text
src/components/journal/
├── JournalShell.astro
├── StatusHeader.astro
├── MetaDatum.astro
├── DirectoryPanel.astro
├── LinkBank.astro
├── NoteIndex.astro
└── NoteArticle.astro
```

Keep:

```text
src/components/FieldFigure.astro
src/components/ASCIIIcon.jsx
```

until the shell extraction is complete.

## Quality Bar

A component belongs in this system only if:
- it has a stable semantic role
- it can be reused by at least two routes or content modes
- it reduces layout duplication
- it preserves the Field Journal Annex style
- it does not make Markdown less central

If a component is only visual decoration, do not extract it yet.
