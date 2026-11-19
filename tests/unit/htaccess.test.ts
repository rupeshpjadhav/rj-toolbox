import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

// The Hostinger (Apache) rules deployed with the site. Live behaviour is covered by seo.spec.ts (@live).
const rules = readFileSync(fileURLToPath(new URL('../../public/.htaccess', import.meta.url)), 'utf8');

describe('public/.htaccess', () => {
  it('redirects http and www to the https canonical host', () => {
    expect(rules).toContain('RewriteCond %{HTTPS} off');
    expect(rules).toContain('RewriteCond %{HTTP_HOST} ^www\\. [NC]');
    expect(rules).toContain('RewriteRule ^ https://rj-toolkit.com%{REQUEST_URI} [L,R=301]');
  });

  it('serves the site 404 page for unknown URLs', () => {
    expect(rules).toContain('ErrorDocument 404 /404.html');
  });

  it('always revalidates HTML and caches hashed JavaScript for a year', () => {
    expect(rules).toContain('ExpiresByType text/html "access plus 0 seconds"');
    expect(rules).toContain('ExpiresByType application/javascript "access plus 1 year"');
  });

  it('sends the nosniff and referrer headers', () => {
    expect(rules).toContain('X-Content-Type-Options "nosniff"');
    expect(rules).toContain('Referrer-Policy "strict-origin-when-cross-origin"');
  });
});
