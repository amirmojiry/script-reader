# Changelog

All notable changes to this project are documented here. The project follows Keep a Changelog and Semantic Versioning.

## [Unreleased]

## [1.2.0] - 2026-09-17

### Added
- Three complete user-supplied plays by Chista Yasrebi: «بانو و مرد مرده», «جنایت و مکافات», and «عکس دسته جمعی با خانم بزرگ».
- Canonical regression coverage for bundled-play record counts, character lists, validation, ordering, and truncation sentinels.

### Changed
- Bundled-library initialization now supports multiple built-in plays while retaining unrelated user imports and customized role colors.

## [1.1.0] - 2026-09-17

### Added
- Persian-first typography choices with Vazirmatn as the default plus Noto Sans Arabic, Noto Naskh Arabic, Amiri, Lalezar, Katibeh, and Parastoo.
- Dedicated persistent reader settings for font, text size, line spacing, and light/dark theme.
- Complete bundled user-supplied «Horses at the Window» play data in the canonical app format.

### Changed
- Refined reader/library visual hierarchy and spacing for a more polished RTL interface.
- Character dialogue timelines now progress from the right in RTL.

## [1.0.0] - 2026-09-17

### Added
- Initial Vue 3 + TypeScript Script Reader application with library, reader, rehearsal, and table-read modes.
- Structured play schema separating spoken text, inline directions, stage directions, acts, and scenes.
- Character highlighting, configurable role colors, spoken-word statistics, estimated speaking time, role timelines, and scene navigation.
- Reader search, font/spacing/theme controls, per-line bookmarks, and per-line notes.
- Rehearsal cue-only mode plus hidden, first-words, and progressive reveal strategies.
- Validated JSON import/export with untrusted text rendered safely through Vue interpolation.
- IndexedDB persistence, offline PWA caching, optional Screen Wake Lock, and Speech Synthesis for other roles.
- Vitest utility/component tests plus optimized GitHub Pages CI/deployment.
- Agent, contribution, architecture, release, deployment, play-format, and bilingual roadmap documentation.

[Unreleased]: https://github.com/amirmojiry/script-reader/compare/v1.2.0...HEAD
[1.2.0]: https://github.com/amirmojiry/script-reader/compare/v1.1.0...v1.2.0
[1.1.0]: https://github.com/amirmojiry/script-reader/compare/v1.0.0...v1.1.0
[1.0.0]: https://github.com/amirmojiry/script-reader/releases/tag/v1.0.0
