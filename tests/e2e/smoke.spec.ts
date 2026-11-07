import { expect, test, type ConsoleMessage, type Page } from '@playwright/test';

const TOOLS = [
  'Test Data Generator',
  'Random Generator',
  'Data Converter',
  'JavaScript Toolkit',
  'JSON Toolkit',
  'SQL Formatter',
  'Difference Checker',
  'Case Converter',
  'Text Styler',
  'YAML Validator',
];

// Errors that come from third-party tooling, not from this app.
const IGNORED = [/cdn\.tailwindcss\.com should not be used in production/, /React DevTools/];

const collectErrors = (page: Page) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(`uncaught: ${e.message}`));
  page.on('console', (m: ConsoleMessage) => {
    if (m.type() === 'error' && !IGNORED.some((r) => r.test(m.text()))) errors.push(m.text());
  });
  return errors;
};

// Select a tool by its nav button (exact text, so "Data Converter" does not match other buttons).
const openTool = async (page: Page, name: string) => {
  await page.getByRole('button', { name, exact: true }).click();
  await expect(page.locator('h2', { hasText: name }).first()).toBeVisible();
};

test('@live home page loads with a title and all tool tabs', async ({ page }) => {
  const errors = collectErrors(page);
  await page.goto('/');
  await expect(page.locator('h1')).toContainText('Test Data Generator');
  for (const name of TOOLS) {
    await expect(page.getByRole('button', { name, exact: true })).toBeVisible();
  }
  expect(errors).toEqual([]);
});

test('@live every tool opens without errors', async ({ page }) => {
  const errors = collectErrors(page);
  await page.goto('/');
  for (const name of TOOLS) {
    await openTool(page, name);
  }
  expect(errors).toEqual([]);
});

test('@live YAML validator accepts the sample workflow', async ({ page }) => {
  await page.goto('/');
  await openTool(page, 'YAML Validator');
  await page.getByRole('button', { name: 'Validate YAML' }).click();
  await expect(page.getByText('YAML syntax is valid!')).toBeVisible();
});

test('Case converter uppercases the input', async ({ page }) => {
  await page.goto('/');
  await openTool(page, 'Case Converter');
  await page.locator('textarea').first().fill('hello world');
  await page.getByRole('button', { name: 'UPPERCASE' }).click();
  await expect(page.locator('textarea[readonly]').first()).toHaveValue('HELLO WORLD');
});

test('JavaScript validator reports the real line of a syntax error', async ({ page }) => {
  await page.goto('/');
  await openTool(page, 'JavaScript Toolkit');
  await page.getByRole('button', { name: 'Validate', exact: true }).first().click();
  await page.locator('textarea').first().fill('let a = 1;\nlet b = ;\n');
  await page.getByRole('button', { name: 'Validate', exact: true }).last().click();
  await expect(page.getByText(/Line 2:/)).toBeVisible();
});

test('Data converter accepts CSV with a quoted comma', async ({ page }) => {
  await page.goto('/');
  await openTool(page, 'Data Converter');
  await page.locator('textarea').first().fill('name,city\n"Doe, John",NYC\nJane,LA');
  await page.getByRole('button', { name: 'Convert', exact: true }).click();
  await expect(page.getByText(/inconsistent|Error:/)).toHaveCount(0);
  await expect(page.locator('textarea[readonly]').first()).toContainText('Doe, John');
});

test('Test data generator outputs Python without corrupting text', async ({ page }) => {
  await page.goto('/');
  await openTool(page, 'Test Data Generator');
  await page.locator('select').nth(0).selectOption('Python');
  await page.getByRole('button', { name: 'Generate Data', exact: true }).click();
  await expect(page.locator('textarea[readonly]').first()).toContainText('data = [');
});

// Every input -> output pair through the real UI (auto-detect off, so the chosen format is used).
import { SAMPLES, type DataFormat } from '../../lib/dataConvert';
const FORMATS: DataFormat[] = ['Column', 'CSV', 'TSV', 'JSON', 'XML'];
for (const from of FORMATS) {
  for (const to of FORMATS) {
    test(`Data converter UI: ${from} -> ${to}`, async ({ page }) => {
      await page.goto('/');
      await openTool(page, 'Data Converter');
      await page.getByLabel('Auto-detect').uncheck();
      await page.locator('#input-format').selectOption(from);
      await page.locator('#output-format').selectOption(to);
      await page.getByLabel('Input data').fill(SAMPLES[from]);
      await page.getByRole('button', { name: 'Convert', exact: true }).click();
      const output = page.getByLabel('Converted output');
      await expect(output).not.toHaveValue('');
      await expect(page.getByRole('alert')).toHaveCount(0);
      if (to === 'XML') await expect(output).toHaveValue(/<data>/);
      if (to === 'JSON') await expect(output).toHaveValue(/^\[/);
    });
  }
}
