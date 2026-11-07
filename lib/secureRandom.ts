// Cryptographically secure random helpers (Web Crypto API).
// Uses rejection sampling so every character in the charset is equally likely.

const getCrypto = (): Crypto => {
  const c = (globalThis as { crypto?: Crypto }).crypto;
  if (!c || typeof c.getRandomValues !== 'function') {
    throw new Error('Secure random generator (crypto.getRandomValues) is not available in this browser.');
  }
  return c;
};

/** Uniform random integer in [0, max). max must be between 1 and 2^32. */
export const secureRandomInt = (max: number): number => {
  if (!Number.isInteger(max) || max < 1 || max > 0x100000000) {
    throw new RangeError(`max must be an integer between 1 and 2^32, got ${max}`);
  }
  const c = getCrypto();
  const buf = new Uint32Array(1);
  const limit = 0x100000000 - (0x100000000 % max); // largest multiple of max below 2^32
  let x: number;
  do {
    c.getRandomValues(buf);
    x = buf[0];
  } while (x >= limit);
  return x % max;
};

/** Random string of `length` characters drawn uniformly from `charset`. */
export const secureRandomString = (charset: string, length: number): string => {
  const chars = Array.from(charset); // handles multi-byte characters safely
  if (chars.length === 0) throw new Error('Select at least one character set.');
  if (!Number.isInteger(length) || length < 0) throw new RangeError('Length must be a positive whole number.');
  let out = '';
  for (let i = 0; i < length; i++) out += chars[secureRandomInt(chars.length)];
  return out;
};

/** Fisher-Yates shuffle using the secure generator. */
export const secureShuffle = <T,>(items: T[]): T[] => {
  const a = [...items];
  for (let i = a.length - 1; i > 0; i--) {
    const j = secureRandomInt(i + 1);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

/**
 * Password with at least one character from each selected set (when length allows),
 * the remaining characters drawn from the union, then shuffled.
 */
export const securePassword = (sets: string[], length: number): string => {
  const nonEmpty = sets.filter(s => s.length > 0);
  const all = nonEmpty.join('');
  if (!all) throw new Error('Select at least one character set.');
  const required = length >= nonEmpty.length ? nonEmpty.map(s => secureRandomString(s, 1)) : [];
  const rest = secureRandomString(all, length - required.length);
  return secureShuffle([...required, ...Array.from(rest)]).join('');
};
