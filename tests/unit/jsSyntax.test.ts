import { describe, expect, it } from 'vitest';
import { checkJsSyntax, findEmptyBlockLines } from '../../lib/jsSyntax';

describe('checkJsSyntax', () => {
  it('returns null for valid code', async () => {
    expect(await checkJsSyntax('const x = 1;\nexport default x;')).toBeNull();
  });

  it('returns the real line and column of a syntax error (regression: was always line 1)', async () => {
    const issue = await checkJsSyntax('let a = 1;\nlet b = ;\n');
    expect(issue).not.toBeNull();
    expect(issue!.line).toBe(2);
    expect(issue!.column).toBe(9);
  });

  it('does not execute the code', async () => {
    (globalThis as any).touched = undefined;
    await checkJsSyntax('globalThis.touched = 1;');
    expect((globalThis as any).touched).toBeUndefined();
  });
});

describe('findEmptyBlockLines', () => {
  it('finds every line with an empty block (regression: /g regex skipped lines)', () => {
    expect(findEmptyBlockLines('function a() {}\nfunction b() {}\nfunction c() {}')).toEqual([1, 2, 3]);
  });
});
