// Converts JSON-like data to a Python literal. Works on values, not on text,
// so strings such as "nulla" or "true story" are never altered.

const pyString = (s: string): string =>
  "'" + s
    .replace(/\\/g, '\\\\')
    .replace(/'/g, "\\'")
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '\\r')
    .replace(/\t/g, '\\t') + "'";

export const toPythonLiteral = (value: unknown, indent = 0): string => {
  const pad = '    '.repeat(indent + 1);
  const end = '    '.repeat(indent);
  if (value === null || value === undefined) return 'None';
  if (typeof value === 'boolean') return value ? 'True' : 'False';
  if (typeof value === 'number') {
    if (Number.isNaN(value)) return 'float("nan")';
    if (!Number.isFinite(value)) return value > 0 ? 'float("inf")' : 'float("-inf")';
    return String(value);
  }
  if (typeof value === 'string') return pyString(value);
  if (Array.isArray(value)) {
    if (value.length === 0) return '[]';
    return '[\n' + value.map(v => pad + toPythonLiteral(v, indent + 1)).join(',\n') + '\n' + end + ']';
  }
  if (typeof value === 'object') {
    const entries = Object.entries(value as Record<string, unknown>);
    if (entries.length === 0) return '{}';
    return '{\n' + entries
      .map(([k, v]) => `${pad}${pyString(k)}: ${toPythonLiteral(v, indent + 1)}`)
      .join(',\n') + '\n' + end + '}';
  }
  return pyString(String(value));
};
