# Changelog

All notable changes to this project are documented here. The project follows Keep a Changelog and Semantic Versioning.

## [Unreleased]

## [1.8.0] - 2026-09-20

### Added
- Complete user-supplied Persian translations of Woody Allen's «مرگ در می‌زند» and «در نقش سقراط» as bundled library entries, proofread page-by-page against the scanned source.
- Joint-dialogue ownership so simultaneous lines belong to every participating role without synthetic characters.

## [1.6.0] - 2026-09-19

### Added
- Progressive single-page play finder with cast sliders, constrained male/female availability, multi-genre toggles, and live recommendations.
- Sticky reader title/actions and a floating back-to-top control after scrolling.

### Changed
- Library play titles now open the reader directly and genre chips act as filters, replacing the separate open button.
- Reader roles, bookmark, JSON export, and settings actions now use compact accessible icons grouped in the sticky header.

## [1.5.0] - 2026-09-18

### Added
- Narrator role support for standalone stage directions, explicit inline directions, and parenthetical narration inside dialogue.
- Character gender and play genre metadata for discovery and casting.
- Library filters for author, translator, and genre plus sorting by title, duration, and role count.
- Guided play-selection wizard based on available cast, male/female availability, available time, and preferred genre.

### Changed
- Mobile readers open with the roles panel collapsed, with role controls placed where they remain easy to reach.
- Role cards can jump directly to the role's first dialogue.


## [1.4.1] - 2026-09-18

### Changed
- Optimized GitHub Actions so draft PRs allocate no validation runner, documentation-only releases skip frontend work, and review-ready application changes run the full frontend suite only once.
- Review-ready PR checks validate GitHub's prospective merge tree rather than only the raw PR head, while master releases no longer repeat those typechecks/tests; application-affecting releases perform one production Vite build before Pages deployment.
- CI now uses shallow history plus an explicit release base reference instead of fetching the complete repository history.
- Documented batching and draft-review practices to avoid one CI run per intermediate file/commit.

## [1.4.0] - 2026-09-17

### Added
- Complete user-supplied «مهمان ناخوانده» play as a bundled library entry with regression coverage for source fidelity and canonical conversion.

### Changed
- Library play cards now present the three metrics and «باز کردن» action as equal-sized controls.
- Removed the «فرمت ورود» informational box from the library page.

## [1.3.0] - 2026-09-17

### Added
- Dedicated persistent settings page outside individual play readers.
- Library range filters for character count and estimated play duration.

### Changed
- Collapsing the roles panel now removes its layout column so the remaining reader content expands to the full available width.

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

[Unreleased]: https://github.com/amirmojiry/script-reader/compare/v1.8.0...HEAD
[1.8.0]: https://github.com/amirmojiry/script-reader/compare/v1.6.0...v1.8.0
[1.6.0]: https://github.com/amirmojiry/script-reader/compare/v1.5.0...v1.6.0
[1.5.0]: https://github.com/amirmojiry/script-reader/compare/v1.4.1...v1.5.0
[1.4.1]: https://github.com/amirmojiry/script-reader/compare/v1.4.0...v1.4.1
[1.4.0]: https://github.com/amirmojiry/script-reader/compare/v1.3.0...v1.4.0
[1.3.0]: https://github.com/amirmojiry/script-reader/compare/v1.2.0...v1.3.0
[1.2.0]: https://github.com/amirmojiry/script-reader/compare/v1.1.0...v1.2.0
[1.1.0]: https://github.com/amirmojiry/script-reader/compare/v1.0.0...v1.1.0
[1.0.0]: https://github.com/amirmojiry/script-reader/releases/tag/v1.0.0
