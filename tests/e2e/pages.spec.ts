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
    await expect(page.locator('footer a[href="/privacy-policy/"]')).toBeVisible();
  });
}

test('@live the home page links to every public page', async ({ page }) => {
  await page.goto('/');
  for (const { path } of PAGES) {
    await expect(page.locator(`footer a[href="${path}"]`).first()).toBeAttached();
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
  await expect(page.locator('main a[href*="youtube.com"]')).toHaveCount(0);
  await expect(page.locator('main a[href*="travel.rupeshjadhav.com"]')).toHaveCount(0);
});
