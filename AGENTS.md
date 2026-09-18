# AGENTS.md

These rules govern AI-assisted changes in this repository.

## Read first

Before editing, read:

1. `AGENTS.md`
2. `CONTRIBUTING.md`
3. `docs/README.md`
4. `docs/pull-request-review-deployment.md`
5. `docs/release-and-versioning.md`
6. `.github/workflows/ci-pages.yml`

## Product constraints

- The current product is frontend-only: Vue 3, TypeScript, Vite, Pinia, Vue Router, IndexedDB, PWA.
- Production is GitHub Pages. Do not introduce Laravel, PHP, MySQL, SSH deployment, server credentials, or a backend unless an issue explicitly changes the architecture.
- Local-first is an invariant. Core reading and rehearsal workflows must not require an account or network after assets/data have been stored locally.
- Persian is the primary UI direction. Keep layout responsive and accessible in RTL.
- Never render imported play text with unsanitized `innerHTML`. Prefer Vue text interpolation and explicit structured parts.
- Do not silently infer parentheses as stage directions in the canonical model. Imports may infer only in a reviewable migration layer.

## Required GitHub workflow

1. Verify current `master` and repository documentation.
2. Create a focused GitHub issue with scope and acceptance criteria.
3. Create a focused branch from current `master`; never commit substantive work directly to `master`.
4. Open a draft PR linked to the issue before the implementation batch.
5. Keep the PR in draft while implementation or multi-commit review fixes are in progress.
6. Implement only the issue scope; add/update tests and documentation.
7. Batch coherent multi-file changes before updating the remote branch.
8. Self-review the complete diff.
9. Mark the PR ready for review only when the implementation batch is complete; the ready transition starts full CI for application-affecting changes.
10. Resolve review findings in draft when more than one remote write/commit is expected, then mark ready again for one new validation run.
11. Do not merge unless the repository owner explicitly authorizes the merge.

Do not mention automated coding-product names in PR titles, descriptions, comments, commits, or review requests unless the owner explicitly asks for that wording.

## Actions-minutes discipline

GitHub Actions minutes are a constrained project resource.

- Draft PRs are the normal development state. Heavy validation is intentionally skipped while a PR is draft.
- A ready PR must not receive a stream of intermediate commits. If further implementation or several review fixes are needed, convert it back to draft first.
- When using GitHub API/connector writes, do not call one file-write endpoint per changed file when that creates one commit per file. Prefer creating the required blobs/tree and moving the branch once so a coherent multi-file batch is one commit/push.
- Do not push intermediate commits merely to discover type/test errors when equivalent local or workspace validation is available.
- PR `synchronize` events still validate ready PRs for safety, so batching before branch updates directly saves runner minutes.
- Review-ready PR validation checks GitHub's prospective merge ref (PR head combined with the current base), not the raw head. Before merging, verify the PR is still current with `master` and lock the merge to the reviewed head SHA.
- Documentation-only releases still require release-version validation, but frontend install/typecheck/tests/build are skipped when no application input changed.
- On `master`, CI trusts the green prospective-merge validation for typecheck/tests and does not repeat them; it validates release metadata and performs the production build/deployment only for application-affecting changes.

## Release invariant

Every PR merged to `master` is one production release, including documentation-only changes. Therefore each PR must:

- select PATCH/MINOR/MAJOR impact;
- set `VERSION` to a strict SemVer greater than the version on `master`;
- add equivalent dated sections for that exact version to `CHANGELOG.en.md` and `CHANGELOG.fa.md`;
- keep Unreleased sections for future work;
- update comparison links;
- pass `bash scripts/validate-release-version.sh`.

If another PR merges first and consumes the chosen version, update from `master`, choose a new higher version, and refresh both dated changelog sections before merge.

## Validation minimum

For application-affecting changes, the review-ready candidate must pass:

```bash
bash scripts/validate-release-version.sh
npm ci
npm run typecheck
npm run test:run
npm run build:ci
```

`npm run build` remains the full local safety command and performs both `vue-tsc -b` and `vite build`. CI runs typecheck explicitly and then uses `build:ci` so TypeScript is not checked twice.

For documentation-only changes, release-version validation is the required CI path; frontend install/typecheck/tests/build are intentionally skipped.

Use focused tests during implementation. Do not weaken test coverage merely to reduce runner time.

## Test environments

- Vitest defaults to the Node environment for pure data, store, validation, and utility tests.
- Tests that mount Vue components or require browser DOM APIs must opt into jsdom with `// @vitest-environment jsdom` at the top of the test file.
- Do not make jsdom the global default solely for a small number of component tests.

## Security and privacy

- Never commit secrets, tokens, `.env` files, private keys, personal data, or private play manuscripts without explicit authorization.
- Imported content is untrusted data. Treat it as text, not HTML/code.
- Browser APIs such as speech synthesis and Wake Lock are progressive enhancements; unsupported browsers must retain core reader functionality.
- Do not weaken tests or CI merely to make checks green.

## Handoff

At the end of a session report repository, issue, branch, PR, base/head SHA, implemented behavior, changed files, validation results, CI status, review status, risks, and exact next action. Verify those facts against GitHub rather than relying on chat memory.
