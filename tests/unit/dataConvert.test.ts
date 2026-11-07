import { describe, expect, it } from 'vitest';
import { convertData, detectFormat, SAMPLES, type DataFormat, type ConvertOptions } from '../../lib/dataConvert';

const FORMATS: DataFormat[] = ['Column', 'CSV', 'TSV', 'JSON', 'XML'];
const OPTS: ConvertOptions = { quoteStyle: 'double', quoteAll: true };

type Rec = Record<string, string>;
const EXPECTED: Record<DataFormat, Rec[]> = {
  Column: [{ value: 'John Doe' }, { value: 'Jane Roe' }],
  CSV: [
    { id: '1', name: 'John Doe', email: 'john@example.com' },
    { id: '2', name: 'Jane, Roe', email: 'jane@example.com' },
  ],
  TSV: [
    { id: '1', name: 'John Doe', email: 'john@example.com' },
    { id: '2', name: 'Jane, Roe', email: 'jane@example.com' },
  ],
  JSON: [
    { id: '1', name: 'John Doe', email: 'john@example.com' },
    { id: '2', name: 'Jane, Roe', email: 'jane@example.com' },
  ],
  XML: [
    { id: '1', name: 'John Doe', email: 'john@example.com' },
    { id: '2', name: 'Jane, Roe', email: 'jane@example.com' },
  ],
};

/** Reads any output back as records of strings, using JSON as the common view. */
const readRecords = (text: string, format: DataFormat): Rec[] => {
  const result = convertData(text, format, 'JSON', OPTS);
  if (result.ok === false) throw new Error(result.error);
  return (JSON.parse(result.output) as unknown[]).map(item =>
    typeof item === 'object' && item !== null
      ? Object.fromEntries(Object.entries(item).map(([k, v]) => [k, String(v)]))
      : { value: String(item) },
  );
};

const mustConvert = (input: string, from: DataFormat, to: DataFormat, opts = OPTS) => {
  const result = convertData(input, from, to, opts);
  if (result.ok === false) throw new Error(`${from} -> ${to} failed: ${result.error}`);
  return result;
};

describe('every format pair (5 x 5)', () => {
  for (const from of FORMATS) {
    for (const to of FORMATS) {
      it(`${from} -> ${to}`, () => {
        const out = mustConvert(SAMPLES[from], from, to).output;
        if (to === 'Column' && from !== 'Column') {
          // Column keeps one field, so only the first field survives (warned).
          const result = mustConvert(SAMPLES[from], from, to);
          expect(result.output.split('\n')).toEqual(['1', '2']);
          expect(result.warnings.join(' ')).toMatch(/keeps only/);
          return;
        }
        // Round trip: out (to) -> back (from) must give the original records.
        const back = mustConvert(out, to, from).output;
        expect(readRecords(back, from)).toEqual(EXPECTED[from]);
      });
    }
  }
});

describe('format detection', () => {
  it('detects each sample', () => {
    expect(detectFormat(SAMPLES.Column)).toBe('Column');
    expect(detectFormat(SAMPLES.CSV)).toBe('CSV');
    expect(detectFormat(SAMPLES.TSV)).toBe('TSV');
    expect(detectFormat(SAMPLES.JSON)).toBe('JSON');
    expect(detectFormat(SAMPLES.XML)).toBe('XML');
  });
});

describe('CSV and TSV details', () => {
  it('writes Column data as one "value" column', () => {
    expect(mustConvert('a\nb', 'Column', 'CSV').output).toBe('"value"\n"a"\n"b"');
    expect(mustConvert('a\nb', 'Column', 'TSV', { quoteStyle: 'none', quoteAll: false }).output).toBe('value\na\nb');
  });

  it('quotes only when needed with quoteAll off, and escapes embedded quotes', () => {
    const out = mustConvert('name,note\nA,"say ""hi"""', 'CSV', 'CSV', { quoteStyle: 'double', quoteAll: false }).output;
    expect(out).toBe('name,note\nA,"say ""hi"""');
  });

  it('uses single quotes when asked', () => {
    const out = mustConvert(SAMPLES.CSV, 'CSV', 'CSV', { quoteStyle: 'single', quoteAll: false }).output;
    expect(out).toContain("'Jane, Roe'");
  });

  it('keeps headers when there are no data rows', () => {
    expect(mustConvert('id,name', 'CSV', 'CSV', { quoteStyle: 'none', quoteAll: false }).output).toBe('id,name');
  });

  it('turns nested JSON values into JSON text inside one cell', () => {
    const json = '[{"id":1,"meta":{"a":1}}]';
    const out = mustConvert(json, 'JSON', 'CSV', { quoteStyle: 'double', quoteAll: false }).output;
    expect(out).toBe('id,meta\n1,"{""a"":1}"');
  });

  it('warns when Column output drops fields from a CSV', () => {
    const result = mustConvert(SAMPLES.CSV, 'CSV', 'Column');
    expect(result.warnings[0]).toMatch(/keeps only the "id" field/);
  });

  it('rejects rows with the wrong number of columns, naming the row', () => {
    const result = convertData('a,b\n1,2\n3', 'CSV', 'JSON', OPTS);
    expect(result).toEqual({ ok: false, error: expect.stringMatching(/row 3/) });
  });
});

describe('JSON details', () => {
  it('accepts an object with a data array', () => {
    const out = mustConvert('{"data":[{"a":"1"}]}', 'JSON', 'CSV', { quoteStyle: 'double', quoteAll: false }).output;
    expect(out).toBe('a\n1');
  });

  it('wraps a single object as one record', () => {
    expect(readRecords('{"a":"x"}', 'JSON')).toEqual([{ a: 'x' }]);
  });

  it('keeps values as numbers and booleans when the output is JSON', () => {
    const out = mustConvert('[1, true, "x"]', 'JSON', 'JSON').output;
    expect(JSON.parse(out)).toEqual([1, true, 'x']);
  });

  it('reports the line and column of invalid JSON', () => {
    const result = convertData('[\n  {"a": 1,}\n]', 'JSON', 'CSV', OPTS);
    expect(result.ok).toBe(false);
    if (result.ok === false) expect(result.error).toMatch(/line 2, column/);
  });

  it('turns keys that are not valid XML names into safe element names', () => {
    const out = mustConvert('[{"first name":"Ann","2nd":"x"}]', 'JSON', 'XML').output;
    expect(out).toContain('<first_name>Ann</first_name>');
    expect(out).toContain('<_2nd>x</_2nd>');
  });
});

describe('XML details', () => {
  it('reads attributes as @-keys and text as values', () => {
    const xml = '<data><item id="7"><name>A</name></item></data>';
    expect(readRecords(xml, 'XML')).toEqual([{ '@id': '7', name: 'A' }]);
  });

  it('reads a root with one text child as a single record', () => {
    expect(readRecords('<person><name>Ann</name></person>', 'XML')).toEqual([{ name: 'Ann' }]);
  });

  it('round-trips a single record', () => {
    const json = '[{"id":"1","name":"Solo"}]';
    const xml = mustConvert(json, 'JSON', 'XML').output;
    expect(readRecords(xml, 'XML')).toEqual([{ id: '1', name: 'Solo' }]);
  });

  it('writes an empty list as an empty root element', () => {
    const out = mustConvert('[]', 'JSON', 'XML').output;
    expect(out).toMatch(/<data\s*\/?>(<\/data>)?/);
  });

  it('escapes special characters on the way out', () => {
    const out = mustConvert('[{"note":"a < b & \\"c\\""}]', 'JSON', 'XML').output;
    expect(out).toContain('a &lt; b &amp;');
    expect(readRecords(out, 'XML')).toEqual([{ note: 'a < b & "c"' }]);
  });

  it('reports the line and column of malformed XML', () => {
    const result = convertData('<data>\n  <item></data>', 'XML', 'JSON', OPTS);
    expect(result.ok).toBe(false);
    if (result.ok === false) expect(result.error).toMatch(/line \d+, column \d+/);
  });

  it('requires the input to start with an element', () => {
    const result = convertData('name,age', 'XML', 'JSON', OPTS);
    expect(result.ok).toBe(false);
  });
});

describe('edge cases', () => {
  it('empty input converts to empty output for every pair', () => {
    for (const from of FORMATS) for (const to of FORMATS) {
      expect(convertData('   ', from, to, OPTS)).toEqual({ ok: true, output: '', warnings: [] });
    }
  });
});
