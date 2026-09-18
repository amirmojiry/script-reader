# Script Reader

Script Reader is a static, offline-first Vue 3 web application for reading plays, rehearsing roles, and running table reads. It is designed for GitHub Pages and requires no backend, account, or server database.

## Version 1.5 features

- Local play library backed by IndexedDB.
- Structured acts, scenes, dialogue, spoken text, inline directions, and stage directions.
- Five bundled user-supplied plays: “Horses at the Window”, «مهمان ناخوانده» by اریک امانوئل اشمیت translated by تینوش نظم‌جو, plus «بانو و مرد مرده», «جنایت و مکافات», and «عکس دسته جمعی با خانم بزرگ» by Chista Yasrebi.
- Library filters for character count, estimated duration, author, translator, and genre, plus sorting by title, duration, and role count.
- A guided play-selection wizard recommends plays from available cast size, male/female availability, available time, and preferred genre.
- Each library card presents its three metrics and the open action in an equal-sized control grid.
- Character highlighting with configurable colors, gender metadata, dialogue count, spoken-word share, estimated speaking time, clickable RTL role timelines, and a «شروع» shortcut to the role's first line.
- A virtual narrator role covers stage directions, explicit inline directions, and balanced parenthetical segments inside dialogue; narrator highlighting/color and rehearsal ownership are persisted per play.
- Vazirmatn as the default font plus Noto Sans Arabic, Noto Naskh Arabic, Amiri, Lalezar, Katibeh, and Parastoo choices.
- A dedicated settings page outside individual play readers for font size, line height, font family, light/dark theme, stage-direction visibility, and Wake Lock. Preferences are stored in IndexedDB and restored after navigation, refresh, and reopening the app.
- A fully collapsible roles panel: closing roles removes the reserved panel width and lets the reader use the full available content width. Mobile readers start with roles collapsed and keep the close control inside the panel.
- Full-text search with previous/next result navigation.
- Rehearsal mode with **My role**, next/previous own line, optional cue-only context, and three reveal strategies: hidden, first words, and progressive chunks.
- Table-read mode with one current block at a time.
- Per-line bookmarks and notes.
- JSON import/export with nested schema validation; imported strings are rendered as text, never raw HTML.
- Optional Screen Wake Lock and browser Speech Synthesis for other roles.
- PWA caching for offline use after cache warm-up, including runtime caching for Google Fonts stylesheets and webfonts.
- Responsive RTL-first Persian interface.

## Development

```bash
npm ci
npm run typecheck
npm run test:run
npm run build
npm run dev
```

The production base path is `/script-reader/`, matching `https://amirmojiry.github.io/script-reader/`.

## Data format

The canonical model is defined in `src/types.ts` and documented in `docs/play-format.md`. New curated plays should include character gender metadata and one or more genres; missing character gender is treated as unknown for backward compatibility. The narrator is a virtual role: standalone stage directions, explicit inline directions, and balanced parenthetical dialogue segments are presented as narrator content without rewriting the source text. Bundled play source data supplied for this project is converted deterministically to the same canonical model.

## Release process

Every PR merged to `master` is one release. The branch must advance `VERSION`, add matching dated sections to `CHANGELOG.en.md` and `CHANGELOG.fa.md`, and pass release validation; application-affecting changes also pass the review-ready frontend CI suite.

See `CONTRIBUTING.md`, `AGENTS.md`, and `docs/pull-request-review-deployment.md`.
