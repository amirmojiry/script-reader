# Architecture

## Runtime

Script Reader is a client-only Vue 3 application built by Vite and hosted on GitHub Pages.

```text
Vue views/components
       |
Pinia play library + local reader state
       |
Domain Play model ---- pure play utilities/validation
       |
IndexedDB via idb

Browser capability adapters:
- Screen Wake Lock
- Speech Synthesis
- Service Worker / PWA cache
```

There is no server-side runtime in the current architecture.

## Data model

`Play` contains characters and ordered acts/scenes. A scene contains typed blocks:

- `dialogue`: references a character and contains typed `speech`/`direction` parts;
- `stage-direction`: standalone narrator/stage instruction;
- `section`: optional display heading.

The reader never needs to parse parentheses in normal operation. This avoids the legacy ambiguity where directions and literal parentheses were mixed in one string.

## Trust boundary

Imported JSON is untrusted input. `validatePlay()` checks the nested structure, duplicate character/act/scene/block identifiers, referenced characters, known block types, and typed dialogue parts before persistence. Vue interpolation renders user content as text. Application code must not introduce raw `innerHTML` for play content.

## Persistence

IndexedDB stores:

- plays;
- reading state (mode, selected roles, current block, own role);
- reader settings;
- line notes;
- line bookmarks.

A first-run bundled demonstration play is inserted only when no local plays exist. The local database remains the source of truth for imported plays.

## Reader modes

- **Read:** complete ordered document with optional role highlighting and stage-direction visibility.
- **Rehearsal:** own-role navigation, optional cue-only rendering, and hidden/first-word/progressive reveal modes.
- **Table read:** a single current block with previous/next controls.

Search and scene/timeline navigation operate on stable flattened block indexes so all modes share one canonical reading order.

## Offline model

The Vite PWA service worker precaches built assets. IndexedDB stores play content and progress. Once the production application and a play have been loaded/stored, reading and rehearsal do not require the network.

## Progressive enhancement

Wake Lock and Speech Synthesis are checked at runtime. Unsupported browsers do not lose reading, rehearsal, navigation, search, notes, bookmarks, or local persistence.
