// Safe parser for JavaScript object/array *literals* (JSON5-like).
// It never executes code: functions, calls, variables and template expressions are rejected.
//
// Supported: unquoted keys, single/double/backtick strings (no ${}), trailing commas,
// // and /* */ comments, hex/binary/octal numbers, numeric separators, +/-Infinity, NaN,
// undefined, and an optional leading `const x =` / `export default` / `module.exports =`.

export class LiteralSyntaxError extends SyntaxError {
  line: number;
  column: number;
  constructor(message: string, line: number, column: number) {
    super(`${message} (line ${line}, column ${column})`);
    this.name = 'LiteralSyntaxError';
    this.line = line;
    this.column = column;
  }
}

const MAX_DEPTH = 1000;
const ID_START = /[A-Za-z_$]/;
const ID_PART = /[A-Za-z0-9_$]/;

export const parseJsLiteral = (source: string): unknown => {
  // Strip a BOM, a leading declaration/export and a trailing semicolon.
  // `offset` maps positions in `text` back to `source` for error messages.
  const PREFIX_RE = /^\uFEFF?\s*(?:(?:export\s+)?(?:const|let|var)\s+[A-Za-z_$][\w$]*\s*(?::[^=]+)?=|export\s+default|module\.exports\s*=)?\s*/;
  const offset = PREFIX_RE.exec(source)![0].length;
  const text = source.slice(offset).replace(/;\s*$/, '');
  let pos = 0;

  const fail = (msg: string, at = pos): never => {
    const abs = Math.max(0, at + offset);
    const before = source.slice(0, abs).split('\n');
    throw new LiteralSyntaxError(msg, before.length, before[before.length - 1].length + 1);
  };

  const skip = () => {
    for (;;) {
      const c = text[pos];
      if (c === undefined) return;
      if (/\s/.test(c)) { pos++; continue; }
      if (c === '/' && text[pos + 1] === '/') {
        while (pos < text.length && text[pos] !== '\n') pos++;
        continue;
      }
      if (c === '/' && text[pos + 1] === '*') {
        const end = text.indexOf('*/', pos + 2);
        if (end === -1) fail('Unterminated comment');
        pos = end + 2;
        continue;
      }
      return;
    }
  };

  const parseString = (): string => {
    const quote = text[pos];
    const start = pos;
    pos++;
    let out = '';
    while (pos < text.length) {
      const c = text[pos];
      if (c === quote) { pos++; return out; }
      if (quote === '`' && c === '$' && text[pos + 1] === '{') fail('Template expressions (${...}) are not allowed');
      if (c === '\n' && quote !== '`') fail('Unterminated string', start);
      if (c === '\\') {
        const e = text[pos + 1];
        pos += 2;
        switch (e) {
          case 'n': out += '\n'; break;
          case 't': out += '\t'; break;
          case 'r': out += '\r'; break;
          case 'b': out += '\b'; break;
          case 'f': out += '\f'; break;
          case 'v': out += '\v'; break;
          case '0': out += '\0'; break;
          case '\n': break; // line continuation
          case '\r': if (text[pos] === '\n') pos++; break;
          case 'x': {
            const h = text.slice(pos, pos + 2);
            if (!/^[0-9a-fA-F]{2}$/.test(h)) fail('Invalid \\x escape', pos - 2);
            out += String.fromCharCode(parseInt(h, 16));
            pos += 2;
            break;
          }
          case 'u': {
            if (text[pos] === '{') {
              const end = text.indexOf('}', pos);
              const h = end === -1 ? '' : text.slice(pos + 1, end);
              if (!/^[0-9a-fA-F]{1,6}$/.test(h) || parseInt(h, 16) > 0x10ffff) fail('Invalid \\u{} escape', pos - 2);
              out += String.fromCodePoint(parseInt(h, 16));
              pos = end + 1;
            } else {
              const h = text.slice(pos, pos + 4);
              if (!/^[0-9a-fA-F]{4}$/.test(h)) fail('Invalid \\u escape', pos - 2);
              out += String.fromCharCode(parseInt(h, 16));
              pos += 4;
            }
            break;
          }
          case undefined: fail('Unterminated string', start); break;
          default: out += e; // \' \" \\ \/ \` and identity escapes
        }
        continue;
      }
      out += c;
      pos++;
    }
    return fail('Unterminated string', start);
  };

  const NUM_RE = /^[+-]?(?:0[xX][0-9a-fA-F](?:_?[0-9a-fA-F])*|0[bB][01](?:_?[01])*|0[oO][0-7](?:_?[0-7])*|(?:\d(?:_?\d)*(?:\.(?:\d(?:_?\d)*)?)?|\.\d(?:_?\d)*)(?:[eE][+-]?\d(?:_?\d)*)?|Infinity|NaN)/;

  const parseNumber = (): number => {
    const m = NUM_RE.exec(text.slice(pos));
    if (!m) return fail('Invalid number');
    let raw = m[0].replace(/_/g, '');
    pos += m[0].length;
    if (text[pos] === 'n') fail('BigInt literals cannot be represented in JSON');
    if (pos < text.length && ID_PART.test(text[pos])) fail('Invalid number');
    let sign = 1;
    if (raw[0] === '-' || raw[0] === '+') { if (raw[0] === '-') sign = -1; raw = raw.slice(1); }
    return sign * Number(raw);
  };

  const parseIdentifier = (): string => {
    const start = pos;
    if (!ID_START.test(text[pos] ?? '')) fail('Unexpected character ' + JSON.stringify(text[pos] ?? 'end of input'));
    while (pos < text.length && ID_PART.test(text[pos])) pos++;
    return text.slice(start, pos);
  };

  const parseValue = (depth: number): unknown => {
    if (depth > MAX_DEPTH) fail(`Nesting deeper than ${MAX_DEPTH} levels`);
    skip();
    const c = text[pos];
    if (c === undefined) return fail('Unexpected end of input');
    if (c === '{') return parseObject(depth);
    if (c === '[') return parseArray(depth);
    if (c === '"' || c === "'" || c === '`') return parseString();
    if (/[0-9.+-]/.test(c)) return parseNumber();
    const start = pos;
    const id = parseIdentifier();
    switch (id) {
      case 'true': return true;
      case 'false': return false;
      case 'null': return null;
      case 'undefined': return undefined;
      case 'NaN': return NaN;
      case 'Infinity': return Infinity;
      default:
        return fail(`"${id}" is not allowed: only plain object/array literals are supported (no variables, functions or expressions)`, start);
    }
  };

  const parseArray = (depth: number): unknown[] => {
    pos++; // [
    const arr: unknown[] = [];
    for (;;) {
      skip();
      if (text[pos] === ']') { pos++; return arr; }
      arr.push(parseValue(depth + 1));
      skip();
      if (text[pos] === ',') { pos++; continue; }
      if (text[pos] === ']') { pos++; return arr; }
      fail("Expected ',' or ']'");
    }
  };

  const parseObject = (depth: number): Record<string, unknown> => {
    pos++; // {
    const obj: Record<string, unknown> = Object.create(null);
    for (;;) {
      skip();
      if (text[pos] === '}') { pos++; return { ...obj }; }
      let key: string;
      const c = text[pos];
      if (c === '"' || c === "'") key = parseString();
      else if (c !== undefined && /[0-9.]/.test(c)) key = String(parseNumber());
      else if (c === '[') return fail('Computed keys are not allowed');
      else key = parseIdentifier();
      skip();
      if (text[pos] !== ':') fail("Expected ':' after key");
      pos++;
      obj[key] = parseValue(depth + 1);
      skip();
      if (text[pos] === ',') { pos++; continue; }
      if (text[pos] === '}') { pos++; return { ...obj }; }
      fail("Expected ',' or '}'");
    }
  };

  const value = parseValue(0);
  skip();
  if (pos < text.length) fail('Unexpected content after the value');
  return value;
};
