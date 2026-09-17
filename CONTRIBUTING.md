# Contributing

## Change lifecycle

All substantive changes use:

```text
issue -> branch -> draft PR -> implementation/tests -> self-review -> CI -> ready for review -> explicit merge approval
```

Do not write substantive changes directly to `master`.

## Branch naming

Use a short focused name, for example:

```text
agent/rehearsal-cue-mode
fix/pages-base-path
feature/play-editor
```

## Pull requests

- Link the issue with `Closes #N` only when merge should close it.
- Explain user-visible behavior, architecture impact, tests, release impact, and deployment impact.
- Keep unrelated refactors out of the PR.
- Prefer squash merge for one focused release.
- A green PR validates the candidate; deployment occurs only from the resulting push to `master`.

## Release requirements

See `docs/release-and-versioning.md`. Every PR merged to `master`, even docs-only, must advance `VERSION` and both changelogs.

## Local validation

```bash
bash scripts/validate-release-version.sh
npm ci
npm run typecheck
npm run test:run
npm run build
```

## Frontend standards

- Use TypeScript strict mode.
- Keep domain data in `src/types.ts` and pure calculations in `src/utils` where practical.
- Use semantic HTML and keyboard-accessible controls.
- Use explicit text interpolation for untrusted imported text.
- Preserve RTL behavior and mobile responsiveness.
- Prefer browser-native APIs with capability checks rather than heavy dependencies.

## Tests

Add regression coverage for pure data behavior and interactive behavior affected by the change. Avoid tests that only duplicate implementation details.
