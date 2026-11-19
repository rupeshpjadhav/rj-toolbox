import { afterEach, describe, expect, it, vi } from 'vitest';
import { securePassword, secureRandomString } from '../../lib/secureRandom';

afterEach(() => vi.restoreAllMocks());

describe('random generators use the Web Crypto API (U-RG-02)', () => {
  it('draws passwords from crypto.getRandomValues', () => {
    const spy = vi.spyOn(globalThis.crypto, 'getRandomValues');
    const pw = securePassword(['abc', '123'], 20);
    expect(pw).toHaveLength(20);
    expect(spy).toHaveBeenCalled();
  });

  it('draws keys from crypto.getRandomValues', () => {
    const spy = vi.spyOn(globalThis.crypto, 'getRandomValues');
    expect(secureRandomString('XYZ', 8)).toMatch(/^[XYZ]{8}$/);
    expect(spy).toHaveBeenCalled();
  });

  it('gives different results on repeated calls', () => {
    const results = new Set(Array.from({ length: 50 }, () => secureRandomString('abcdefghijklmnopqrstuvwxyz0123456789', 16)));
    expect(results.size).toBe(50);
  });
});
