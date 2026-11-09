import fs from 'node:fs';
import { expect, test } from '@playwright/test';

// One page per tool, generated at build time by scripts/prerender.mjs from lib/toolPages.json.
// Tagged @live so the deploy pipeline also checks them on https://rj-toolkit.com.

type ToolPage = { slug: string; name: string; title: string; description: string; h1: string };
const { home, tools } = JSON.parse(fs.readFileSync('lib/toolPages.json', 'utf8')) as {
  home: { title: string; h1: string };
  tools: ToolPage[];
};
const SITE = 'https://rj-toolkit.com';
const isLive = Boolean(process.env.BASE_URL);

for (const t of tools) {
  test(`@live /${t.slug}/ is a crawlable page with its own title, H1 and canonical URL`, async ({ page, request }) => {
    // Raw HTML, before any JavaScript runs: this is what a crawler sees first.
    const res = await request.get(`/${t.slug}/`);
    expect(res.status()).toBe(200);
    const html = await res.text();
    expect(html).toContain(`<link rel="canonical" href="${SITE}/${t.slug}/" />`);
    expect(html).toMatch(new RegExp(`<h1[^>]*>${t.h1.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}</h1>`));
    expect(html).toContain('How to use it');
    expect(html).toContain('Frequently asked questions');

    // Rendered page: the title, the H1, structured data, and the tool itself.
    await page.goto(`/${t.slug}/`);
    expect(await page.title()).toBe(t.title.replace(/&amp;/g, '&'));
    await expect(page.locator('h1')).toHaveCount(1);
    await expect(page.locator('meta[name="description"]')).toHaveAttribute('content', t.description);
    const ld = await page.locator('script[type="application/ld+json"]').allTextContents();
    const types = ld.map((j) => JSON.parse(j)['@type']);
    expect(types).toEqual(['WebApplication', 'BreadcrumbList']);
    await expect(page.getByRole('navigation', { name: 'Tools' }).getByRole('link', { name: t.name, exact: true }))
      .toHaveAttribute('aria-current', 'page');
    await expect(page.locator('#root h2').first()).toBeVisible();
  });
}

test('@live home page has its own title, canonical URL and links to every tool page', async ({ page }) => {
  await page.goto('/');
  expect(await page.title()).toBe(home.title);
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', `${SITE}/`);
  for (const t of tools) {
    await expect(page.locator(`section a[href="/${t.slug}/"]`)).toHaveCount(1);
  }
});

test('@live sitemap lists the home page and every tool page', async ({ request }) => {
  const xml = await (await request.get('/sitemap.xml')).text();
  expect(xml).toContain(`<loc>${SITE}/</loc>`);
  for (const t of tools) expect(xml).toContain(`<loc>${SITE}/${t.slug}/</loc>`);
});

test('@live the social share image is served', async ({ request }) => {
  const res = await request.get('/og-image.png');
  expect(res.status()).toBe(200);
  expect(res.headers()['content-type']).toContain('image/png');
});

test('@live the guides link each tool to its own page', async ({ page }) => {
  await page.goto('/guides/');
  for (const t of tools) await expect(page.locator(`a.cta[href="/${t.slug}/"]`)).toHaveCount(1);
});

// These depend on public/.htaccess, which only the live Apache/LiteSpeed server applies.
test('@live unknown pages return a 404 status with the site 404 page', async ({ request }) => {
  test.skip(!isLive, 'only the live server applies .htaccess');
  const res = await request.get('/no-such-page-here/');
  expect(res.status()).toBe(404);
  expect(await res.text()).toContain('Page not found');
});

test('@live www and http addresses redirect permanently to https://rj-toolkit.com', async ({ request }) => {
  test.skip(!isLive, 'only the live server applies .htaccess');
  for (const from of ['https://www.rj-toolkit.com/json-formatter/', 'http://rj-toolkit.com/json-formatter/']) {
    const res = await request.get(from, { maxRedirects: 0 });
    expect(res.status(), from).toBe(301);
    expect(res.headers()['location'], from).toBe(`${SITE}/json-formatter/`);
  }
});
