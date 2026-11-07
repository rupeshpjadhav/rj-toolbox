
# Dev Toolbox

A small collection of lightweight developer utilities implemented as React components and served with Vite. Use this project as a local toolbox for common text, JSON, CSV and SQL tasks.

This repository contains a set of mini-tools in the `components/` folder — each exports a UI card and the logic for a single small utility.

## What's included

| Tool | Component | Shared logic |
| --- | --- | --- |
| Test Data Generator | `TestDataGenerator.tsx` | @faker-js/faker |
| Random Generator | `RandomGenerator.tsx` | `lib/secureRandom.ts` (Web Crypto) |
| Data Converter (Column / CSV / TSV / JSON) | `FormatConverter.tsx`, `formatDetector.ts` | d3-dsv |
| JavaScript Toolkit (minify, validate) | `JavaScriptToolkit.tsx` | terser |
| JSON Toolkit (validate, beautify, JS object to JSON) | `JSONToolkit.tsx` | `lib/jsObjectParser.ts` (safe, never executes input) |
| SQL Formatter | `SqlQueryAnalyzer.tsx` | sql-formatter, `lib/sqlMinify.ts` |
| Difference Checker | `DifferenceChecker.tsx` | diff |
| Case Converter | `CaseConverter.tsx` | |
| Text Styler (camel, Pascal, snake, kebab) | `TextStyler.tsx` | `lib/textCase.ts` |
| YAML Validator | `YamlValidatorTool.tsx` | js-yaml |

`ToolCard.tsx` and `Icons.tsx` are shared UI pieces. Each tool is lazy-loaded as its own chunk.

## Prerequisites

- Node.js (LTS recommended)
- npm (comes with Node.js)

## Tests

- `npm run check` runs everything: typecheck, unit tests, production build and browser tests.
- `npm run test` runs only the unit tests (`tests/unit`).
- `npm run test:e2e` builds the app and runs the browser tests (`tests/e2e`).

## Deploying

Pushes to `main` run the checks, then deploy to Hostinger after a manual approval. See [DEPLOY.md](DEPLOY.md) for setup and rollback.

## Local development

Clone the repo and install dependencies, then run the Vite dev server. The project uses the following npm scripts (from `package.json`):

- `npm run dev` — start the Vite dev server for local development.
- `npm run build` — build a production bundle.
- `npm run preview` — locally preview the production build.
- `npm run typecheck` — run the TypeScript compiler without emitting files.

Quick start:

1. Install dependencies

   ```powershell
   npm install
   ```

2. Start the dev server

   ```powershell
   npm run dev
   ```

3. Open http://localhost:3000 (the port is set in `vite.config.ts`).

## Build and preview production bundle

1. Build

   ```powershell
   npm run build
   ```

2. Preview the built app

   ```powershell
   npm run preview
   ```

## Deployment

This is a static single-page app produced by Vite. You can deploy the output from `npm run build` to any static hosting provider (GitHub Pages, Netlify, Vercel, AWS S3 + CloudFront, Azure Static Web Apps, etc.). General steps:

1. Build the project

   ```powershell
   npm ci; npm run build
   ```

2. Upload the `dist` (or `build`) folder created by Vite to your host. By default Vite outputs to `dist/`.

3. Configure your host to serve `index.html` for SPA routes (most hosts have an option for single-page apps / redirect rules).

Notes for common hosts:

- GitHub Pages: push the `dist/` contents to the `gh-pages` branch or use a deployment action that runs the build and publishes `dist/`.
- Netlify: connect the repo and set the build command to `npm run build` with publish directory `dist`.
- Vercel: import the project and set the framework to `Vite` or use the build command `npm run build`.

## Environment / API keys

This toolbox currently has no required external API keys for the included tools. If you add components that call APIs (for example AI services), store keys in environment variables and never commit them to Git.

## Contributing

Add small, focused utilities as new components in `components/` and export a UI card that can be wired into the app. Keep components decoupled and testable.

## License

Choose a license for your repo (MIT is common for tools). This project currently doesn't declare one in `package.json`.

---

If you'd like, I can also:

- generate short demo screenshots for each tool and add them to the README;
- add a tiny CONTRIBUTING.md with developer setup and component patterns;
- create a GitHub Actions workflow to build & deploy to GitHub Pages/Netlify/Vercel automatically.
