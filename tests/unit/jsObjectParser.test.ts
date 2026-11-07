import { describe, expect, it } from 'vitest';
import { parseJsLiteral } from '../../lib/jsObjectParser';

describe('parseJsLiteral (never executes input)', () => {
  it('parses unquoted keys, single quotes and trailing commas', () => {
    expect(parseJsLiteral("{a:1, 'b':[2,3,],}")).toEqual({ a: 1, b: [2, 3] });
  });

  it('rejects code and does not run it (regression D-01)', () => {
    (globalThis as any).pwned = undefined;
    expect(() => parseJsLiteral('(()=>{globalThis.pwned=1; return {}})()')).toThrow();
    expect((globalThis as any).pwned).toBeUndefined();
  });

  it('keeps a __proto__ key as plain data', () => {
    const value = parseJsLiteral('{"__proto__":{"admin":true}}') as Record<string, unknown>;
    expect(Object.keys(value)).toEqual(['__proto__']);
    expect(({} as any).admin).toBeUndefined();
  });

  it('reports the line and column of an error', () => {
    expect(() => parseJsLiteral('{\n  a: 1,\n  b: foo\n}')).toThrow(/line 3, column 6/);
  });
});
