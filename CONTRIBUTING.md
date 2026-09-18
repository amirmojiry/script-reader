# Contributing

## Change lifecycle

All substantive changes use:

```text
issue -> branch -> draft PR -> batched implementation/tests -> self-review -> ready for review -> CI -> explicit merge approval
```

Do not write substantive changes directly to `master`.

Keep the PR in draft during implementation. If a ready PR receives review feedback that requires several file writes or commits, convert it back to draft, batch the fixes, self-review them, and mark it ready again. This prevents every intermediate commit from consuming a full validation run.

## Branch naming

Use a short focused name, for example:

```text
agent/rehearsal-cue-mode
fix/pages-base-path
feature/play-editor
```

## Commit and push discipline

- Prefer one coherent commit/push for a completed implementation or review-fix batch.
- When changing many files through the GitHub API, create blobs/tree data and update the branch ref once instead of using one file-write commit per file.
- Do not split mechanically related edits into remote commits merely because they touch separate files.
- Keep unrelated refactors out of the batch.
- A ready PR still validates every pushed head for safety, so push only reviewable candidate states whenever practical.

## Pull requests

- Link the issue with `Closes #N` only when merge should close it.
- Explain user-visible behavior, architecture impact, tests, release impact, and deployment impact.
- Keep unrelated refactors out of the PR.
- Prefer squash merge for one focused release.
- Draft PRs intentionally skip the validation runner.
- Mark ready only after the candidate is self-reviewed; application-affecting ready PRs run the full frontend validation against GitHub's prospective merge ref.
- Before merging, verify the branch is still current with `master` and lock the merge to the reviewed head SHA.
- A green PR validates the prospective merged tree; deployment occurs only from the resulting push to `master`.

## Release requirements

See `docs/release-and-versioning.md`. Every PR merged to `master`, even docs-only, must advance `VERSION` and both changelogs.

## Local validation

For application changes:

```bash
bash scripts/validate-release-version.sh
npm ci
npm run typecheck
npm run test:run
npm run build
```

The CI equivalent uses `npm run build:ci` after an explicit typecheck so it does not run `vue-tsc` twice.

For documentation-only releases, the CI path only requires release-version validation.

## Frontend standards

- Use TypeScript strict mode.
- Keep domain data in `src/types.ts` and pure calculations in `src/utils` where practical.
- Use semantic HTML and keyboard-accessible controls.
- Use explicit text interpolation for untrusted imported text.
- Preserve RTL behavior and mobile responsiveness.
- Prefer browser-native APIs with capability checks rather than heavy dependencies.

## Tests

Add regression coverage for pure data behavior and interactive behavior affected by the change. Avoid tests that only duplicate implementation details.

Vitest uses Node by default. Component tests that mount Vue components or need browser DOM APIs must opt into jsdom with `// @vitest-environment jsdom`.
