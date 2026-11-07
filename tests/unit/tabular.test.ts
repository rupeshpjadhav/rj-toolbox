import { describe, expect, it } from 'vitest';
import { checkColumnCount } from '../../lib/tabular';

describe('checkColumnCount (quote-aware)', () => {
  it('accepts CSV with commas inside quoted fields (regression)', () => {
    expect(checkColumnCount('name,city\n"Doe, John",NYC\nJane,LA', 'CSV')).toBeNull();
  });

  it('reports the row with the wrong number of columns', () => {
    const msg = checkColumnCount('a,b\n1,2\n3', 'CSV');
    expect(msg).toMatch(/row 3/);
    expect(msg).toMatch(/expected 2, found 1/);
  });

  it('checks TSV rows by tabs', () => {
    expect(checkColumnCount('a\tb\n1\t2', 'TSV')).toBeNull();
    expect(checkColumnCount('a\tb\n1', 'TSV')).toMatch(/row 2/);
  });
});
