# Play JSON format

The canonical TypeScript contract lives in `src/types.ts`. Imported JSON is validated before it is stored.

Minimal example:

```json
{
  "id": "my-play",
  "title": "My Play",
  "characters": [
    { "id": "a", "name": "شخصیت الف", "color": "#b5ead7" }
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
              "parts": [
                { "type": "speech", "text": "سلام." },
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
- Character ids must be unique.
- Block ids must be unique across the whole play.
- Every `dialogue.characterId` must reference a declared character.
- Dialogue parts are only `speech` or `direction` and contain non-empty text.
- Standalone directions use `type: "stage-direction"`.
- Display-only headings use `type: "section"` and a `title`.

## Import trust boundary

JSON imports are user-controlled data. Imported strings remain text and are not inserted as raw HTML. Future HTML, DOCX, TXT, or PDF importers must convert into this structure and provide a review/validation step before saving inferred roles or directions.

## Legacy migration note

The original prototype stored both dialogue and directions in one text string and sometimes used malformed `type` values or duplicate object keys. The canonical format intentionally does not preserve those ambiguities. A future migration helper will report and repair them explicitly rather than silently guessing at runtime.
