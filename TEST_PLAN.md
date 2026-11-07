# MyToolbox (rj-toolkit.com) — Test Plan

Nov 7, 2026 · @Rupesh

## 1. Scope and system under test

MyToolbox is a client-only React 19 + Vite 6 app with 10 tools, no backend and no tests today. This plan adds three test layers: logic (unit), a new backend API, and UI/E2E. It also covers the non-functional checks needed before AdSense.

**Architecture today.** One page (`App.tsx`) switches tools with React state; there is no URL routing. All processing runs in the browser. Production is the static `dist/` build on Hostinger shared hosting at rj-toolkit.com. `@google/genai` is installed and the Vite config injects `GEMINI_API_KEY`, but no component calls Gemini. The deployed bundle contains no key.

| # | Tool | Component | Core logic / library | Inputs and options |
| --- | --- | --- | --- | --- |
| 1 | Test Data Generator | TestDataGenerator.tsx | @faker-js/faker | Row count, columns + data type, output JSON / CSV / XML / HTML / SQL / Python / JavaScript, copy, download |
| 2 | Random Generator | RandomGenerator.tsx | Math.random | Password length + character sets, key types, copy |
| 3 | Data Converter | FormatConverter.tsx, formatDetector.ts | d3-dsv, custom XML | Column / CSV / TSV / JSON in and out, auto-detect, quote style, quote-all, file upload, download |
| 4 | JavaScript Toolkit | JavaScriptToolkit.tsx | terser | Minify with ES5–latest target, syntax validation, upload, download |
| 5 | JSON Toolkit | JSONToolkit.tsx | JSON, new Function | Stringify a JS object, beautify, indent 2 / 4 / 8, upload, download |
| 6 | SQL Formatter | SqlQueryAnalyzer.tsx | sql-formatter | Dialect (SQL, MySQL, PostgreSQL, T-SQL), keyword case, indent 2 / 4, format, minify, swap, clear |
| 7 | Difference Checker | DifferenceChecker.tsx | diff (diffLines) | Two texts or file uploads, live line diff |
| 8 | Case Converter | CaseConverter.tsx | custom | lowercase, UPPERCASE, Title Case, copy |
| 9 | Text Styler | TextStyler.tsx | custom regex | camelCase, PascalCase, snake\_case, kebab-case, Capitalized Case |
| 10 | YAML Validator | YamlValidatorTool.tsx | js-yaml | Validate syntax, show error |

**In scope:** all 10 tools, the proposed `/api/v1` backend (section 5), the shell (header, tool nav, footer, SEO tags) and the production deploy. **Out of scope:** load beyond 50 virtual users, native mobile apps, and the AdSense ad code itself until it is added.

**Code-review findings that drive test priority** (full defect list in section 8):

- JSON Toolkit's Stringify runs the pasted input through `new Function('return ' + input)()`. Any JavaScript a user pastes is executed in the page. This is a security risk and P1 to fix and test.
- Random Generator says "secure passwords" but uses `Math.random`, which is not cryptographically secure.
- `js-yaml` is imported but not listed in package.json; it only arrives as a transitive dependency.
- The Vite config still injects the Gemini key into the client build. If an AI feature is added, the key will ship to every browser.

## 2. Test strategy and tooling

Most coverage goes in fast logic tests, a thinner API layer checks the same logic over HTTP, and a small E2E layer proves each tool works in real browsers. All layers run on every pull request; the slow non-functional checks run nightly and before each release.

The key design choice is one shared logic library (`src/lib/`) used by both the UI and the new API. Logic tests then cover both surfaces, API tests check only HTTP behaviour, and E2E tests check only wiring and UX.

| Layer | What it proves | Tool | Approx. cases | Runs |
| --- | --- | --- | --- | --- |
| Logic / unit | Every conversion, format and validation rule, edge cases, error messages | Vitest + fast-check (property tests) | 160 | Every commit, under 30 s |
| Component | Each tool renders, reacts to input, shows errors | Vitest + React Testing Library + jsdom | 40 | Every commit |
| API | Contract, status codes, validation, limits, security headers | Playwright APIRequestContext + Ajv (JSON Schema) | 90 | Every PR, against a local server |
| UI / E2E | Real user flows per tool, copy, upload, download, navigation | Playwright (Chromium, Firefox, WebKit, Pixel 7, iPhone 14) | 60 × 5 projects | Every PR (Chromium), nightly (all) |
| Visual | No unintended layout change | Playwright toHaveScreenshot | 20 | Nightly |
| Accessibility | WCAG 2.2 AA | @axe-core/playwright | 11 pages | Every PR |
| Performance / SEO | Lighthouse scores, bundle size | Lighthouse CI, size-limit | 11 pages | Every PR |
| Load | API holds under traffic | k6 | 4 scenarios | Before release |
| Security | Headers, injection, dependency CVEs | OWASP ZAP baseline, npm audit, Semgrep | Whole site | Nightly |

**Test data.** Fixtures live in `tests/fixtures/` as real files: valid, invalid and edge-case CSV, TSV, JSON, XML, YAML, SQL and JS, plus a 5 MB CSV and a 1 MB JSON for size limits. Faker and the random generator take an injectable seed, so generated output is deterministic in tests.

**Environments.** Local (`vite` on port 3000 plus the API on port 8787), CI (the same, started by Playwright's `webServer`), and production smoke tests against https://rj-toolkit.com after each deploy.

## 3. Prerequisites: changes that make the app testable

Five code changes come before the tests, because today the logic is locked inside React components and the app has one URL. Each also helps SEO or monetization.

1. **Extract pure logic into `src/lib/`.** One module per tool, with no React imports:
   - `case.ts`: toLower, toUpper, toTitleCase
   - `textStyle.ts`: toCamel, toPascal, toSnake, toKebab, toCapitalized
   - `dataConvert.ts`: detectFormat, parseData, formatData, parseXml, formatXml, validateInput
   - `json.ts`: beautify, stringify (safe), validate
   - `sql.ts`: formatSql, minifySql
   - `js.ts`: minifyJs, validateJs
   - `diff.ts`: lineDiff
   - `yaml.ts`: validateYaml
   - `random.ts`: password, keys (crypto.getRandomValues, injectable RNG)
   - `testData.ts`: generate(columns, rows, format, seed)
2. **Add URL routing**, one path per tool, e.g. `/json-formatter` and `/sql-formatter`, with prerendered HTML for each route. E2E tests can deep-link to a tool, and Google can index 10 pages instead of one.
3. **Add stable selectors:** `data-testid` on every input, option, action button, output, error banner and copy/download control, named `<tool>-<element>` (e.g. `sql-input`, `sql-format-btn`, `sql-error`). Add `aria-label` where a button has only an icon.
4. **Make errors return data, not just text in state.** Each lib function returns `{ ok: true, value }` or `{ ok: false, code, message, line?, column? }`. Tests assert on `code`; the UI and the API both map it to a message.
5. **Clean the build.** Add `js-yaml` to dependencies. Remove the Gemini `define` from vite.config.ts and the unused importmap and Tailwind CDN script from index.html. Delete the empty JavaScriptToolkitNew.tsx and the unused JsonValidator.tsx. Add `test`, `test:api`, `test:e2e` and `lint` scripts.

## 4. Logic (unit) test cases

These are the representative cases per tool; each row becomes a parameterised Vitest table, so the full suite is about 160 cases. P1 = blocks release, P2 = fix before the next release, P3 = nice to have. Rows marked *expected fail* reproduce a defect found in code review; they stay red until the fix lands.

| ID | Tool | Case | Expected | Pri |
| --- | --- | --- | --- | --- |
| U-CC-01 | Case Converter | `hello WORLD` to lower / upper / title | `hello world` / `HELLO WORLD` / `Hello World` | P1 |
| U-CC-02 | Case Converter | Title Case with apostrophes and digits: `it's 2nd test` | `It's 2nd Test` | P2 |
| U-CC-03 | Case Converter | Unicode: `école über`, Turkish `i`, emoji | Case changes per locale, emoji unchanged, no exception | P2 |
| U-CC-04 | Case Converter | Empty string, whitespace only, 1 MB input | Returns the same shape, under 200 ms for 1 MB | P2 |
| U-TS-01 | Text Styler | `hello world again` to all 5 styles | `helloWorldAgain`, `HelloWorldAgain`, `hello_world_again`, `hello-world-again`, `Hello World Again` | P1 |
| U-TS-02 | Text Styler | Mixed input `XMLHttpRequest userID` to snake / kebab | `xml_http_request_user_id` / `xml-http-request-user-id` | P2 |
| U-TS-03 | Text Styler | camelCase of `hello-world_value` | `helloWorldValue` (*expected fail*: the hyphen and underscore are kept today) | P2 |
| U-TS-04 | Text Styler | Property: snake(x) contains only `[a-z0-9_]` for any ASCII x | Holds for 1,000 generated inputs (fast-check) | P3 |
| U-DC-01 | Data Converter | detectFormat on CSV, TSV, JSON array, JSON object, single column | `CSV`, `TSV`, `JSON`, `JSON`, `Column` | P1 |
| U-DC-02 | Data Converter | detectFormat on CSV with commas inside quotes | `CSV`; quoted commas do not count as delimiters | P1 |
| U-DC-03 | Data Converter | Round trip CSV to JSON to CSV for a 3×5 fixture | Output equals input byte for byte | P1 |
| U-DC-04 | Data Converter | Every in/out pair (Column, CSV, TSV, JSON: 16 pairs) | Each pair matches its golden file | P1 |
| U-DC-05 | Data Converter | Quote styles none / single / double / custom \` | \`, quote-all on and off | Only values containing delimiter, quote or newline are quoted when quote-all is off |
| U-DC-06 | Data Converter | Field with embedded `"`, newline and comma | RFC 4180 escaping (`""`), row count unchanged | P1 |
| U-DC-07 | Data Converter | CSV with an inconsistent column count on line 4 | Error `CSV_COLUMNS`, line 4 | P1 |
| U-DC-08 | Data Converter | Invalid JSON (trailing comma) | Error `JSON_PARSE` with line and column | P1 |
| U-DC-09 | Data Converter | Nested JSON objects to CSV | Clear error or flattened `a.b` columns; never silent data loss | P2 |
| U-DC-10 | Data Converter | XML with attributes, entities `&amp;`, CDATA | Parsed values unescaped; output re-escaped | P2 |
| U-DC-11 | Data Converter | 5 MB CSV (50,000 rows) | Converts in under 2 s, no crash | P2 |
| U-JS-01 | JSON Toolkit | Beautify valid JSON with indent 2, 4 and 8 | Matches `JSON.stringify(x, null, n)` | P1 |
| U-JS-02 | JSON Toolkit | Beautify invalid JSON | Error with line and column; no output | P1 |
| U-JS-03 | JSON Toolkit | Stringify a JS object literal `{a:1, 'b':[2,3]}` | `{"a":1,"b":[2,3]}` | P1 |
| U-JS-04 | JSON Toolkit | Stringify input `(()=>{globalThis.pwned=1; return {}})()` | Rejected; `globalThis.pwned` stays undefined (*expected fail*: code runs today) | P1 |
| U-JS-05 | JSON Toolkit | Big numbers, unicode escapes, deep nesting (1,000 levels) | No precision loss reported silently; no stack overflow crash | P2 |
| U-SQL-01 | SQL Formatter | Sample query in each of 4 dialects | Matches golden file per dialect | P1 |
| U-SQL-02 | SQL Formatter | Keyword case upper / lower, indent 2 / 4 | Keywords cased; indent width correct | P1 |
| U-SQL-03 | SQL Formatter | Minify a multi-line query with comments | Single line; string literals and `--` comments handled safely | P1 |
| U-SQL-04 | SQL Formatter | Empty input; unbalanced parentheses | Error `EMPTY`; parse error message, no crash | P1 |
| U-SQL-05 | SQL Formatter | Dialect-specific syntax: T-SQL `[brackets]`, Postgres `::cast`, MySQL backticks | Preserved | P2 |
| U-JT-01 | JavaScript Toolkit | Minify valid ES2020 code with target ES5 and latest | Output runs and gives the same result as input (eval in a Node vm sandbox) | P1 |
| U-JT-02 | JavaScript Toolkit | Syntax error input | Error with line and column; no output | P1 |
| U-JT-03 | JavaScript Toolkit | Validate does not execute code: input `globalThis.x=1` | `globalThis.x` stays undefined | P1 |
| U-DF-01 | Difference Checker | Identical texts; one line changed; line added; line removed | 0 changes; 1 removed + 1 added; 1 added; 1 removed | P1 |
| U-DF-02 | Difference Checker | CRLF vs LF line endings | Documented behaviour (treated equal, or flagged) | P2 |
| U-YM-01 | YAML Validator | Valid GitHub Actions workflow; anchors and aliases; multi-document `---` | Valid | P1 |
| U-YM-02 | YAML Validator | Tab indentation; duplicate key; bad indent | Error with line and column | P1 |
| U-YM-03 | YAML Validator | Billion-laughs alias bomb | Rejected quickly, no browser hang | P2 |
| U-RG-01 | Random Generator | Password length 4, 16, 128 with each charset combination | Exact length; only chosen sets; at least one char from each chosen set | P1 |
| U-RG-02 | Random Generator | Source of randomness | Uses `crypto.getRandomValues` (*expected fail*: Math.random today) | P1 |
| U-RG-03 | Random Generator | 10,000 passwords | No duplicates; chi-square on character frequency passes at p > 0.01 | P2 |
| U-RG-04 | Random Generator | No charset selected; length 0 or negative | Clear validation error | P2 |
| U-TD-01 | Test Data Generator | Same seed twice | Identical output | P1 |
| U-TD-02 | Test Data Generator | Each of 7 output formats for 3 columns × 5 rows | JSON parses; CSV has 6 lines; XML is well formed; SQL has 5 INSERTs; Python and JS parse | P1 |
| U-TD-03 | Test Data Generator | Values with quotes, `<`, `&` in each format | Correctly escaped per format (no broken SQL, XML or HTML) | P1 |
| U-TD-04 | Test Data Generator | 0 rows, 1 row, 10,000 rows, 0 columns | Empty-valid output or validation error; 10,000 rows in under 3 s | P2 |

## 5. Backend API test plan

There is no backend today, so this plan proposes a small REST API, `/api/v1`, built on the shared `src/lib/` code and run as a Node.js app (Hono or Express) on Hostinger. It has three uses: it gives the API test layer a real target, it can be sold as a paid developer API (a second income stream next to ads), and it is the safe place to call Gemini later without exposing the key.

### 5.1 Proposed endpoints

| Method + path | Body (JSON) | Success (200) | Main errors |
| --- | --- | --- | --- |
| POST /api/v1/convert | `input`, `from`, `to`, `quoteStyle`, `quoteAll` | `{ output, rows, warnings[] }` | 400 VALIDATION, 422 PARSE\_ERROR |
| POST /api/v1/detect-format | `input` | `{ format }` | 400 |
| POST /api/v1/json/format | `input`, `indent` | `{ output }` | 422 with line, column |
| POST /api/v1/json/validate | `input` | `{ valid, error? }` | 400 |
| POST /api/v1/sql/format | `input`, `dialect`, `keywordCase`, `indent`, `minify` | `{ output }` | 400, 422 |
| POST /api/v1/js/minify | `input`, `ecma` | `{ output, bytesIn, bytesOut }` | 422 |
| POST /api/v1/yaml/validate | `input` | `{ valid, error? }` | 400 |
| POST /api/v1/diff | `a`, `b` | `{ changes: [{ type, value }] , added, removed }` | 400 |
| POST /api/v1/case | `input`, `style` (lower, upper, title, camel, pascal, snake, kebab, capitalized) | `{ output }` | 400 |
| POST /api/v1/random/password | `length`, `sets[]` | `{ password }` | 400 |
| POST /api/v1/test-data | `columns[]`, `rows`, `format`, `seed?` | `{ output }` | 400, 413 |
| GET /api/v1/health | none | `{ status: "ok", version }` | 503 |
| POST /api/v1/ai/\* (later) | tool-specific | Gemini result, key kept server-side | 429, 502, 504 |

All errors share one envelope: `{ error: { code, message, details? } }`. Free use is 60 requests a minute per IP; API-key users get higher quotas. The request body limit is 1 MB.

### 5.2 API test cases

Tests use Playwright's APIRequestContext with a JSON Schema per endpoint (Ajv). Each functional row runs across every endpoint it names.

| ID | Category | Case | Expected | Pri |
| --- | --- | --- | --- | --- |
| A-01 | Contract | Every 200 response validates against its schema | No schema errors; `Content-Type: application/json; charset=utf-8` | P1 |
| A-02 | Contract | Every error validates against the shared error envelope | `code` is a known enum value | P1 |
| A-03 | Parity | For each unit golden file, call the API with the same input | API output equals lib output (one source of truth) | P1 |
| A-04 | Functional | Each endpoint, happy path per option (dialects, styles, formats, indents) | 200 with expected output | P1 |
| A-05 | Validation | Missing required field; wrong type; unknown enum value (`dialect: "oracle"`) | 400 VALIDATION naming the field | P1 |
| A-06 | Validation | Unparseable content (bad JSON, YAML, SQL, JS) | 422 PARSE\_ERROR with line and column | P1 |
| A-07 | Validation | Boundary values: password length 3 / 4 / 128 / 129; rows 0 / 10,000 / 10,001 | Min and max accepted, outside rejected with 400 | P1 |
| A-08 | HTTP | Wrong method (GET on a POST route); unknown route | 405 with `Allow` header; 404 with envelope | P2 |
| A-09 | HTTP | Body not JSON; `Content-Type: text/plain` | 400 or 415, never 500 | P1 |
| A-10 | Limits | Body of 1 MB + 1 byte | 413 PAYLOAD\_TOO\_LARGE | P1 |
| A-11 | Limits | 61 requests in 60 s from one IP | 61st gets 429 with `Retry-After` and `RateLimit-*` headers | P1 |
| A-12 | Auth | Valid, invalid, revoked and missing API key on paid tier | Higher quota; 401; 401; free quota | P2 |
| A-13 | Security | JS payload in `/json/format` and `/js/minify` (`process.exit()`, `require('fs')`) | Never executed; server keeps running | P1 |
| A-14 | Security | Prototype pollution body `{"__proto__":{"admin":true}}` | No effect on later requests | P1 |
| A-15 | Security | YAML alias bomb; regex-heavy input for 5 s CPU (ReDoS) | Rejected or cut off under 2 s; other requests still served | P1 |
| A-16 | Security | Response headers | HSTS, `X-Content-Type-Options: nosniff`, no `X-Powered-By`, CORS limited to rj-toolkit.com | P1 |
| A-17 | Security | Error responses | No stack traces, file paths or library versions | P1 |
| A-18 | Resilience | Gemini upstream returns 500, times out after 10 s, or 429 | 502 / 504 / 429 to client with envelope; no key in logs | P2 |
| A-19 | Determinism | `/test-data` with the same seed twice | Identical output | P2 |
| A-20 | Performance | p95 latency per endpoint at 10 requests/s for 2 min (k6) | p95 under 300 ms, error rate under 0.5% | P2 |
| A-21 | Performance | Soak at 5 requests/s for 30 min; spike to 50 users | No memory growth over 20%; recovers within 30 s | P3 |
| A-22 | Ops | `/health` during deploy | Healthy within 60 s of a new deploy | P2 |

## 6. UI / E2E test cases (Playwright)

E2E tests check that each tool's controls are wired to the logic and that the UX holds; they do not re-test every conversion rule. They use one page object per tool (`tests/e2e/pages/SqlFormatterPage.ts`, and so on), the `data-testid` selectors from section 3, and run on Chromium for each PR and on all 5 browser projects nightly. Clipboard tests grant `clipboard-read` and `clipboard-write` permissions; download tests use `page.waitForEvent('download')` and check the file name and content.

| ID | Area | Scenario | Expected | Pri |
| --- | --- | --- | --- | --- |
| E-SH-01 | Shell | Load `/`; click each of the 10 tool tabs | Active tab highlighted; right tool shown; `<title>` and meta description change per tool | P1 |
| E-SH-02 | Shell | Open each tool URL directly (after routing), reload, use Back / Forward | Same tool shown; history works | P1 |
| E-SH-03 | Shell | Header and footer LinkedIn links | Open in a new tab with `rel="noopener noreferrer"` | P3 |
| E-SH-04 | Shell | Viewport 360 px, 768 px, 1440 px | Nav wraps; no horizontal scroll; textareas usable | P2 |
| E-SH-05 | Shell | Keyboard only: Tab through nav and the active tool | Every control reachable; visible focus ring; Enter and Space activate | P1 |
| E-SH-06 | Shell | Console and network during every test | No console errors; no failed requests (shared fixture fails the test) | P1 |
| E-TD-01 | Test Data Generator | Add 3 columns with types, 10 rows, each of the 7 formats, Generate | Output shown and parses; Download gives `test_data.<ext>` with the same content | P1 |
| E-TD-02 | Test Data Generator | Remove a column; set rows to 0, -1, 100000 | Column gone; invalid counts blocked with a message | P2 |
| E-RG-01 | Random Generator | Set length 24, toggle each charset, Generate, Copy | Shown password matches settings; clipboard holds it; icon changes to a check for 2 s | P1 |
| E-RG-02 | Random Generator | Untick all charsets | Generate disabled or clear error | P2 |
| E-DC-01 | Data Converter | Paste CSV with auto-detect on | Input format switches to CSV; convert to JSON matches fixture | P1 |
| E-DC-02 | Data Converter | Upload `.csv`, `.tsv`, `.json`, `.txt` fixtures | Input filled; detection right; convert works | P1 |
| E-DC-03 | Data Converter | Upload a `.png` and a 5 MB CSV | PNG refused with message; 5 MB converts with no frozen UI over 2 s | P2 |
| E-DC-04 | Data Converter | Wrong input format selected (JSON pasted, CSV chosen) | Error banner with the exact message from validateInput | P1 |
| E-DC-05 | Data Converter | Change quote style and quote-all, convert, Download, Clear | Output and file match; Clear empties input, output and error | P1 |
| E-JT-01 | JSON Toolkit | Paste invalid JSON, Beautify | Error with line; no output | P1 |
| E-JT-02 | JSON Toolkit | Paste JS object, Stringify; Beautify with indents 2, 4, 8 | Correct JSON; indent changes | P1 |
| E-JT-03 | JSON Toolkit | Paste `alert(document.domain)` and Stringify | No dialog opens; error shown (*expected fail* today) | P1 |
| E-JT-04 | JSON Toolkit | Upload `.json`; Download; Copy; Clear | Each works | P2 |
| E-SQL-01 | SQL Formatter | Each dialect × keyword case × indent, Format | Output matches golden file | P1 |
| E-SQL-02 | SQL Formatter | Minify; Swap (output to input); Clear | Single line; swap disabled until output exists; all cleared | P1 |
| E-SQL-03 | SQL Formatter | Empty input; broken query | `Input query is empty.`; `Invalid SQL:` message | P1 |
| E-JS-01 | JavaScript Toolkit | Minify sample with ES5 target; Copy; Download | Output smaller; clipboard and file match | P1 |
| E-JS-02 | JavaScript Toolkit | Syntax error input | Validation panel shows error with line | P1 |
| E-DF-01 | Difference Checker | Edit text B | Diff updates live; added lines green with `+`, removed red with `-` | P1 |
| E-DF-02 | Difference Checker | Upload the same file twice into A | Second upload still loads (input reset works) | P2 |
| E-CC-01 | Case Converter | Each button; Copy | Output correct; copy works; copy hidden while output is empty | P1 |
| E-TS-01 | Text Styler | Type into input | All 5 outputs update on each keystroke; clicking an output selects its text | P1 |
| E-YM-01 | YAML Validator | Validate the default sample; break indentation and validate | Green `YAML syntax is valid!`; red error with message | P1 |
| E-SM-01 | Production smoke | After each deploy, on https://rj-toolkit.com: load, 1 happy path per tool, `/api/v1/health` | All pass in under 3 min; failure alerts by email | P1 |

## 7. Non-functional and monetization-readiness checks

Each check has a pass threshold that fails the build when it is missed; the thresholds are set to what AdSense review and Google search ranking reward.

| ID | Area | Check | Pass threshold | Tool | Pri |
| --- | --- | --- | --- | --- | --- |
| N-CB-01 | Cross-browser | Full E2E suite | 100% pass on Chromium, Firefox, WebKit, Pixel 7, iPhone 14 | Playwright projects | P1 |
| N-A11Y-01 | Accessibility | axe scan of the home page and each tool page, before and after an action | 0 serious or critical violations | @axe-core/playwright | P1 |
| N-A11Y-02 | Accessibility | Labels tied to inputs; icon buttons named; slate-500 footer text contrast | All inputs labelled; contrast at least 4.5:1 | axe + manual | P2 |
| N-PERF-01 | Performance | Lighthouse mobile on each tool page | Performance 85 or more; LCP under 2.5 s; CLS under 0.1; TBT under 200 ms | Lighthouse CI | P1 |
| N-PERF-02 | Performance | Main JS bundle (gzipped) | Under 250 KB on first load; faker, terser and sql-formatter lazy-loaded per tool (today one 3.9 MB bundle) | size-limit | P1 |
| N-PERF-03 | Performance | Typing in Text Styler and Difference Checker with 10,000 lines | Input stays responsive (no long task over 200 ms) | Playwright trace | P3 |
| N-SEC-01 | Security | No `eval` / `new Function` on user input in client code | 0 findings | Semgrep / ESLint `no-new-func` | P1 |
| N-SEC-02 | Security | Content-Security-Policy without `unsafe-eval`; security headers on the static site | Header present; securityheaders.com grade A | ZAP baseline | P1 |
| N-SEC-03 | Security | No secrets in the built bundle | No key patterns (`AIza`, `sk-`, tokens) in `dist/` | gitleaks on `dist/` | P1 |
| N-SEC-04 | Security | Dependencies | 0 high or critical CVEs | npm audit, Dependabot | P1 |
| N-PRIV-01 | Privacy | Tool input never leaves the browser (until the API is used on purpose) | No network request carries the input text | Playwright network spy | P1 |
| N-SEO-01 | SEO | Each tool URL returns prerendered HTML with a unique title, description, canonical and H1 | Present in raw HTML, not only after JS runs | Playwright `request.get` | P1 |
| N-SEO-02 | SEO | `robots.txt`, `sitemap.xml` with 10 tool URLs, Open Graph image | All return 200; `og:url` is not `yourdomain.com` | API test | P1 |
| N-SEO-03 | SEO | Lighthouse SEO and Best Practices | 95 or more each | Lighthouse CI | P2 |
| N-AD-01 | AdSense | Privacy Policy, Terms, About and Contact pages linked in the footer | All reachable, 200, real content | E2E | P1 |
| N-AD-02 | AdSense | `/ads.txt` | 200, `text/plain`, contains the publisher ID line | API test | P1 |
| N-AD-03 | AdSense | Cookie consent (Google-certified CMP) for EU / UK visitors | Ads load only after consent in an EU geolocated test | Playwright with locale + geolocation | P1 |
| N-AD-04 | AdSense | Ad slots after ads go live | CLS stays under 0.1 with reserved slot heights; ads never cover tool controls or outputs | Lighthouse + visual tests | P2 |
| N-AD-05 | Analytics | GA4 page\_view per tool route and a `tool_used` event per action | Events seen in the network log | Playwright network spy | P2 |

## 8. Delivery: structure, CI, criteria, schedule and defects

### 8.1 Project structure

```
MyToolbox/
  src/lib/              shared logic (UI + API)
  src/components/       React tools
  server/               /api/v1 (Hono), imports src/lib
  tests/
    unit/               Vitest: <tool>.test.ts
    component/          React Testing Library
    api/                Playwright API specs + schemas/*.json
    e2e/                Playwright UI specs
      pages/            page objects, one per tool
    fixtures/           golden input/output files
    perf/               k6 scripts
  playwright.config.ts  projects: api, chromium, firefox, webkit, mobile
  vitest.config.ts      coverage thresholds
  .github/workflows/ci.yml
```

### 8.2 CI pipeline (GitHub Actions)

1. On each pull request: install, lint, typecheck, Vitest with coverage (gate: lines 90%, branches 80% on `src/lib/`).
2. Build the site and the API; start both with Playwright `webServer`.
3. Run the API suite, the Chromium E2E suite, axe, and Lighthouse CI; upload the HTML report and traces as artifacts.
4. Nightly: E2E on all 5 browser projects, visual tests, ZAP baseline, npm audit.
5. On merge to main: deploy to Hostinger with `hosting_deploy` (Git auto-deploy), then run the production smoke suite E-SM-01.
6. Before a release: k6 load scenarios A-20 and A-21.

### 8.3 Entry and exit criteria

**Entry:** section 3 refactors merged; fixtures in place; `npm test` runs locally.

**Exit (release gate):** all P1 cases pass on all 5 browser projects; no open P1 defects and no more than 3 open P2 defects; coverage gates met; Lighthouse and axe thresholds from section 7 met; production smoke tests green.

### 8.4 Schedule (part-time, about 10 hours a week)

1. Week 1: section 3 refactors, routing, `data-testid`s, fixtures.
2. Week 2: unit and component suites (section 4); fix D-01 and D-02.
3. Week 3: build `/api/v1` and its API suite (section 5).
4. Week 4: E2E suite (section 6) and CI pipeline.
5. Week 5: non-functional checks, AdSense pages, ads.txt and consent (section 7); apply to AdSense.

### 8.5 Defects found in code review

| ID | Severity | Where | Defect | Covered by |
| --- | --- | --- | --- | --- |
| D-01 | P1 | JSONToolkit.tsx line 42 | Stringify executes pasted input via `new Function` | U-JS-04, E-JT-03, N-SEC-01 |
| D-02 | P1 | RandomGenerator.tsx lines 87–107 | "Secure" passwords and keys use `Math.random` | U-RG-02 |
| D-03 | P1 | App.tsx | One URL for all tools; content rendered only by JS, so search engines see an empty page | E-SH-02, N-SEO-01 |
| D-04 | P2 | Deployed index.html | `og:url` is `https://yourdomain.com/`; `/og-image.png` and `/index.css` missing; Tailwind CDN and an unused AI Studio importmap loaded | N-SEO-02, E-SH-06 |
| D-05 | P2 | Build | One 3.9 MB JS bundle with every library | N-PERF-02 |
| D-06 | P2 | vite.config.ts | Gemini key injected into client code at build time | N-SEC-03 |
| D-07 | P2 | package.json | `js-yaml` used but not declared; no test or lint scripts | Build check |
| D-08 | P2 | TextStyler.tsx | camelCase and PascalCase keep `-` and `_` | U-TS-03 |
| D-09 | P3 | Repo | Empty JavaScriptToolkitNew.tsx, unused JsonValidator.tsx; README lists 3 components that do not exist | n/a (cleanup) |
