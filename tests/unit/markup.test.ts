import { describe, expect, it } from 'vitest';
import { escapeMarkup } from '../../lib/markup';

describe('escapeMarkup', () => {
  it('escapes HTML and XML special characters', () => {
    expect(escapeMarkup(`<b>"Tom" & 'Jerry'</b>`)).toBe('&lt;b&gt;&quot;Tom&quot; &amp; &#39;Jerry&#39;&lt;/b&gt;');
  });

  it('handles null and numbers', () => {
    expect(escapeMarkup(null)).toBe('');
    expect(escapeMarkup(42)).toBe('42');
  });
});
