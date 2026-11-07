import { describe, expect, it } from 'vitest';
import { securePassword, secureRandomString } from '../../lib/secureRandom';

describe('secure random helpers', () => {
  it('returns the requested length from the charset', () => {
    const s = secureRandomString('ab', 50);
    expect(s).toHaveLength(50);
    expect(s).toMatch(/^[ab]+$/);
  });

  it('includes at least one character from every selected set', () => {
    for (let i = 0; i < 50; i++) {
      const pw = securePassword(['ABC', 'abc', '123'], 12);
      expect(pw).toHaveLength(12);
      expect(pw).toMatch(/[A-C]/);
      expect(pw).toMatch(/[a-c]/);
      expect(pw).toMatch(/[1-3]/);
    }
  });

  it('throws when no set is selected', () => {
    expect(() => securePassword([], 8)).toThrow();
  });
});
