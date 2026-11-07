import { describe, expect, it } from 'vitest';
import { minifySql } from '../../lib/sqlMinify';

describe('minifySql', () => {
  it('turns line comments into block comments so they cannot swallow the query', () => {
    expect(minifySql("SELECT a -- note\nFROM t")).toBe('SELECT a /* note */ FROM t');
  });

  it('keeps string literals untouched', () => {
    expect(minifySql("SELECT 'a  b'\n  FROM t")).toBe("SELECT 'a  b' FROM t");
  });
});
