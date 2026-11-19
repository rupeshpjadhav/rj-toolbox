import { expect, test, type Page, type Request } from '@playwright/test';

// Browser tests for tools and behaviour that the other specs do not cover.

const openTool = async (page: Page, slug: string) => {
  await page.goto(`/${slug}/`);
  await expect(page.locator('h2').first()).toBeVisible();
};

test.describe('privacy (N-PRIV-01)', () => {
  test('text typed into the converter is never sent over the network', async ({ page }) => {
    const token = 'PRIVACY-TOKEN-7f3a9c';
    const requests: Request[] = [];
    page.on('request', r => requests.push(r));
    await openTool(page, 'csv-json-converter');
    await page.waitForLoadState('networkidle');
    const before = requests.length;

    await page.getByLabel('Input data').fill(`name,city\n${token},NYC`);
    await page.getByRole('button', { name: 'Convert', exact: true }).click();
    await expect(page.getByLabel('Converted output')).toContainText(token);

    const sent = requests.slice(before).filter(r => r.url().includes(token) || (r.postData() ?? '').includes(token));
    expect(sent.map(r => r.url())).toEqual([]);
  });
});

test.describe('lazy loading (N-PERF-02)', () => {
  test('the homepage downloads little JavaScript; faker loads only when Generate is clicked', async ({ page }) => {
    const jsBytes: Record<string, number> = {};
    page.on('response', async r => {
      if (r.url().endsWith('.js')) {
        const body = await r.body().catch(() => Buffer.alloc(0));
        jsBytes[r.url()] = body.length;
      }
    });
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    const initial = Object.values(jsBytes).reduce((a, b) => a + b, 0);
    expect(initial, `initial JS ${Math.round(initial / 1024)} kB`).toBeLessThan(1_000_000);

    await page.getByRole('button', { name: 'Generate Data', exact: true }).click();
    await expect(page.getByLabel('Generated output').or(page.locator('textarea[readonly]').first())).not.toHaveValue('');
    const after = Object.values(jsBytes).reduce((a, b) => a + b, 0);
    expect(after - initial, 'faker chunk loaded on demand').toBeGreaterThan(1_000_000);
  });
});

test.describe('SQL formatter', () => {
  test('formats, minifies and reports errors', async ({ page }) => {
    await openTool(page, 'sql-formatter');
    const input = page.locator('textarea').first();
    const output = page.locator('textarea[readonly]').first();

    await input.fill('select id, name from users where status = 1 order by name');
    await page.getByRole('button', { name: 'Format', exact: true }).click();
    await expect(output).toContainText('SELECT');
    await expect(output).toContainText('\n');

    await page.getByRole('button', { name: 'Minify', exact: true }).click();
    const minified = await output.inputValue();
    expect(minified).not.toContain('\n');
    expect(minified).toContain('SELECT');

    await input.fill('');
    await page.getByRole('button', { name: 'Format', exact: true }).click();
    await expect(page.getByText('Input query is empty.')).toBeVisible();

    await input.fill('SELECT FROM WHERE (');
    await page.getByRole('button', { name: 'Format', exact: true }).click();
    await expect(page.getByText(/Invalid SQL:/)).toBeVisible();
  });
});

test.describe('difference checker', () => {
  test('shows added and removed lines as the text changes', async ({ page }) => {
    await openTool(page, 'diff-checker');
    await page.locator('textarea').nth(1).fill('Changed line\nIt has a second line.\nAnd a third one.\nNew extra line');
    await expect(page.locator('span', { hasText: /^\+$/ }).first()).toBeVisible();
    await expect(page.locator('span', { hasText: /^-$/ }).first()).toBeVisible();
    await expect(page.locator('pre', { hasText: 'New extra line' })).toBeVisible();
  });
});

test.describe('text styler', () => {
  test('converts input to all five styles', async ({ page }) => {
    await openTool(page, 'camel-case-converter');
    await page.locator('input[type="text"]').first().fill('hello-world_value');
    const outputs = page.locator('input[readonly]');
    await expect(outputs.nth(0)).toHaveValue('helloWorldValue');
    await expect(outputs.nth(1)).toHaveValue('HelloWorldValue');
    await expect(outputs.nth(2)).toHaveValue('hello_world_value');
    await expect(outputs.nth(3)).toHaveValue('hello-world-value');
  });
});

test.describe('JSON toolkit', () => {
  test('beautifies, stringifies and explains invalid input', async ({ page }) => {
    await openTool(page, 'json-formatter');
    const input = page.locator('textarea').first();

    await input.fill('{"a":1,"b":[true,null]}');
    await expect(page.getByText('JSON is valid')).toBeVisible();
    await page.getByRole('button', { name: 'Beautify', exact: true }).click();
    await expect(page.locator('pre').first()).toContainText('"a": 1');

    await page.locator('select').first().selectOption('4');
    await page.getByRole('button', { name: 'Beautify', exact: true }).click();
    await expect(page.locator('pre').first()).toContainText('    "a": 1');

    await input.fill("{ a: 1, 'b': [2,3] }");
    await expect(page.getByText(/Valid JavaScript object/)).toBeVisible();
    await page.getByRole('button', { name: 'Stringify', exact: true }).click();
    await expect(page.locator('pre').first()).toHaveText('{"a":1,"b":[2,3]}');

    await input.fill('{"a": 1');
    await expect(page.getByText('JSON is invalid')).toBeVisible();
  });
});

test.describe('YAML validator', () => {
  test('reports a broken YAML document in red', async ({ page }) => {
    await openTool(page, 'yaml-validator');
    await page.locator('textarea').first().fill('key: [unclosed\n  other: 1');
    await page.getByRole('button', { name: 'Validate YAML' }).click();
    await expect(page.getByText(/YAML syntax error/)).toBeVisible();
  });
});

test.describe('JavaScript toolkit', () => {
  test('compresses code and shows the savings', async ({ page }) => {
    await openTool(page, 'javascript-minifier');
    const code = 'function add(first, second) {\n  return first + second;\n}\nconst total = add(1, 2);\n';
    await page.locator('textarea').first().fill(code);
    await page.getByRole('button', { name: 'Compress', exact: true }).last().click();
    const out = await page.locator('textarea[readonly]').first().inputValue();
    expect(out.length).toBeGreaterThan(0);
    expect(out.length).toBeLessThan(code.length);
    await expect(page.getByText('Savings')).toBeVisible();
  });

  test('validate mode flags console statements', async ({ page }) => {
    await openTool(page, 'javascript-minifier');
    await page.getByRole('button', { name: 'Validate', exact: true }).first().click();
    await page.locator('textarea').first().fill('console.log("hi");');
    await page.getByRole('button', { name: 'Validate', exact: true }).last().click();
    await expect(page.getByText('Rule: no-console')).toBeVisible();
  });
});

test.describe('random generator', () => {
  test('password length follows the slider', async ({ page }) => {
    await openTool(page, 'password-generator');
    const slider = page.locator('input[type="range"]');
    await slider.focus();
    for (let i = 0; i < 8; i++) await slider.press('ArrowRight'); // 16 -> 24
    await page.getByRole('button', { name: 'Generate Password', exact: true }).click();
    const password = page.locator('span.font-mono').first();
    await expect(password).not.toHaveText('');
    expect((await password.textContent())?.trim()).toHaveLength(24);
  });

  test('MAC address keys have the XX:XX:XX:XX:XX:XX format', async ({ page }) => {
    await openTool(page, 'password-generator');
    await page.getByRole('button', { name: 'Key Generator', exact: true }).click();
    await page.locator('select').first().selectOption('MAC Address');
    await page.getByRole('button', { name: 'Generate Keys', exact: true }).click();
    const keys = page.locator('span.font-mono');
    await expect(keys).toHaveCount(5);
    for (const key of await keys.allTextContents()) expect(key.trim()).toMatch(/^([0-9A-F]{2}:){5}[0-9A-F]{2}$/);
  });
});

test.describe('test data generator', () => {
  test('generates every output format', async ({ page }) => {
    await openTool(page, 'test-data-generator');
    const formats = ['JSON', 'CSV', 'XML', 'HTML', 'SQL', 'Python', 'JavaScript'];
    const output = page.locator('textarea[readonly]').first();
    // Generation is asynchronous, so wait for this format's marker before reading the output.
    const markers: Record<string, RegExp> = {
      JSON: /^\[/, CSV: /^id,name,email/, XML: /<row>/, HTML: /<table>/,
      SQL: /INSERT INTO generated_data/, Python: /^data = \[/, JavaScript: /^const data =/,
    };
    for (const format of formats) {
      await page.locator('select').first().selectOption(format);
      await page.getByRole('button', { name: 'Generate Data', exact: true }).click();
      await expect(output).toHaveValue(markers[format]);
      const text = await output.inputValue();
      if (format === 'JSON') expect(Array.isArray(JSON.parse(text))).toBe(true);
      if (format === 'CSV') expect(text.split('\n')[0]).toBe('id,name,email');
      if (format === 'XML') expect(text).toContain('<row>');
      if (format === 'HTML') expect(text).toContain('<table>');
      if (format === 'SQL') expect(text).toContain('INSERT INTO generated_data');
      if (format === 'Python') expect(text).toContain('data = [');
      if (format === 'JavaScript') expect(text).toContain('const data =');
    }
  });

  test('downloads the output with a matching file name', async ({ page }) => {
    await openTool(page, 'test-data-generator');
    await page.locator('select').first().selectOption('CSV');
    await page.getByRole('button', { name: 'Generate Data', exact: true }).click();
    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.getByRole('button', { name: 'Download', exact: true }).click(),
    ]);
    expect(download.suggestedFilename()).toBe('test_data.csv');
  });

  test('an empty row count generates one row, not none (regression)', async ({ page }) => {
    await openTool(page, 'test-data-generator');
    await page.locator('input[type="number"]').fill('');
    await page.getByRole('button', { name: 'Generate Data', exact: true }).click();
    const output = page.locator('textarea[readonly]').first();
    await expect(output).toHaveValue(/^\[/);
    const rows = JSON.parse(await output.inputValue());
    expect(rows).toHaveLength(1);
  });
});

test.describe('navigation between tools', () => {
  test('tool links open each tool at its own URL, and back returns', async ({ page }) => {
    await page.goto('/');
    await page.locator('a[href="/password-generator/"]').first().click();
    await expect(page).toHaveURL(/\/password-generator\/$/);
    await expect(page.locator('h2').first()).toHaveText('Random Generator');
    await page.goBack();
    await expect(page).toHaveURL(/\/$/);
  });

  test('a deep link opens the right tool directly', async ({ page }) => {
    await openTool(page, 'yaml-validator');
    await expect(page.locator('h2').first()).toHaveText('YAML Validator');
  });
});

test('every tool name is shown in capitals in the menu and on its card', async ({ page }) => {
  await page.goto('/');
  const tabs = page.locator('nav[aria-label="Tools"] a span');
  await expect(tabs).toHaveCount(10);
  for (const tab of await tabs.all()) {
    expect(await tab.evaluate(el => getComputedStyle(el).textTransform)).toBe('uppercase');
  }
  await page.goto('/yaml-validator/');
  const heading = page.locator('h2').first();
  await expect(heading).toHaveText('YAML Validator');
  expect(await heading.evaluate(el => getComputedStyle(el).textTransform)).toBe('uppercase');
});
