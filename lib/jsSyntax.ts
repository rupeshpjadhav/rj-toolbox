import { minify } from 'terser';

export interface SyntaxIssue {
  line: number;
  column: number;
  message: string;
}

/**
 * Parses the source with terser (no execution). Returns the first syntax error
 * with its real line and column (terser's `col` is 0-based), or null when it parses.
 */
export const checkJsSyntax = async (code: string): Promise<SyntaxIssue | null> => {
  try {
    await minify(code, { compress: false, mangle: false });
    return null;
  } catch (e) {
    const err = e as { message?: string; line?: number; col?: number };
    return {
      line: err.line ?? 1,
      column: (err.col ?? 0) + 1,
      message: err.message ?? 'Syntax error',
    };
  }
};

/** Lines containing an empty block such as `{}`. Uses a fresh regex per line (no /g state). */
export const findEmptyBlockLines = (code: string): number[] =>
  code.split('\n').flatMap((line, i) => (/\{\s*\}/.test(line) ? [i + 1] : []));
