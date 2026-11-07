const ENTITIES: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };

/** Escapes a value for use in HTML or XML text and attribute content. */
export const escapeMarkup = (value: unknown): string =>
  String(value ?? '').replace(/[&<>"']/g, c => ENTITIES[c]);
