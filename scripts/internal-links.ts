/**
 * Internal-link graph audit (SEO-08): crawls the sitemaps for one locale,
 * builds the link graph from the rendered HTML and reports orphans, pages
 * deeper than three clicks, and clusters with no hub.
 *
 * Run:  npm run internal-links -- --base https://www.domlivo.com --locale en
 *       npm run internal-links -- --locale all
 * Node >= 22.6 (native TypeScript type-stripping; no deps, no browser),
 * matching scripts/content-qa.ts.
 *
 * Why two graphs. The header and footer link to most of the site from every
 * page. Counted naively, nothing is ever an orphan and everything sits two
 * clicks from home — a report that always passes and therefore says nothing.
 * So a link present on at least CHROME_RATIO of crawled pages is treated as
 * site chrome and excluded from the CONTEXTUAL graph, which is what the orphan
 * check runs on. Depth still uses the FULL graph, because a crawler really can
 * reach a page through the navigation.
 *
 * Flags: --base <url>  --locale <code|all>  --concurrency <n>  --out <path>
 *        --strict (exit 1 when orphans or depth>3 are found)
 */

import { writeFileSync } from 'node:fs';

const LOCALES = ['en', 'uk', 'ru', 'sq', 'it', 'pl'];

const SITEMAPS = [
  'sitemap-static.xml',
  'sitemap-cities.xml',
  'sitemap-types.xml',
  'sitemap-non-geo-listings.xml',
  'sitemap-properties.xml',
  'sitemap-blog.xml',
  'sitemap-landings.xml',
  'sitemap-districts.xml',
];

/** A link on this share of crawled pages or more is site chrome, not a contextual link. */
const CHROME_RATIO = 0.8;
const MAX_DEPTH = 3;

type Args = {
  base: string;
  locales: string[];
  concurrency: number;
  out: string;
  strict: boolean;
};

function parseArgs(argv: string[]): Args {
  const get = (name: string, fallback: string): string => {
    const i = argv.indexOf(`--${name}`);
    return i >= 0 && argv[i + 1] ? argv[i + 1] : fallback;
  };
  const localeArg = get('locale', 'en');
  return {
    base: get('base', 'https://www.domlivo.com').replace(/\/$/, ''),
    locales: localeArg === 'all' ? LOCALES : localeArg.split(',').map((l) => l.trim()).filter(Boolean),
    concurrency: Math.max(1, Number(get('concurrency', '8')) || 8),
    out: get('out', 'docs/seo/internal-links-report.md'),
    strict: argv.includes('--strict'),
  };
}

async function fetchText(url: string): Promise<{ status: number; text: string }> {
  try {
    const res = await fetch(url, {
      redirect: 'follow',
      signal: AbortSignal.timeout(45_000),
      headers: { 'user-agent': 'DomlivoInternalLinks/1.0' },
    });
    return { status: res.status, text: await res.text() };
  } catch {
    return { status: 0, text: '' };
  }
}

function extractLocs(xml: string): string[] {
  return Array.from(xml.matchAll(/<loc>([^<]+)<\/loc>/g), (m) => m[1].trim());
}

/** Strips <script>/<style>/<template> so JSON-LD and inlined payloads never look like links. */
function withoutScripts(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<template[\s\S]*?<\/template>/gi, ' ');
}

/** Same-locale internal paths linked from this page, normalised and deduped. */
function extractLinks(html: string, base: string, locale: string): Set<string> {
  const out = new Set<string>();
  for (const m of withoutScripts(html).matchAll(/<a\b[^>]*\bhref=["']([^"']+)["']/gi)) {
    let href = m[1].trim();
    if (!href || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:')) continue;
    if (href.startsWith(base)) href = href.slice(base.length);
    if (/^https?:\/\//i.test(href)) continue; // external
    href = href.split('#')[0].split('?')[0];
    if (!href.startsWith('/')) continue;
    if (href.length > 1) href = href.replace(/\/$/, '');
    // Only same-locale links build this locale's graph; a link to /pl from an
    // /en page is a language switch, not internal structure.
    if (href !== `/${locale}` && !href.startsWith(`/${locale}/`)) continue;
    out.add(href);
  }
  return out;
}

async function mapWithConcurrency<T, R>(
  items: T[],
  limit: number,
  fn: (item: T, index: number) => Promise<R>,
): Promise<R[]> {
  const results = new Array<R>(items.length);
  let next = 0;
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (true) {
      const i = next++;
      if (i >= items.length) return;
      results[i] = await fn(items[i], i);
    }
  });
  await Promise.all(workers);
  return results;
}

/** URL shape used to group pages into clusters, e.g. `/en/albania/{city}/districts/{district}`. */
function clusterOf(path: string, locale: string): string {
  const rest = path.replace(new RegExp(`^/${locale}`), '') || '/';
  const segs = rest.split('/').filter(Boolean);
  if (segs.length === 0) return 'homepage';
  if (segs[0] === 'blog') return segs.length > 1 ? 'blog post' : 'blog index';
  if (segs[0] === 'guides') return segs.length > 1 ? 'guide' : 'guides index';
  if (segs[0] === 'property') return 'property detail';
  if (segs[0] === 'agent') return 'agent';
  if (segs[0] === 'investment') return 'investment';
  if (segs[0] === 'albania') {
    if (segs.includes('districts')) return segs.length > 3 ? 'district' : 'district index';
    if (segs.includes('info')) return 'city editorial';
    if (segs.includes('sale')) return 'city listing by type';
    return 'city listing';
  }
  if (segs[0] === 'sale' || segs[0] === 'rent' || segs[0] === 'short-term-rent') return 'non-geo listing';
  return `static: /${segs[0]}`;
}

type LocaleReport = {
  locale: string;
  crawled: number;
  failed: string[];
  chrome: string[];
  orphans: string[];
  navOnly: string[];
  deep: Array<{ path: string; depth: number | null }>;
  clusters: Array<{ name: string; pages: number; withContextualIn: number }>;
};

async function auditLocale(base: string, locale: string, concurrency: number): Promise<LocaleReport> {
  const seen = new Set<string>();
  for (const sm of SITEMAPS) {
    const { text } = await fetchText(`${base}/${sm}`);
    for (const loc of extractLocs(text)) {
      const path = loc.replace(base, '').split('#')[0].split('?')[0].replace(/\/$/, '') || '/';
      if (path === `/${locale}` || path.startsWith(`/${locale}/`)) seen.add(path);
    }
  }
  seen.add(`/${locale}`);
  const paths = Array.from(seen).sort();

  const failed: string[] = [];
  const linksByPage = new Map<string, Set<string>>();
  await mapWithConcurrency(paths, concurrency, async (path) => {
    const { status, text } = await fetchText(`${base}${path}`);
    if (status !== 200 || !text) {
      failed.push(`${path} (status ${status})`);
      return;
    }
    linksByPage.set(path, extractLinks(text, base, locale));
  });

  // Chrome = a target linked from at least CHROME_RATIO of the pages we fetched.
  const inboundCount = new Map<string, number>();
  for (const links of linksByPage.values()) {
    for (const target of links) inboundCount.set(target, (inboundCount.get(target) || 0) + 1);
  }
  const crawled = linksByPage.size;
  const chromeThreshold = Math.max(2, Math.ceil(crawled * CHROME_RATIO));
  const chrome = new Set(
    Array.from(inboundCount.entries())
      .filter(([, n]) => n >= chromeThreshold)
      .map(([target]) => target),
  );

  // Contextual inbound: chrome links removed, self-links ignored.
  const contextualIn = new Map<string, number>();
  for (const p of paths) contextualIn.set(p, 0);
  for (const [from, links] of linksByPage) {
    for (const to of links) {
      if (to === from || chrome.has(to) || !contextualIn.has(to)) continue;
      contextualIn.set(to, (contextualIn.get(to) || 0) + 1);
    }
  }
  // Two different problems, and conflating them makes the report useless.
  // A page with no contextual links that IS in the chrome (e.g. /sale, /cities)
  // is deliberately in the main navigation — reachable, indexable, fine. A page
  // with no contextual links and no chrome entry is genuinely unreachable
  // except from a sitemap, and that is the one worth fixing.
  const home = `/${locale}`;
  const noContextual = paths.filter((p) => p !== home && (contextualIn.get(p) || 0) === 0);
  const orphans = noContextual.filter((p) => !chrome.has(p));
  const navOnly = noContextual.filter((p) => chrome.has(p));

  // Depth on the FULL graph, including chrome: a crawler can use the nav.
  const depth = new Map<string, number>([[home, 0]]);
  let frontier = [home];
  while (frontier.length) {
    const nextFrontier: string[] = [];
    for (const from of frontier) {
      for (const to of linksByPage.get(from) || []) {
        if (depth.has(to) || !seen.has(to)) continue;
        depth.set(to, (depth.get(from) || 0) + 1);
        nextFrontier.push(to);
      }
    }
    frontier = nextFrontier;
  }
  const deep = paths
    .filter((p) => !depth.has(p) || (depth.get(p) as number) > MAX_DEPTH)
    .map((p) => ({ path: p, depth: depth.has(p) ? (depth.get(p) as number) : null }));

  const byCluster = new Map<string, { pages: number; withContextualIn: number }>();
  for (const p of paths) {
    const name = clusterOf(p, locale);
    const row = byCluster.get(name) || { pages: 0, withContextualIn: 0 };
    row.pages += 1;
    if ((contextualIn.get(p) || 0) > 0) row.withContextualIn += 1;
    byCluster.set(name, row);
  }

  return {
    locale,
    crawled,
    failed,
    chrome: Array.from(chrome).sort(),
    orphans,
    navOnly,
    deep,
    clusters: Array.from(byCluster.entries())
      .map(([name, v]) => ({ name, ...v }))
      .sort((a, b) => b.pages - a.pages),
  };
}

function render(base: string, reports: LocaleReport[]): string {
  const now = new Date().toISOString().slice(0, 10);
  const totalOrphans = reports.reduce((n, r) => n + r.orphans.length, 0);
  const totalDeep = reports.reduce((n, r) => n + r.deep.length, 0);

  const out: string[] = [];
  out.push('# Internal links report (SEO-08)');
  out.push('');
  out.push(`**Crawled:** ${base} · **Date:** ${now}`);
  out.push('');
  out.push(
    `Orphans are measured on the contextual graph: any link that appears on ${Math.round(CHROME_RATIO * 100)}% or more ` +
      'of crawled pages is treated as header/footer chrome and excluded, because chrome links reach almost ' +
      'everything and would hide the pages nothing actually points at. Pages with no contextual links are then ' +
      'split in two: **orphans**, which are not in the chrome either and so are reachable only from a sitemap, ' +
      'and **nav-only**, which sit in the header or footer and are fine structurally. Depth uses the full graph, ' +
      'chrome included, since a crawler can follow the navigation.',
  );
  out.push('');
  out.push('| Locale | Pages | Orphans | Nav-only | Depth > 3 | Failed to fetch |');
  out.push('|---|---|---|---|---|---|');
  for (const r of reports) {
    out.push(
      `| ${r.locale} | ${r.crawled} | ${r.orphans.length} | ${r.navOnly.length} | ${r.deep.length} | ${r.failed.length} |`,
    );
  }
  out.push('');
  out.push(`**Totals:** ${totalOrphans} orphans, ${totalDeep} pages deeper than ${MAX_DEPTH} clicks.`);
  out.push('');

  for (const r of reports) {
    out.push(`## ${r.locale}`);
    out.push('');
    out.push('### orphans');
    out.push('');
    out.push('No contextual inbound links and not in the site chrome — reachable only from a sitemap.');
    out.push('');
    if (!r.orphans.length) out.push('None.');
    else for (const p of r.orphans) out.push(`- ${p}`);
    out.push('');
    out.push('### nav-only');
    out.push('');
    out.push('In the header or footer, so reachable and indexable, but nothing links to them from body copy.');
    out.push('');
    if (!r.navOnly.length) out.push('None.');
    else for (const p of r.navOnly) out.push(`- ${p}`);
    out.push('');
    out.push(`### depth > ${MAX_DEPTH}`);
    out.push('');
    if (!r.deep.length) out.push('None.');
    else
      for (const d of r.deep) {
        out.push(`- ${d.path} — ${d.depth === null ? 'unreachable from the homepage' : `${d.depth} clicks`}`);
      }
    out.push('');
    out.push('### clusters');
    out.push('');
    out.push('| Cluster | Pages | With contextual inbound links |');
    out.push('|---|---|---|');
    for (const c of r.clusters) out.push(`| ${c.name} | ${c.pages} | ${c.withContextualIn} |`);
    out.push('');
    if (r.failed.length) {
      out.push('### failed to fetch');
      out.push('');
      for (const f of r.failed) out.push(`- ${f}`);
      out.push('');
    }
    out.push(`<details><summary>chrome links excluded (${r.chrome.length})</summary>`);
    out.push('');
    for (const c of r.chrome) out.push(`- ${c}`);
    out.push('');
    out.push('</details>');
    out.push('');
  }
  return out.join('\n');
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));
  const reports: LocaleReport[] = [];
  for (const locale of args.locales) {
    process.stdout.write(`crawling ${locale}… `);
    const r = await auditLocale(args.base, locale, args.concurrency);
    process.stdout.write(
      `${r.crawled} pages, ${r.orphans.length} orphans, ${r.deep.length} deeper than ${MAX_DEPTH}\n`,
    );
    reports.push(r);
  }

  writeFileSync(args.out, render(args.base, reports), 'utf8');
  console.log(`\nreport written to ${args.out}`);

  const failed = reports.some((r) => r.orphans.length || r.deep.length);
  if (args.strict && failed) {
    console.error('strict: orphans or depth>3 present');
    process.exit(1);
  }
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
