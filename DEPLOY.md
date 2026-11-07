# Deploying My Toolbox

Live site: https://rj-toolkit.com (Hostinger shared hosting, account `u315516985`).

## How it works today

- The site is static. `npm run build` writes `dist/`, and the server only has to serve those files.
- Hostinger holds the site in `/home/u315516985/domains/rj-toolkit.com/public_html`.
- It was uploaded by hand from `dist/`. It is not connected to Git, so nothing deploys automatically.
- Leftover on the server: `default.php.orig`. Old asset files also stay after each upload. Both are harmless.

## The pipeline

```
git push to main
   -> CI: typecheck, unit tests, build, browser tests (desktop + Pixel 7)
   -> deploy job waits for your approval (GitHub "production" environment)
   -> upload dist/ to Hostinger over FTPS
   -> live smoke test against https://rj-toolkit.com
```

Pull requests run only the CI job. Nothing deploys from a branch other than `main`.

Workflows: [.github/workflows/ci.yml](.github/workflows/ci.yml), [.github/workflows/deploy.yml](.github/workflows/deploy.yml).

## Daily workflow

1. Make the change on a branch and run `npm run check` (typecheck, unit tests, build, browser tests).
2. Open a pull request. CI must pass before you merge.
3. Merge to `main`. The deploy job starts and waits.
4. Approve the `production` deployment in GitHub Actions. That is the "go live" step.
5. The live smoke test runs. If it fails, the site is already updated, so roll back (below).

## One-time setup

1. **Put the project in Git.** The folder is not a repo yet. Run `git init`, commit, and push to a new GitHub repository. Confirm that `.gitignore` excludes `node_modules/`, `dist/` and the test output folders.
2. **Get the FTP details from hPanel.** Open Files > FTP Accounts and note the server, username and password. Use FTPS if Hostinger offers it.
3. **Add repository secrets** (Settings > Secrets and variables > Actions):
   - `FTP_SERVER`: the FTP host from hPanel
   - `FTP_USERNAME`
   - `FTP_PASSWORD`
4. **Add the repository variable** `FTP_SERVER_DIR`. Upload a test file once to see where the FTP login lands, then set this to the folder that holds `index.html` on the live site (usually `public_html/`). The deploy stops with an error if this is empty.
5. **Create the `production` environment** (Settings > Environments > New environment). Add yourself under Required reviewers. This is what makes the deploy wait for approval.
6. **Protect `main`** (Settings > Branches). Require the CI check to pass before merging.

## Rollback

Revert the bad commit on `main` and push. The pipeline runs the tests and redeploys the previous version. The upload only overwrites changed files, so the rollback takes about a minute.

## Running the live tests yourself

```sh
BASE_URL=https://rj-toolkit.com npx playwright test --grep @live     # macOS / Linux
$env:BASE_URL="https://rj-toolkit.com"; npx playwright test --grep @live   # PowerShell
```

## What the tests cover

- `tests/unit/`: the shared logic in `lib/` (case conversion, the safe JS literal parser, secure random, SQL minify, CSV/TSV column checks, Python output, HTML escaping, JS syntax errors). Each bug fixed in the code review has a regression test.
- `tests/e2e/smoke.spec.ts`: every tool opens with no console errors, plus a happy path for the YAML validator, Case converter, JS validator, CSV converter and Python output. Tests tagged `@live` also run against the live site.

## Not covered yet

- **There is no backend.** The API in `TEST_PLAN.md` section 5 does not exist, so there is nothing to test there. When it is built, add an API test job next to the browser tests.
- Visual (screenshot) and accessibility checks are not wired in yet.
