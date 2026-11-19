import { describe, expect, it } from 'vitest';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { extname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

// Source files that ship to the browser.
const ROOT = fileURLToPath(new URL('../..', import.meta.url));
const SOURCES = ['App.tsx', 'index.tsx', 'components', 'lib'];

const walk = (path: string): string[] => {
  if (statSync(path).isFile()) return [path];
  return readdirSync(path).flatMap(name => walk(join(path, name)));
};
const files = SOURCES.flatMap(p => walk(join(ROOT, p))).filter(f => /\.(tsx?|ts)$/.test(extname(f)));

const scan = (pattern: RegExp) =>
  files.flatMap(f => {
    const lines = readFileSync(f, 'utf8').split('\n');
    return lines.map((line, i) => ({ f, i: i + 1, line })).filter(x => pattern.test(x.line));
  });

describe('client source is safe to ship', () => {
  it('scans a non-trivial set of files', () => {
    expect(files.length).toBeGreaterThan(20);
  });

  it('never uses eval or the Function constructor on user input (N-SEC-01)', () => {
    expect(scan(/\beval\s*\(|new\s+Function\s*\(/)).toEqual([]);
  });

  it('never injects raw HTML from user input', () => {
    expect(scan(/dangerouslySetInnerHTML|innerHTML\s*=/)).toEqual([]);
  });

  it('contains no API keys or private keys (N-SEC-03)', () => {
    expect(scan(/AIza[0-9A-Za-z_-]{30,}|sk-[A-Za-z0-9]{20,}|BEGIN (RSA |EC |OPENSSH )?PRIVATE KEY/)).toEqual([]);
  });
});
