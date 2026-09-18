# Pull request, review, and GitHub Pages deployment

## Core rule

`master` is the release/production branch. Draft pull requests are development workspaces and intentionally allocate no validation runner. Review-ready application changes validate fully before merge. A push to `master` does not repeat the already-green PR typecheck/test suite; it validates release metadata, builds the production artifact when application inputs changed, and deploys that artifact to GitHub Pages.

Documentation-only releases remain releases and must advance `VERSION`/changelogs, but they do not install frontend dependencies, run frontend tests, rebuild the application, or redeploy unchanged Pages output.

## Lifecycle

```text
request
  -> issue
  -> focused branch from master
  -> draft PR
  -> batched implementation/tests
  -> self-review
  -> ready for review
  -> one full PR validation when app inputs changed
  -> review
  -> back to draft for multi-change fixes
  -> batched fix commit
  -> ready again
  -> explicit owner approval to merge
  -> squash merge
  -> lightweight master release validation
  -> one production build when app inputs changed
  -> Pages deployment
  -> verify public site
```

## Pull-request triggers

The workflow listens to PR open/reopen/synchronize/ready/draft transitions, but the validation job has a draft guard. Therefore:

- opening a draft PR does not allocate a Linux validation runner;
- commits pushed while the PR remains draft do not allocate the validation runner;
- marking the PR ready starts validation;
- pushing to an already-ready PR starts a new validation run, so multi-file implementation/review fixes should be batched in draft first;
- converting a ready PR back to draft participates in the same concurrency group and cancels a superseded in-progress PR run.

PR concurrency keeps `cancel-in-progress: true` so a newer candidate cancels an older still-running candidate.

## Change classification

After a shallow checkout, CI diffs the candidate against the explicit base commit.

Application-affecting paths are:

```text
src/**
tests/**
public/**
index.html
package.json
package-lock.json
vite.config.ts
tsconfig*.json
```

A ready PR with any of those paths runs the full frontend validation. A docs/process-only PR still runs release-version validation but skips Node setup, `npm ci`, typecheck, tests, and build.

A `master` push with no application-affecting path skips app build, artifact upload, and Pages deployment because the deployed application is unchanged.

## Shallow checkout and release comparison

CI uses `fetch-depth: 2`, not the entire repository history.

For PRs, the exact PR base SHA is fetched with depth 1 and passed to `scripts/validate-release-version.sh` as `RELEASE_BASE_REF`. For `master` pushes, `HEAD^` is available from the two-commit checkout.

The release script still supports `origin/master` as a local fallback, but CI no longer needs a full-history checkout solely for version comparison.

## Review-ready PR validation

For application-affecting changes, one review-ready candidate performs:

1. shallow checkout and exact base fetch;
2. npm cache setup keyed by `package-lock.json`;
3. `npm ci --no-audit --no-fund`;
4. release-version validation;
5. one TypeScript/Vue typecheck;
6. Vitest;
7. one Vite production build via `npm run build:ci`.

`npm run build` remains the full local command (`vue-tsc -b && vite build`). CI calls typecheck explicitly and then `build:ci` so `vue-tsc` is not executed twice.

For docs/process-only changes, only steps 1 and 4 run.

## Master release and Pages deployment

After an authorized squash merge:

1. shallow checkout;
2. classify the merge commit against `HEAD^`;
3. validate the release version;
4. if application inputs changed: set up Node, run `npm ci`, and run `npm run build:ci`;
5. upload the exact `dist` artifact;
6. run the lightweight Pages deploy job.

The `master` path intentionally does not rerun typecheck or tests. Those belong to the exact review-ready PR candidate. The branch must not be stale before merge, and merge authorization should be locked to the reviewed head SHA.

The deploy job itself does not checkout code, install dependencies, test, or rebuild.

## Batch-write discipline

When an automation or coding agent changes many files through GitHub APIs, prefer:

```text
prepare files
  -> create blobs
  -> create one tree
  -> create one commit
  -> update branch ref once
```

Avoid one `create_file`/`update_file` commit per file for a coherent change. On a ready PR, each such commit can trigger another full Actions run.

Small intentional commits are still valid when they represent distinct reviewable states; runner minimization must not be used to hide unrelated changes in one commit.

## Test environment optimization

Vitest defaults to `node`. Pure data, store, validation, and utility tests therefore avoid jsdom startup cost. Vue component tests and tests requiring browser DOM APIs opt in per file with:

```ts
// @vitest-environment jsdom
```

## Existing optimizations retained

- npm download cache keyed by `package-lock.json`;
- `npm ci --no-audit --no-fund`;
- a bounded job timeout;
- PR concurrency cancellation;
- Pages artifact upload only for application-affecting `master` pushes;
- a deploy-only Pages job with no Node/build work.

## Before marking ready

- acceptance criteria met;
- `VERSION` and both changelogs correct;
- committed `package-lock.json` matches dependency changes, if any;
- complete diff self-reviewed;
- no secrets/personal data;
- application changes have appropriate tests;
- PR description matches the actual diff;
- no unresolved review findings;
- branch is current with `master`.

## Merge and deployment

Do not merge a draft, red, pending, stale, or unexpectedly changed PR. Prefer squash merge for a focused release. After merge, monitor the workflow triggered by the new `master` commit; a green PR is validation evidence, while the `master` run owns the production build/deployment.

After an application deployment, verify the public Pages URL and exercise library load, one search, one reader interaction, one rehearsal reveal, and persistence after refresh. For a docs-only release, no Pages redeployment is expected.

## Repository settings

- GitHub Pages source: **GitHub Actions**.
- Default branch: **master**.
- Recommended: protect `master` with required pull requests and the review-ready validation check.
