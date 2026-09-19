# Roadmap

## 1.0 — Foundation
- Static Vue/TypeScript PWA on GitHub Pages.
- Structured play schema and validated JSON import/export.
- Read, rehearsal, and table-read modes.
- Cue-only rehearsal with hidden, first-word, and progressive reveal strategies.
- Local persistence, search, notes, bookmarks, role statistics, role colors, Wake Lock, and Speech Synthesis.
- GitHub Pages delivery, tests, and release governance.

## 1.1 — Authoring and migration
- Full in-app play editor.
- Legacy HTML-to-structured-play migration helper.
- Validation report UI for malformed character/type records and duplicate keys.
- Dedicated notes/bookmark browser and difficult-line markers.
- Import conflict handling when a play id already exists.

## 1.2 — Import pipeline
- TXT parser with review screen.
- DOCX import with explicit user confirmation of inferred roles/directions.
- PDF text import where source text is extractable; no silent OCR dependency.

## 1.3 — Rehearsal intelligence
- Configurable cue window and chunk size.
- Per-character voice selection and playback speed.
- Optional Speech Recognition adapter when browser support is reliable enough; manual continuation remains supported.
- Session progress and difficult-line analytics.

## Later
- Shareable play packages without requiring a backend.
- Optional encrypted sync backend only if local-first constraints can be preserved.
