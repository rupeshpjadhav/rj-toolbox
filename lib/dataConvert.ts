// Data Converter core: Column, CSV, TSV, JSON and XML in any direction.
// Every input is parsed into one table shape, then written out in the target format.
//
// Table rules:
//  - Column: one value per non-empty line, stored as { value }.
//  - CSV / TSV: the first row is the header; each data row is a record.
//  - JSON: an array of objects is a list of records; an array of scalars is a list of values;
//          an object with a `data` or `items` array uses that array; any other object is one record.
//  - XML: the root element's children are the records. If the root has one child name that
//          repeats (for example <item> elements), each occurrence is a record. If that child appears
//          once and holds elements, it is one record. If it holds only text, the root is one record.
//          Attributes become "@name" keys and text in mixed content becomes "#text".
//  - Writing to Column keeps the first field of each record, and warns when there are more.
//  - Nested objects and arrays written to CSV/TSV become JSON text inside the cell.

import { csvParse, tsvParse } from 'd3-dsv';
import { XMLBuilder, XMLParser, XMLValidator } from 'fast-xml-parser';
import { checkColumnCount } from './tabular';

export type DataFormat = 'Column' | 'CSV' | 'TSV' | 'JSON' | 'XML';
export type QuoteStyle = 'none' | 'single' | 'double';

export interface ConvertOptions {
  quoteStyle: QuoteStyle;
  quoteAll: boolean;
}

export type ConvertResult =
  | { ok: true; output: string; warnings: string[] }
  | { ok: false; error: string };

export type Row = Record<string, unknown>;

interface Table {
  columns: string[];
  rows: Row[];
  /** True when rows hold single values (Column input, JSON array of scalars, XML text items). */
  scalars: boolean;
  warnings: string[];
}

const SCALAR_KEY = 'value';
const XML_ROOT = 'data';
const XML_ITEM = 'item';
export const SAMPLE_JSON_RECORDS = [
  { id: 1, name: 'John Doe', email: 'john@example.com' },
  { id: 2, name: 'Jane, Roe', email: 'jane@example.com' },
];

const isPlainObject = (v: unknown): v is Row => typeof v === 'object' && v !== null && !Array.isArray(v);

const lineAndColumn = (text: string, pos: number) => {
  const before = text.slice(0, pos).split('\n');
  return { line: before.length, column: before[before.length - 1].length + 1 };
};

const columnsOf = (rows: Row[]): string[] => {
  const seen = new Set<string>();
  for (const row of rows) for (const key of Object.keys(row)) seen.add(key);
  return [...seen];
};

const stringify = (v: unknown): string => {
  if (v === null || v === undefined) return '';
  if (typeof v === 'string') return v;
  if (typeof v === 'object') return JSON.stringify(v);
  return String(v);
};

// XML parsing and writing (same options both ways so data round-trips).
const xmlParser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@',
  textNodeName: '#text',
  parseTagValue: false,
  parseAttributeValue: false,
  trimValues: true,
  ignoreDeclaration: true,
});

const xmlBuilder = new XMLBuilder({
  ignoreAttributes: false,
  attributeNamePrefix: '@',
  textNodeName: '#text',
  format: true,
  indentBy: '  ',
  suppressEmptyNode: false,
});

/** Makes a JSON key a legal XML element name. */
const xmlName = (key: string): string => {
  const cleaned = key.replace(/[^A-Za-z0-9_.-]/g, '_');
  return /^[A-Za-z_]/.test(cleaned) ? cleaned : `_${cleaned}`;
};

const toXmlValue = (v: unknown): unknown => {
  if (v === null || v === undefined) return '';
  if (Array.isArray(v)) return v.map(toXmlValue);
  if (isPlainObject(v)) {
    const out: Row = {};
    for (const [key, value] of Object.entries(v)) {
      if (key === '#text') out[key] = stringify(value);
      else if (key.startsWith('@')) out[`@${xmlName(key.slice(1))}`] = stringify(value);
      else out[xmlName(key)] = toXmlValue(value);
    }
    return out;
  }
  return String(v);
};

const isXmlAttributeOrText = (key: string) => key.startsWith('@') || key === '#text';

/** Items of an XML element: the children of a single repeated child kind, otherwise the element itself. */
const xmlItemsOf = (content: unknown): unknown[] => {
  if (content === '' || content === null || content === undefined) return [];
  if (!isPlainObject(content)) return [content];
  const children = Object.keys(content).filter(k => !isXmlAttributeOrText(k));
  if (children.length === 1) {
    const value = content[children[0]];
    if (Array.isArray(value)) return value; // repeated elements: one record each
    if (isPlainObject(value)) return [value]; // a single element: one record
  }
  return [content]; // the element itself (text or several fields) is one record
};

const tableFromItems = (items: unknown[]): Table => {
  const rows = items.map(v => (isPlainObject(v) ? v : { [SCALAR_KEY]: v }));
  return {
    columns: columnsOf(rows),
    rows,
    scalars: items.every(v => !isPlainObject(v)),
    warnings: [],
  };
};

const emptyTable = (columns: string[] = []): Table => ({ columns, rows: [], scalars: false, warnings: [] });

/** Describes the first problem in the input, or returns null when it can be converted. */
export const validateInput = (input: string, format: DataFormat): string | null => {
  const text = input.trim();
  if (!text) return null;
  const firstLine = text.split('\n')[0].trim();
  const hasCommas = firstLine.includes(',');
  const hasTabs = firstLine.includes('\t');
  const hasBraces = /[{[]/.test(firstLine) && /[}\]]/.test(firstLine);

  switch (format) {
    case 'Column':
      return null; // any text is a valid list of values
    case 'CSV':
      if (!hasCommas && hasTabs) return 'Error: Input appears to be TSV data. Please select TSV as the input format.';
      if (hasBraces) return 'Error: Input appears to be JSON data. Please select the correct input format.';
      return checkColumnCount(text, 'CSV');
    case 'TSV':
      if (!hasTabs && hasCommas) return 'Error: Input appears to be CSV data. Please select CSV as the input format.';
      if (hasBraces) return 'Error: Input appears to be JSON data. Please select the correct input format.';
      return checkColumnCount(text, 'TSV');
    case 'JSON':
      try {
        const parsed = JSON.parse(text);
        return parsed === null || typeof parsed !== 'object' ? 'JSON input must be an array or object' : null;
      } catch (e) {
        const message = e instanceof Error ? e.message : 'Invalid JSON';
        const pos = message.match(/position\s+(\d+)/);
        if (pos) {
          const { line, column } = lineAndColumn(text, Number(pos[1]));
          return `Invalid JSON at line ${line}, column ${column}: ${message}`;
        }
        return `Invalid JSON: ${message}`;
      }
    case 'XML': {
      if (!text.startsWith('<')) return 'Error: XML input must start with an element, such as <data>.';
      const result = XMLValidator.validate(text);
      if (result === true) return null;
      return `Invalid XML at line ${result.err.line}, column ${result.err.col}: ${result.err.msg}`;
    }
  }
};

/** Guesses the format of pasted text. */
export const detectFormat = (content: string): DataFormat => {
  const text = content.trim();
  if (!text) return 'Column';

  if (text.startsWith('<') && XMLValidator.validate(text) === true) return 'XML';

  if (/^[{[]/.test(text) && /[}\]]$/.test(text)) {
    try {
      JSON.parse(text);
      return 'JSON';
    } catch {
      // Not JSON; keep checking.
    }
  }

  let commas = 0;
  let tabs = 0;
  for (const line of text.split('\n').slice(0, 5)) {
    tabs += (line.match(/\t/g) || []).length;
    const quotedSections: string[] = line.match(/"[^"]*"/g) ?? [];
    const commasInQuotes = quotedSections.reduce((n: number, section: string) => n + (section.match(/,/g) || []).length, 0);
    commas += (line.match(/,/g) || []).length - commasInQuotes;
  }
  if (tabs > 0 && tabs >= commas) return 'TSV';
  if (commas > 0) return 'CSV';
  return 'Column';
};

const parseTable = (input: string, format: DataFormat): Table => {
  const text = input.trim();
  if (!text) return emptyTable();

  switch (format) {
    case 'Column': {
      const values = text.split('\n').map(line => line.trim()).filter(line => line !== '');
      return { columns: [SCALAR_KEY], rows: values.map(v => ({ [SCALAR_KEY]: v })), scalars: true, warnings: [] };
    }
    case 'CSV':
    case 'TSV': {
      const parsed = format === 'CSV' ? csvParse(text) : tsvParse(text);
      return { columns: parsed.columns, rows: parsed.map(row => ({ ...row })), scalars: false, warnings: [] };
    }
    case 'JSON': {
      const parsed: unknown = JSON.parse(text);
      if (Array.isArray(parsed)) return tableFromItems(parsed);
      if (isPlainObject(parsed)) {
        if (Array.isArray(parsed.data)) return tableFromItems(parsed.data);
        if (Array.isArray(parsed.items)) return tableFromItems(parsed.items);
        return tableFromItems([parsed]);
      }
      return tableFromItems([parsed]);
    }
    case 'XML': {
      const doc = xmlParser.parse(text) as Record<string, unknown>;
      const rootName = Object.keys(doc)[0];
      if (rootName === undefined) return emptyTable();
      return tableFromItems(xmlItemsOf(doc[rootName]));
    }
  }
};

/** The field written to Column output: the first real field of the table. */
const columnField = (table: Table): string => {
  if (table.scalars) return SCALAR_KEY;
  return table.columns.find(c => !isXmlAttributeOrText(c)) ?? table.columns[0] ?? SCALAR_KEY;
};

const writeColumn = (table: Table): { output: string; warnings: string[] } => {
  const field = columnField(table);
  const warnings: string[] = [];
  if (!table.scalars && table.columns.length > 1) {
    warnings.push(`Column output keeps only the "${field}" field (${table.columns.length} fields found).`);
  }
  return {
    output: table.rows.map(row => stringify(row[field])).join('\n'),
    warnings,
  };
};

const writeDelimited = (table: Table, delimiter: string, opts: ConvertOptions): string => {
  const headers = table.columns.length ? table.columns : columnsOf(table.rows);
  if (headers.length === 0) return '';
  const quote = opts.quoteStyle === 'single' ? "'" : '"';
  const cell = (value: unknown): string => {
    const text = stringify(value);
    const needsQuotes = text.includes(delimiter) || text.includes('\n') || text.includes('\r') || text.includes(quote);
    return opts.quoteAll || needsQuotes ? quote + text.split(quote).join(quote + quote) + quote : text;
  };
  const lines = [headers.map(cell).join(delimiter)];
  for (const row of table.rows) lines.push(headers.map(h => cell(row[h])).join(delimiter));
  return lines.join('\n');
};

const writeJson = (table: Table): string => {
  const data = table.scalars ? table.rows.map(row => row[SCALAR_KEY]) : table.rows;
  return JSON.stringify(data, null, 2);
};

const writeXml = (table: Table): string => {
  const items = table.rows.map(row => toXmlValue(table.scalars ? { [SCALAR_KEY]: row[SCALAR_KEY] } : row));
  const body = xmlBuilder.build({ [XML_ROOT]: { [XML_ITEM]: items } }) as string;
  return `<?xml version="1.0" encoding="UTF-8"?>\n${body.trim()}`;
};

/** Converts `input` from one format to another. Returns the output, or the first problem found. */
export const convertData = (input: string, from: DataFormat, to: DataFormat, opts: ConvertOptions): ConvertResult => {
  if (!input.trim()) return { ok: true, output: '', warnings: [] };
  const error = validateInput(input, from);
  if (error) return { ok: false, error };
  try {
    const table = parseTable(input, from);
    let output: string;
    let warnings: string[] = [];
    switch (to) {
      case 'Column': ({ output, warnings } = writeColumn(table)); break;
      case 'CSV': output = writeDelimited(table, ',', opts); break;
      case 'TSV': output = writeDelimited(table, '\t', opts); break;
      case 'JSON': output = writeJson(table); break;
      case 'XML': output = writeXml(table); break;
    }
    return { ok: true, output: output!, warnings: [...table.warnings, ...warnings] };
  } catch (e) {
    return { ok: false, error: `Conversion failed: ${e instanceof Error ? e.message : String(e)}` };
  }
};

/** Sample input for each format. All describe the same records (Column has values only). */
export const SAMPLES: Record<DataFormat, string> = {
  Column: 'John Doe\nJane Roe',
  CSV: 'id,name,email\n1,John Doe,john@example.com\n2,"Jane, Roe",jane@example.com',
  TSV: 'id\tname\temail\n1\tJohn Doe\tjohn@example.com\n2\tJane, Roe\tjane@example.com',
  JSON: JSON.stringify(SAMPLE_JSON_RECORDS, null, 2),
  XML: [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<data>',
    '  <item>',
    '    <id>1</id>',
    '    <name>John Doe</name>',
    '    <email>john@example.com</email>',
    '  </item>',
    '  <item>',
    '    <id>2</id>',
    '    <name>Jane, Roe</name>',
    '    <email>jane@example.com</email>',
    '  </item>',
    '</data>',
  ].join('\n'),
};
