import { expect, test } from '@playwright/test';
import { gzipSync } from 'node:zlib';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { extname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

// Checks on the production build in dist/ (built by `npm run test:e2e` before these tests run).
const DIST = fileURLToPath(new URL('../../dist', import.meta.url));
const TEXT = new Set(['.html', '.js', '.css', '.json', '.xml', '.txt', '.svg']);

const walk = (path: string): string[] =>
  statSync(path).isDirectory() ? readdirSync(path).flatMap(n => walk(join(path, n))) : [path];
const textFiles = walk(DIST).filter(f => TEXT.has(extname(f)));
const gzipKb = (file: string) => gzipSync(readFileSync(file)).length / 1024;

// Scripts the homepage loads before the user does anything (module entry + preloads).
const initialScripts = () => {
  const html = readFileSync(join(DIST, 'index.html'), 'utf8');
  return [...html.matchAll(/<(?:script[^>]+src|link[^>]+rel="modulepreload"[^>]+href)="\/?([^"]+\.js)"/g)].map(m => m[1]);
};

test.describe('production build', () => {
  test('ships no API keys or private keys (N-SEC-03)', () => {
    const pattern = /AIza[0-9A-Za-z_-]{30,}|sk-[A-Za-z0-9]{20,}|BEGIN (RSA |EC |OPENSSH )?PRIVATE KEY/;
    const hits = textFiles.filter(f => pattern.test(readFileSync(f, 'utf8')));
    expect(hits.map(f => f.replace(DIST, ''))).toEqual([]);
  });

  test('loads Tailwind from the build, not the CDN', () => {
    const html = readFileSync(join(DIST, 'index.html'), 'utf8');
    expect(html).not.toContain('cdn.tailwindcss.com');
    expect(html).toMatch(/assets\/index-[^"]+\.css/);
  });

  test('keeps the initial JavaScript under 250 kB gzipped (N-PERF-02)', () => {
    const scripts = initialScripts();
    expect(scripts.length).toBeGreaterThan(0);
    const total = scripts.reduce((sum, s) => sum + gzipKb(join(DIST, s)), 0);
    expect(total, `initial JS is ${total.toFixed(1)} kB gzipped`).toBeLessThan(250);
  });

  test('keeps the stylesheet small (about 22 kB before gzip today)', () => {
    const css = walk(join(DIST, 'assets')).filter(f => extname(f) === '.css');
    expect(css.length).toBeGreaterThan(0);
    for (const f of css) expect(gzipKb(f), f).toBeLessThan(15);
  });

  test('loads the large faker library only on demand, not on the homepage', () => {
    const initial = initialScripts();
    const big = walk(join(DIST, 'assets'))
      .filter(f => extname(f) === '.js' && statSync(f).size > 1_000_000)
      .map(f => f.replace(join(DIST, '/'), ''));
    expect(big.length, 'a large lazy chunk exists (faker)').toBeGreaterThan(0);
    for (const chunk of big) expect(initial).not.toContain(chunk);
  });

  test('has a sitemap, robots file and a noindex 404 page', () => {
    expect(readFileSync(join(DIST, 'sitemap.xml'), 'utf8')).toContain('<urlset');
    expect(readFileSync(join(DIST, 'robots.txt'), 'utf8')).toContain('Sitemap:');
    expect(readFileSync(join(DIST, '404.html'), 'utf8')).toMatch(/noindex/);
  });
});
