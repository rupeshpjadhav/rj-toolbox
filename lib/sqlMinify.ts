// Collapses SQL onto one line without touching string literals or quoted identifiers.
// Line comments (-- ...) are turned into block comments so they cannot swallow the rest of the query.
export const minifySql = (sql: string): string => {
  let out = '';
  let i = 0;
  const n = sql.length;
  let pendingSpace = false;
  const emit = (s: string) => {
    if (pendingSpace && out.length > 0) out += ' ';
    pendingSpace = false;
    out += s;
  };
  while (i < n) {
    const ch = sql[i];
    // quoted strings / identifiers: ' " ` [ ]
    if (ch === "'" || ch === '"' || ch === '`' || ch === '[') {
      const close = ch === '[' ? ']' : ch;
      let j = i + 1;
      while (j < n) {
        if (sql[j] === close) {
          if (close !== ']' && sql[j + 1] === close) { j += 2; continue; } // doubled quote escape
          break;
        }
        if (sql[j] === '\\' && (ch === "'" || ch === '"')) { j += 2; continue; } // MySQL backslash escape
        j++;
      }
      emit(sql.slice(i, Math.min(j + 1, n)));
      i = j + 1;
      continue;
    }
    if (ch === '-' && sql[i + 1] === '-') {
      let j = i + 2;
      while (j < n && sql[j] !== '\n' && sql[j] !== '\r') j++;
      const text = sql.slice(i + 2, j).trim().replace(/\*\//g, '* /');
      emit(`/* ${text} */`);
      pendingSpace = true;
      i = j;
      continue;
    }
    if (ch === '/' && sql[i + 1] === '*') {
      const end = sql.indexOf('*/', i + 2);
      const j = end === -1 ? n : end + 2;
      emit(sql.slice(i, j));
      i = j;
      continue;
    }
    if (/\s/.test(ch)) {
      pendingSpace = true;
      i++;
      continue;
    }
    emit(ch);
    i++;
  }
  return out.trim();
};
