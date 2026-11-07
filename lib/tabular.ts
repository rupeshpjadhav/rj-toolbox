import { csvParseRows, tsvParseRows } from 'd3-dsv';

export type TabularKind = 'CSV' | 'TSV';

/**
 * Quote-aware column check. Returns an error message when rows have different
 * column counts, otherwise null. Quoted commas/tabs do not count as delimiters.
 */
export const checkColumnCount = (text: string, kind: TabularKind): string | null => {
  const rows = kind === 'CSV' ? csvParseRows(text) : tsvParseRows(text);
  if (rows.length === 0) return null;
  const expected = rows[0].length;
  const bad = rows.findIndex(r => r.length !== expected);
  return bad === -1
    ? null
    : `${kind} validation failed: inconsistent number of columns at row ${bad + 1} (expected ${expected}, found ${rows[bad].length})`;
};
