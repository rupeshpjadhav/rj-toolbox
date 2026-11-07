import { describe, expect, it } from 'vitest';
import { toPythonLiteral } from '../../lib/pythonLiteral';

describe('toPythonLiteral', () => {
  it('maps null, true and false only as values (regression)', () => {
    const out = toPythonLiteral([{ word: 'nulla facilisi', flag: true, empty: null }]);
    expect(out).toContain("'nulla facilisi'");
    expect(out).toContain('True');
    expect(out).toContain('None');
    expect(out).not.toContain('Nonea');
  });

  it('escapes quotes, backslashes and newlines', () => {
    expect(toPythonLiteral("it's a\\b\nc")).toBe("'it\\'s a\\\\b\\nc'");
  });

  it('handles empty containers and non-finite numbers', () => {
    expect(toPythonLiteral([])).toBe('[]');
    expect(toPythonLiteral({})).toBe('{}');
    expect(toPythonLiteral(Infinity)).toBe('float("inf")');
  });
});
