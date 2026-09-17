# Script Reader

Script Reader is a static, offline-first Vue 3 web application for reading plays, rehearsing roles, and running table reads. It is designed for GitHub Pages and requires no backend, account, or server database.

## Version 1.0 features

- Local play library backed by IndexedDB.
- Structured acts, scenes, dialogue, spoken text, inline directions, and stage directions.
- Character highlighting with configurable colors, dialogue count, spoken-word count/share, estimated speaking time, and clickable role timelines.
- Reader controls for font size, line height, font family, light/dark theme, and stage-direction visibility.
- Full-text search with previous/next result navigation.
- Rehearsal mode with **My role**, next/previous own line, optional cue-only context, and three reveal strategies: hidden, first words, and progressive chunks.
- Table-read mode with one current block at a time.
- Per-line bookmarks and notes.
- JSON import/export with nested schema validation; imported strings are rendered as text, never raw HTML.
- Optional Screen Wake Lock and browser Speech Synthesis for other roles.
- PWA precaching for offline use after the first successful load.
- Responsive RTL-first Persian interface.

The bundled play is intentionally a small demonstration fixture rather than a publication of a complete play. Real play content should be imported in the documented JSON format and used only with appropriate rights.

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

The canonical model is defined in `src/types.ts` and documented in `docs/play-format.md`. Dialogue directions are explicit typed parts instead of being inferred from parentheses. This keeps rehearsal, statistics, accessibility, and future import tooling deterministic.

## Release process

Every PR merged to `master` is one release. The branch must advance `VERSION`, add matching dated sections to `CHANGELOG.en.md` and `CHANGELOG.fa.md`, and pass release validation plus the frontend CI suite.

See `CONTRIBUTING.md`, `AGENTS.md`, and `docs/pull-request-review-deployment.md`.
