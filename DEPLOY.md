# Deploying My Toolbox

Live site: https://rj-toolkit.com (Hostinger shared hosting, account `u315516985`).

## How it works

1. You push a change to `main` (directly or through a pull request).
2. CI runs the typecheck, unit tests and browser tests.
3. The deploy job waits for your approval in the `production` environment.
4. After approval, the job builds the site and pushes the built files to the `deploy` branch. The branch holds only `index.html`, `favicon.svg`, `assets/` and `sitemap.xml`.
5. Hostinger's Git auto-deployment publishes the `deploy` branch to `public_html`, the web root.
6. The job waits until the live site serves the new build, then runs the live smoke tests.

Source code stays on `main`. Never commit source code to `deploy`. Each deploy overwrites the `deploy` branch with a fresh build.

Workflows: [.github/workflows/ci.yml](.github/workflows/ci.yml), [.github/workflows/deploy.yml](.github/workflows/deploy.yml).

## Making a change

1. Create a branch, make the change, and run `npm run check` (typecheck, unit tests, build, browser tests).
2. Open a pull request. CI must pass before you merge.
3. Merge to `main`. The deploy job starts and waits.
4. Approve the `production` deployment in the Actions tab. This is the "go live" step.
5. Wait for the run to finish. The live smoke test runs last.

## Hostinger settings (already configured)

Websites > rj-toolkit.com > Advanced > Git:
- Repository: `rupeshpjadhav/rj-toolbox`
- Branch: `deploy`
- Root directory: `public_html`
- Auto-deployment: on

If auto-deployment ever shows as off, the site will not update after the deploy job pushes. Turn it back on.

## Rollback

Revert the bad commit on `main`, merge the revert, and approve the deploy. The deploy job rebuilds the previous version and pushes it to `deploy`.

For an urgent rollback, you can open the `deploy` branch on GitHub, find the previous "Deploy build" commit, and use **Redeploy** in hPanel's Git section after setting the branch. Ask for help before doing this, since it is easy to get wrong.

## Running the live tests yourself

```sh
BASE_URL=https://rj-toolkit.com npx playwright test --grep @live     # macOS / Linux
$env:BASE_URL="https://rj-toolkit.com"; npx playwright test --grep @live   # PowerShell
```

## Retired: FTP deploy

Earlier deploys used FTPS to upload `dist/` into `public_html`. That did not reach the web root, so it has been replaced by the Git flow above. The `FTP_SERVER`, `FTP_USERNAME`, `FTP_PASSWORD` and `FTP_SERVER_DIR` secrets and variables are no longer used and can be deleted in GitHub (Settings > Secrets and variables > Actions).

## What the tests cover

- `tests/unit/`: the shared logic in `lib/`, including the Data Converter for all Column/CSV/TSV/JSON/XML pairs.
- `tests/e2e/smoke.spec.ts`: every tool opens without console errors, the Data Converter runs all 25 input/output pairs, and a few happy paths. Tests tagged `@live` also run against the live site.

## Not covered yet

- There is no backend, so there are no API tests. Add an API job when one exists.
- Visual (screenshot) and accessibility checks are not wired in yet.
