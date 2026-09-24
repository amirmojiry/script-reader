# Play JSON format

The canonical TypeScript contract lives in `src/types.ts`. Imported JSON is validated before it is stored.

Minimal example:

```json
{
  "id": "my-play",
  "title": "My Play",
  "authors": ["نام نویسنده"],
  "translators": ["مترجم اول", "مترجم دوم"],
  "genres": ["درام", "کمدی"],
  "characters": [
    {
      "id": "a",
      "name": "شخصیت الف",
      "color": "#b5ead7",
      "gender": "female"
    }
  ],
  "acts": [
    {
      "id": "act-1",
      "title": "پرده اول",
      "scenes": [
        {
          "id": "scene-1",
          "title": "صحنه اول",
          "blocks": [
            {
              "id": "line-1",
              "type": "dialogue",
              "characterId": "a",
              "characterIds": ["a"],
              "parts": [
                { "type": "speech", "text": "(با تعجب) سلام." },
                { "type": "direction", "text": "مکث" },
                { "type": "speech", "text": "کسی اینجاست؟" }
              ]
            },
            {
              "id": "stage-1",
              "type": "stage-direction",
              "text": "نور کم می‌شود."
            }
          ]
        }
      ]
    }
  ]
}
```

## Required invariants

- `Play.id`, character ids, scene ids, act ids, and block ids should be stable identifiers.
- Imported `Play.id` values must not start with `builtin:`; that namespace is reserved for application-bundled plays and collision-safe bundled migrations.
- Character, act, and scene ids must be unique in their respective play structure.
- Act and scene titles are required.
- Block ids must be unique across the whole play.
- Every `dialogue.characterId` must reference a declared character.
- Joint dialogue may set `dialogue.characterIds` to a unique non-empty array of declared character ids. It must include the primary `characterId`; when omitted, ownership is the single `characterId`.
- Dialogue parts are only `speech` or `direction` and contain non-empty text.
- Standalone directions use `type: "stage-direction"`.
- Display-only headings use `type: "section"` and a `title`.
- Character colors, when present, are literal six-digit hexadecimal colors.
- Character `gender`, when present, is one of `male`, `female`, or `unknown`.
- `authors` and `translators`, when present, are non-empty arrays of non-empty contributor names.
- Legacy `author` and `translator` string fields remain valid. For discovery, slash-separated legacy values are treated as individual contributors, but new curated data with multiple contributors should use the plural arrays.
- Contributor discovery normalizes Persian Arabic/Persian letter variants and treats ordinary whitespace and ZWNJ (half-space) as equivalent for matching/deduplication; the preferred stored spelling is still used for display.
- `genres`, when present, is a non-empty array of non-empty genre names.

## Gender metadata

Every newly curated/bundled play should explicitly classify every character as:

- `male`
- `female`
- `unknown`

If a source does not establish a character's gender, use `unknown`; do not guess solely from an ambiguous role title or name. Older/imported JSON without `gender` remains valid and is treated as `unknown` at runtime.

Gender metadata is casting/discovery metadata. It does not change the dialogue or the identity of the actor who may ultimately perform a role.

## Genre metadata

Every newly curated/bundled play should have at least one useful `genres` value. Add genre metadata during ingestion when the supplied source omits it. Prefer concise Persian discovery labels such as `درام`, `کمدی`, `فلسفی`, `روان‌شناختی`, `خانوادگی`, `ابزورد`, or `ضدجنگ`.

Older/imported JSON without `genres` remains valid for backward compatibility. It simply has no genre filter tags until metadata is added.

## Narrator semantics

Narrator is a virtual reader role and is not stored as a character in `Play.characters`. The narrator reads:

1. every standalone `stage-direction` block;
2. every explicit dialogue `direction` part;
3. every balanced parenthetical segment inside a dialogue `speech` string, for example `(شگفت‌زده بیدار می‌شود)`.

Parenthetical source text remains unchanged in the canonical dialogue. The reader splits it only for presentation, highlighting, narrator statistics, and rehearsal navigation. Unbalanced parentheses are left as ordinary character speech rather than guessed into narration.

Because narrator is virtual, it is not included in the library's character-count/casting totals and may be doubled by one of the actors in a real production.

## Import trust boundary

JSON imports are user-controlled data. Imported strings remain text and are not inserted as raw HTML. Future HTML, DOCX, TXT, or PDF importers must convert into this structure and provide a review/validation step before saving inferred roles or directions.

If a legacy local import already uses an id that collides with a bundled play, initialization preserves the user-owned entry and installs the bundled copy under a deterministic reserved fallback id instead of overwriting the local manuscript.

## Bundled source migration

Bundled plays generated from user-supplied structured source use ordered `dialogue` and `scene_direction` records. Migration creates stable block identifiers and canonical character references while preserving every supplied record in sequence. Source dialogue text is not rewritten when narrator segments are detected.

During ingestion of a new bundled play, also add explicit character gender metadata and one or more useful genres. Unknown gender is preferred over unsupported inference.

## Legacy migration note

The original prototype stored both dialogue and directions in one text string and sometimes used malformed `type` values or duplicate object keys. The canonical format intentionally does not preserve those structural ambiguities. Migration helpers must report or deterministically repair legacy structure rather than silently guessing structural ownership.
