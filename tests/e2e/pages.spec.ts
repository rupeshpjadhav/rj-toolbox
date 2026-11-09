import { expect, test } from '@playwright/test';

// Static pages in public/ (AdSense-readiness). Tagged @live so they also run against the deployed site.
const PAGES = [
  { path: '/about/', heading: 'About My Toolbox' },
  { path: '/contact/', heading: 'Contact' },
  { path: '/guides/', heading: 'My Toolbox tool guides' },
  { path: '/privacy-policy/', heading: 'Privacy policy' },
  { path: '/terms/', heading: 'Terms of use' },
];

for (const { path, heading } of PAGES) {
  test(`@live ${path} loads with its own title and heading`, async ({ page }) => {
    const response = await page.goto(path);
    expect(response?.status()).toBe(200);
    await expect(page.locator('h1')).toHaveText(heading);
    expect(await page.title()).not.toBe('My Toolbox - All-in-One Online Tools');
    await expect(page.locator('header a[href="/privacy-policy/"]')).toBeVisible();
  });
}

test('@live the home page header links to every public page', async ({ page }) => {
  await page.goto('/');
  for (const { path } of PAGES) {
    await expect(page.locator(`header a[href="${path}"]`).first()).toBeVisible();
  }
});

test('@live the home page reserves space for two ad slots', async ({ page }) => {
  await page.goto('/');
  for (const slot of ['top', 'bottom']) {
    const box = await page.locator(`aside[data-ad-slot="${slot}"]`).boundingBox();
    expect(box, `ad slot ${slot} exists`).not.toBeNull();
    expect(box!.height).toBeGreaterThanOrEqual(90);
  }
});

test('@live sitemap lists the public pages and robots.txt points to it', async ({ request }) => {
  const sitemap = await request.get('/sitemap.xml');
  expect(sitemap.status()).toBe(200);
  const xml = await sitemap.text();
  for (const { path } of PAGES) expect(xml).toContain(`https://rj-toolkit.com${path}`);

  const robots = await request.get('/robots.txt');
  expect(robots.status()).toBe(200);
  expect(await robots.text()).toContain('Sitemap: https://rj-toolkit.com/sitemap.xml');
});

test('@live guides cover all ten tools and the converter formats', async ({ page }) => {
  await page.goto('/guides/');
  await expect(page.locator('section.tool h2')).toHaveCount(10);
  await expect(page.locator('#data-converter')).toContainText('XML');
  await expect(page.locator('#data-converter')).toContainText('Column');
});

test('@live privacy policy has no analytics or unverified consent claims', async ({ page }) => {
  await page.goto('/privacy-policy/');
  await expect(page.getByRole('heading', { name: 'Analytics' })).toHaveCount(0);
  await expect(page.getByText('Google-certified consent')).toHaveCount(0);
});

test('@live about page only links to LinkedIn for contact', async ({ page }) => {
  await page.goto('/about/');
  await expect(page.locator('main a[href*="linkedin.com"]')).toHaveCount(1);
  await expect(page.locator('main a[href="mailto:rupeshpjadhav@gmail.com"]')).toHaveCount(1);
  await expect(page.locator('main a[href*="youtube.com"]')).toHaveCount(0);
  await expect(page.locator('main a[href*="travel.rupeshjadhav.com"]')).toHaveCount(0);
});

test('@live contact page lists LinkedIn and email, without YouTube', async ({ page }) => {
  await page.goto('/contact/');
  await expect(page.locator('main a[href*="linkedin.com"]')).toHaveCount(1);
  await expect(page.locator('main a[href="mailto:rupeshpjadhav@gmail.com"]')).toHaveCount(1);
  await expect(page.locator('main a[href*="youtube.com"]')).toHaveCount(0);
});

test('@live AdSense verification: meta tag on the homepage and ads.txt are served', async ({ page, request }) => {
  await page.goto('/');
  await expect(page.locator('meta[name="google-adsense-account"]')).toHaveAttribute('content', 'ca-pub-1981273968189802');
  const ads = await request.get('/ads.txt');
  expect(ads.status()).toBe(200);
  expect(await ads.text()).toContain('google.com, pub-1981273968189802, DIRECT, f08c47fec0942fa0');
});

test('@live every page includes the AdSense Auto ads script', async ({ page }) => {
  for (const path of ['/', '/about/', '/contact/', '/guides/', '/privacy-policy/', '/terms/']) {
    await page.goto(path);
    await expect(page.locator('script[src*="adsbygoogle.js?client=ca-pub-1981273968189802"]')).toHaveCount(1);
  }
});

test('@live styles come from the build, not the Tailwind CDN', async ({ page }) => {
  const cdnRequests: string[] = [];
  page.on('request', r => { if (r.url().includes('cdn.tailwindcss.com')) cdnRequests.push(r.url()); });
  await page.goto('/');
  await expect(page.locator('h1').first()).toBeVisible();
  // index.html sets body to bg-slate-900 (Tailwind); this only holds if the compiled CSS loaded.
  const bg = await page.locator('body').evaluate(el => getComputedStyle(el).backgroundColor);
  // Tailwind v4 writes colours as oklch(); 0.208 is slate-900.
  expect(bg).toMatch(/^oklch\(0\.208/);
  expect(cdnRequests).toEqual([]);
});

test('@live footers name the tech stack', async ({ page }) => {
  for (const path of ['/', '/guides/', '/about/']) {
    await page.goto(path);
    await expect(page.getByText('Built with React, TypeScript, Vite and Tailwind CSS.')).toBeVisible();
  }
});
