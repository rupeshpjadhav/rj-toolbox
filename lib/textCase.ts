// Word-based case conversions shared by Text Styler (and future API/tests).

// Splits "helloWorld XMLHttpRequest user_id-value 2nd" into words.
const WORD_RE = /[A-Z]{2,}(?=[A-Z][a-z]+[0-9]*|\b|[^A-Za-z]|$)|[A-Z]?[a-z]+[0-9]*|[A-Z]+|[0-9]+/g;

export const splitWords = (str: string): string[] => str.match(WORD_RE) ?? [];

const capitalize = (w: string) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase();

export const toCamelCase = (str: string) =>
  splitWords(str).map((w, i) => (i === 0 ? w.toLowerCase() : capitalize(w))).join('');

export const toPascalCase = (str: string) => splitWords(str).map(capitalize).join('');

export const toSnakeCase = (str: string) => splitWords(str).map(w => w.toLowerCase()).join('_');

export const toKebabCase = (str: string) => splitWords(str).map(w => w.toLowerCase()).join('-');

export const toCapitalizedCase = (str: string) =>
  str.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
