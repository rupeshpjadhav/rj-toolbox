import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

// Accessibility (N-A11Y-01): no serious or critical WCAG 2.x A/AA violations.
// Tagged @a11y: run with `npm run test:a11y`, not part of `npm run check` until the findings are fixed.
const PAGES = ['/', '/yaml-validator/', '/csv-json-converter/', '/guides/', '/about/', '/contact/', '/privacy-policy/', '/terms/'];

for (const path of PAGES) {
  test(`@a11y ${path} has no serious or critical accessibility violations`, async ({ page }) => {
    await page.goto(path);
    await page.waitForLoadState('networkidle');
    const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();
    const blocking = results.violations.filter(v => v.impact === 'serious' || v.impact === 'critical');
    const summary = blocking.map(v => `${v.id} (${v.impact}, ${v.nodes.length}): ${v.help}`);
    expect(summary).toEqual([]);
  });
}
