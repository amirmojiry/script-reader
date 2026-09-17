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
4. Open a draft PR linked to the issue.
5. Implement only the issue scope.
6. Add/update tests and documentation.
7. Run release validation, typecheck, tests, and build.
8. Self-review the complete PR diff and CI result.
9. Mark the PR ready for review only when checks pass and the PR is reviewable.
10. Do not merge unless the repository owner explicitly authorizes the merge.

Do not mention automated coding-product names in PR titles, descriptions, comments, commits, or review requests unless the owner explicitly asks for that wording.

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

```bash
bash scripts/validate-release-version.sh
npm ci
npm run typecheck
npm run test:run
npm run build
```

Use focused tests during implementation, but the review-ready PR must pass the full frontend suite.

## Security and privacy

- Never commit secrets, tokens, `.env` files, private keys, personal data, or private play manuscripts without explicit authorization.
- Imported content is untrusted data. Treat it as text, not HTML/code.
- Browser APIs such as speech synthesis and Wake Lock are progressive enhancements; unsupported browsers must retain core reader functionality.
- Do not weaken tests or CI merely to make checks green.

## Handoff

At the end of a session report repository, issue, branch, PR, base/head SHA, implemented behavior, changed files, validation results, CI status, review status, risks, and exact next action. Verify those facts against GitHub rather than relying on chat memory.
