# Script Reader

Script Reader is a static, offline-first Vue 3 web application for reading plays, rehearsing roles, and running table reads. It is designed for GitHub Pages and requires no backend, account, or server database.

## Version 1.1 features

- Local play library backed by IndexedDB.
- Structured acts, scenes, dialogue, spoken text, inline directions, and stage directions.
- The complete user-supplied text of “Horses at the Window” bundled with the application.
- Character highlighting with configurable colors, dialogue count, spoken-word share, estimated speaking time, and clickable RTL role timelines.
- Vazirmatn as the default font plus Noto Sans Arabic, Noto Naskh Arabic, Amiri, Lalezar, Katibeh, and Parastoo choices.
- A dedicated settings panel for font size, line height, font family, light/dark theme, stage-direction visibility, and Wake Lock; preferences are automatically restored from browser storage.
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

The canonical model is defined in `src/types.ts` and documented in `docs/play-format.md`. Future importers should explicitly convert stage directions into the structured model rather than guessing parenthetical semantics at render time. The 1.1 bundled play is generated from structured source data supplied by the user for this project.

## Release process

Every PR merged to `master` is one release. The branch must advance `VERSION`, add matching dated sections to `CHANGELOG.en.md` and `CHANGELOG.fa.md`, and pass release validation plus the frontend CI suite.

See `CONTRIBUTING.md`, `AGENTS.md`, and `docs/pull-request-review-deployment.md`.
