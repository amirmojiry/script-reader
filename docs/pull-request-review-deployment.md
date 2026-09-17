# Pull request, review, and GitHub Pages deployment

## Core rule

`master` is the release/production branch for this project. Pull requests targeting `master` validate but never deploy. A push to `master` runs the same validation/build path and, after success, uploads that exact `dist` directory to GitHub Pages.

The repository was initially created empty with GitHub's `main` placeholder branch. After the first release is merged, repository settings should make `master` the default branch so the GitHub UI matches this policy. The application workflow itself already targets `master`.

## Lifecycle

```text
request
  -> issue
  -> focused branch from master
  -> draft PR
  -> implement and test
  -> self-review
  -> CI
  -> ready for review
  -> explicit owner approval to merge
  -> squash merge
  -> master CI/build
  -> Pages deployment
  -> verify public site
```

## Validation

The single workflow `.github/workflows/ci-pages.yml` avoids duplicate application builds. Its final review-ready form performs:

1. checkout with full history (needed for release comparison);
2. Node setup with npm cache keyed by `package-lock.json`;
3. `npm ci --no-audit --no-fund`;
4. release-version validation;
5. TypeScript/Vue typecheck;
6. Vitest run;
7. production build;
8. on `master` only, upload the already-built `dist` as the Pages artifact.

A second lightweight deploy job exists only on `master` and calls the official Pages deployment action. It does not check out code, install dependencies, test, or rebuild.

The repository's very first application PR may temporarily run `npm install` once to generate the initial lockfile. That generated lockfile must be committed and the workflow switched to `npm ci` before the PR becomes ready for review.

## Actions-minutes optimization

- One workflow rather than separate CI and Pages build workflows.
- One dependency install and one production build per triggering commit.
- PR concurrency uses `cancel-in-progress: true`, so superseded commits stop consuming runner time.
- npm cache is keyed by the committed lockfile.
- Artifact upload happens only for `master` in the final workflow.
- The deploy job only performs Pages orchestration and normally has no Node install/build work.
- Workflows have a bounded timeout to avoid runaway runner usage.

## Before marking ready

- acceptance criteria met;
- `VERSION` and both changelogs correct;
- committed `package-lock.json` matches `package.json`;
- workflow uses `npm ci`;
- complete diff self-reviewed;
- no secrets/personal data;
- typecheck/tests/build green;
- PR description matches the actual diff;
- no unresolved review findings.

## Merge and deployment

Do not merge a draft, red, pending, stale, or unexpectedly changed PR. Prefer squash merge for a focused release. After merge, monitor the workflow triggered by the new `master` commit; the PR's green workflow is not the production deployment.

After deployment, verify the public Pages URL and exercise library load, one search, one reader interaction, one rehearsal reveal, and persistence after refresh. GitHub Pages has no application database or server migration in this architecture.

## Repository settings required for first production release

- GitHub Pages source: **GitHub Actions**.
- Default branch: **master** after the initial release is available.
- Recommended: protect `master` with required pull requests and the validation check.

These are repository settings, not application code, and may require an administrator to configure them in GitHub settings.
