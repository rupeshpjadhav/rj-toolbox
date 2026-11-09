// Post-build step: turns the single-page build into one crawlable HTML page per tool.
//
// For the home page and each tool in lib/toolPages.json it writes dist/<slug>/index.html with
// its own <title>, meta description, canonical URL, Open Graph tags and JSON-LD, plus static,
// visible content around the React app: the page header, an H1 and intro above the app, and a
// how-to, "good for" list, FAQ and related tools below it. The React app (in #root) still
// renders the interactive tool. Also writes dist/sitemap.xml and dist/404.html.
//
// Run after `vite build` (see the "build" script in package.json). Plain Node, no dependencies.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DIST = path.join(ROOT, 'dist');
const SITE = 'https://rj-toolkit.com';
const OG_IMAGE = `${SITE}/og-image.png`;

const { home, tools } = JSON.parse(fs.readFileSync(path.join(ROOT, 'lib/toolPages.json'), 'utf8'));

const SITE_LINKS = [
  ['/guides/', 'Tool guides'],
  ['/about/', 'About'],
  ['/privacy-policy/', 'Privacy policy'],
  ['/terms/', 'Terms'],
  ['/contact/', 'Contact'],
];
// Static pages from public/ that belong in the sitemap.
const STATIC_PAGES = SITE_LINKS.map(([href]) => href);

const esc = (s) =>
  String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
// JSON-LD inside <script>: escape "<" so the content can never close the tag.
const jsonLd = (obj) => `<script type="application/ld+json">${JSON.stringify(obj).replace(/</g, '\\u003c')}</script>`;

const toolUrl = (t) => `${SITE}/${t.slug}/`;

// ---------- head ----------

const headFor = ({ title, description, url, ld }) =>
  [
    `<title>${esc(title)}</title>`,
    `<meta name="description" content="${esc(description)}" />`,
    `<link rel="canonical" href="${url}" />`,
    `<meta name="theme-color" content="#0f172a" />`,
    `<meta property="og:type" content="website" />`,
    `<meta property="og:site_name" content="My Toolbox" />`,
    `<meta property="og:title" content="${esc(title)}" />`,
    `<meta property="og:description" content="${esc(description)}" />`,
    `<meta property="og:url" content="${url}" />`,
    `<meta property="og:image" content="${OG_IMAGE}" />`,
    `<meta property="og:image:width" content="1200" />`,
    `<meta property="og:image:height" content="630" />`,
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<meta name="twitter:title" content="${esc(title)}" />`,
    `<meta name="twitter:description" content="${esc(description)}" />`,
    `<meta name="twitter:image" content="${OG_IMAGE}" />`,
    ...ld.map(jsonLd),
  ].join('\n    ');

// Tags in the template that every page replaces with its own.
const REPLACED_HEAD = [
  /<title>[\s\S]*?<\/title>\s*/i,
  /<meta\s+name="(description|keywords|theme-color|twitter:[^"]+)"[^>]*>\s*/gi,
  /<meta\s+property="og:[^"]+"[^>]*>\s*/gi,
  /<link\s+rel="canonical"[^>]*>\s*/gi,
];

// ---------- body ----------

const container = 'container mx-auto px-4 sm:px-6 lg:px-8';

const siteHeader = () => `<header class="bg-slate-900/80 backdrop-blur-sm sticky top-0 z-50 border-b border-slate-800">
      <div class="${container} flex flex-wrap items-center justify-between gap-x-6 gap-y-2 py-3 min-h-[4rem]">
        <a href="/" class="text-2xl sm:text-3xl font-bold tracking-tight text-cyan-400 hover:text-cyan-300">My Toolbox</a>
        <nav aria-label="Site" class="flex flex-wrap gap-x-5 gap-y-1 text-sm text-slate-300">
          ${SITE_LINKS.map(([href, label]) => `<a href="${href}" class="hover:text-cyan-400 hover:underline">${label}</a>`).join('\n          ')}
        </nav>
      </div>
    </header>`;

const intro = (h1, lead) => `<div class="${container} pt-8 sm:pt-10">
      <h1 class="text-3xl sm:text-4xl font-bold tracking-tight text-white">${esc(h1)}</h1>
      <p class="mt-3 max-w-3xl text-lg text-slate-300">${esc(lead)}</p>
    </div>`;

const h2 = 'text-2xl font-bold text-white mt-10 mb-4';
const card = 'block bg-slate-800/50 border border-slate-700 rounded-lg p-4 hover:border-cyan-500';

const toolCards = (list) => `<ul class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        ${list
          .map(
            (t) => `<li><a href="/${t.slug}/" class="${card}"><span class="block font-semibold text-cyan-400">${esc(t.h1)}</span><span class="block mt-1 text-sm text-slate-400">${esc(t.lead)}</span></a></li>`,
          )
          .join('\n        ')}
      </ul>`;

const toolGuide = (t) => {
  const others = tools.filter((o) => o.slug !== t.slug);
  return `<section aria-labelledby="about-tool" class="${container} pb-12 text-slate-300 leading-relaxed max-w-4xl">
      <h2 id="about-tool" class="${h2}">About the ${esc(t.name)}</h2>
      <p>${t.aboutHtml}</p>
      <h2 class="${h2}">How to use it</h2>
      <ol class="list-decimal pl-6 space-y-2">
        ${t.steps.map((s) => `<li>${esc(s)}</li>`).join('\n        ')}
      </ol>
      <h2 class="${h2}">Good for</h2>
      <ul class="list-disc pl-6 space-y-2">
        ${t.goodForHtml.map((g) => `<li>${g}</li>`).join('\n        ')}
      </ul>
      <p class="mt-4"><strong class="text-white">Tip:</strong> ${t.tipHtml}</p>
      <h2 class="${h2}">Frequently asked questions</h2>
      ${t.faqs.map((f) => `<h3 class="text-lg font-semibold text-white mt-6">${esc(f.q)}</h3>\n      <p class="mt-1">${f.aHtml}</p>`).join('\n      ')}
      <h2 class="${h2}">More free tools</h2>
      ${toolCards(others)}
    </section>`;
};

const homeGuide = () => `<section aria-labelledby="all-tools" class="${container} pb-12 text-slate-300 leading-relaxed">
      <h2 id="all-tools" class="${h2}">All tools</h2>
      ${toolCards(tools)}
      <p class="mt-8 max-w-3xl">The tools process your text and files in your browser; nothing you paste is uploaded or stored. Read the <a class="text-cyan-400 hover:underline" href="/guides/">tool guides</a> for tips on each one.</p>
    </section>`;

const siteFooter = () => `<footer class="border-t border-slate-800 text-center py-6 text-slate-500 text-sm">
      <p>© ${new Date().getFullYear()} Rupesh Jadhav · My Toolbox (rj-toolkit.com) · Created by <a href="https://www.linkedin.com/in/rupeshj/" target="_blank" rel="noopener noreferrer" class="text-cyan-400 hover:underline">Rupesh Jadhav</a></p>
      <p class="mt-1">Built with React, TypeScript, Vite and Tailwind CSS.</p>
      <p class="mt-2">${SITE_LINKS.map(([href, label]) => `<a href="${href}" class="hover:text-cyan-400 hover:underline">${label}</a>`).join(' · ')}</p>
    </footer>`;

// ---------- structured data ----------

const author = { '@type': 'Person', name: 'Rupesh Jadhav', url: 'https://www.linkedin.com/in/rupeshj/' };

const toolLd = (t) => [
  {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: t.h1,
    url: toolUrl(t),
    description: t.description,
    applicationCategory: 'DeveloperApplication',
    operatingSystem: 'Any (runs in a web browser)',
    browserRequirements: 'Requires JavaScript',
    isAccessibleForFree: true,
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
    author,
  },
  {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'My Toolbox', item: `${SITE}/` },
      { '@type': 'ListItem', position: 2, name: t.h1, item: toolUrl(t) },
    ],
  },
];

const homeLd = () => [
  {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'My Toolbox',
    url: `${SITE}/`,
    description: home.description,
    author,
  },
  {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    itemListElement: tools.map((t, i) => ({ '@type': 'ListItem', position: i + 1, name: t.h1, url: toolUrl(t) })),
  },
];

// ---------- build ----------

const template = fs.readFileSync(path.join(DIST, 'index.html'), 'utf8');
if (!/<div id="root"><\/div>/.test(template)) throw new Error('dist/index.html has no empty <div id="root"></div>');

const render = ({ head, h1, lead, below, slug }) => {
  let html = template;
  for (const re of REPLACED_HEAD) html = html.replace(re, '');
  html = html.replace('</head>', `    ${head}\n  </head>`);
  // The root keeps a full screen of height so the static content below it never jumps into view
  // when the app mounts (no layout shift in the visible area).
  const body = [
    siteHeader(),
    intro(h1, lead),
    `<div id="root" data-tool="${slug}" style="min-height:100vh"></div>`,
    below,
    siteFooter(),
  ].join('\n    ');
  html = html.replace('<div id="root"></div>', body);
  return html;
};

const write = (rel, content) => {
  const file = path.join(DIST, rel);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, content);
};

// Tool pages
for (const t of tools) {
  write(
    `${t.slug}/index.html`,
    render({
      head: headFor({ title: t.title, description: t.description, url: toolUrl(t), ld: toolLd(t) }),
      h1: t.h1,
      lead: t.lead,
      below: toolGuide(t),
      slug: t.slug,
    }),
  );
}

// Home page (last, because it overwrites the template file)
write(
  'index.html',
  render({
    head: headFor({ title: home.title, description: home.description, url: `${SITE}/`, ld: homeLd() }),
    h1: home.h1,
    lead: home.lead,
    below: homeGuide(),
    slug: '',
  }),
);

// 404 page: same shell, not indexed
write(
  '404.html',
  render({
    head: `<title>Page not found | My Toolbox</title>\n    <meta name="robots" content="noindex" />`,
    h1: 'Page not found',
    lead: 'That page does not exist. Pick a tool below.',
    below: homeGuide(),
    slug: '',
  }).replace(/<div id="root"[^>]*><\/div>/, '<div id="root" data-tool="" style="display:none"></div>'),
);

// Sitemap: home, every tool, every static page
const today = new Date().toISOString().slice(0, 10);
const urls = [`${SITE}/`, ...tools.map(toolUrl), ...STATIC_PAGES.map((p) => `${SITE}${p}`)];
write(
  'sitemap.xml',
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls
    .map((u) => `  <url><loc>${u}</loc><lastmod>${today}</lastmod></url>`)
    .join('\n')}\n</urlset>\n`,
);

console.log(`prerender: wrote ${tools.length} tool pages, home, 404 and a sitemap with ${urls.length} URLs.`);
