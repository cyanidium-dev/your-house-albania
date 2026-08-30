/**
 * Content QA crawler: fetches every site page (sitemaps + known routes × 5
 * locales), parses HTML without a browser and reports content-quality issues
 * as rules CQ-01…CQ-11 into content-qa-report.md / content-qa-report.json.
 *
 * Run:  npm run content-qa -- --base https://www.domlivo.com
 *       npm run content-qa -- --base http://localhost:3000 --strict
 * Node >= 22.6 (native TypeScript type-stripping; no deps, no browser).
 *
 * Flags: --base <url>  --strict (exit 1 on criticals)  --max-per-group <n>
 *        (default 40 pages per URL-shape per locale; 0 = unlimited)
 */

import { writeFileSync } from 'node:fs';

type Severity = 'critical' | 'warning' | 'info';

type Finding = {
  rule: string;
  severity: Severity;
  url: string;
  locale: string;
  message: string;
  quote?: string;
};

type Page = {
  url: string;
  path: string;
  locale: string;
  status: number;
  title: string;
  metas: Record<string, string>;
  canonical: string | null;
  hreflangCount: number;
  h1s: string[];
  h3s: string[];
  anchors: Array<{ href: string; text: string; rel: string }>;
  images: Array<{ src: string; alt: string | null }>;
  bodyText: string;
  mainText: string;
  footerText: string;
  robotsNoindex: boolean;
};

const LOCALES = ['en', 'uk', 'ru', 'sq', 'it'];

/** Routes that exist but are not present in any sitemap. */
const KNOWN_ROUTES = [
  '',
  'catalog',
  'contacts',
  'for-realtors',
  'how-to-publish',
  'cities',
  'blog',
  // deal listing routes (reachable directly even when hidden from UI)
  'sale',
  'rent',
  'short-term-rent',
  // investment editorial
  'investment/sale',
  'investment/rent',
  'investment/short-term-rent',
  // property-type shorthand listings (served by the [country] resolver)
  'apartment',
  'house',
  'villa',
  'commercial-space',
  // legacy static marketing pages
  'appartment',
  'office-spaces',
  'residential-homes',
  'luxury-villa',
];

/**
 * CQ-04 config: forbidden Albanian city-name patterns.
 * Rule of thumb (see report): after the prepositions "në/nga" the INDEFINITE
 * form is used (në Tiranë, në Durrës, në Vlorë, në Sarandë); the genitive uses
 * "e/i + -s/-it" (Rrethet e Tiranës, qendra e Durrësit). Extend per city here.
 */
const SQ_GRAMMAR_RULES: Array<{ bad: RegExp; good: string }> = [
  { bad: /\be Tirana\b/g, good: 'e Tiranës' },
  { bad: /\bnë Tirana\b/g, good: 'në Tiranë' },
  { bad: /\bnë Tiranës\b/g, good: 'në Tiranë' },
  { bad: /\bnë Durrësi\b/g, good: 'në Durrës' },
  { bad: /\be Durrës\b(?!it)/g, good: 'i Durrësit' },
  { bad: /\bnë Vlora\b/g, good: 'në Vlorë' },
  { bad: /\be Vlora\b/g, good: 'e Vlorës' },
  { bad: /\bnë Saranda\b/g, good: 'në Sarandë' },
  { bad: /\be Saranda\b/g, good: 'e Sarandës' },
  { bad: /\bnë Shkodra\b/g, good: 'në Shkodër' },
  { bad: /\be Shkodra\b/g, good: 'e Shkodrës' },
  { bad: /\bnë Himara\b/g, good: 'në Himarë' },
  { bad: /\be Himara\b/g, good: 'e Himarës' },
  { bad: /\bnë Shëngjini\b/g, good: 'në Shëngjin' },
  { bad: /\bnë Berati\b/g, good: 'në Berat' },
  { bad: /\bnë Elbasani\b/g, good: 'në Elbasan' },
];

/** CQ-01: exact English UI phrases that must never leak to non-en locales. */
const EN_PHRASES = [
  'For rent',
  'For sale',
  'Short rent',
  'Long rent',
  'Short-term rent',
  'Property types',
  'Price upon request',
  'Read more',
  'View all',
  'Show more',
  'Contact us',
  'Learn more',
];
/** Common English words for the heuristic detector (og:* language mismatch etc.). */
const EN_COMMON_WORDS = [
  'the', 'and', 'with', 'from', 'your', 'our', 'search', 'find', 'discover',
  'properties', 'apartments', 'houses', 'buy', 'explore', 'browse', 'homes',
];
/** Albanian/English words that must not appear in ru/uk visible UI text. */
const NON_CYRILLIC_UI_WORDS = [
  'Kryefaqja', 'Kërko', 'Shiko pronat', 'Qira afatshkurtër', 'Prona në',
  'For rent', 'For sale', 'Property types',
];

const RENT_WORDS = /\b(qira|qiraje|rent|rental|аренд\w*|оренд\w*|affitt\w*)\b/i;

// ---------------------------------------------------------------------------
// tiny HTML helpers (regex-based; scripts/styles removed first so RSC flight
// payloads and JSON-LD never pollute the "visible text")
// ---------------------------------------------------------------------------

function decodeEntities(s: string): string {
  return s
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/&#x27;/g, "'");
}

function stripTags(html: string): string {
  return decodeEntities(html.replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim();
}

function withoutScripts(html: string): string {
  return html
    .replace(/<script\b[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style\b[\s\S]*?<\/style>/gi, ' ')
    .replace(/<noscript\b[\s\S]*?<\/noscript>/gi, ' ')
    .replace(/<template\b[\s\S]*?<\/template>/gi, ' ')
    .replace(/<!--[\s\S]*?-->/g, ' ');
}

function firstGroup(html: string, re: RegExp): string | null {
  const m = html.match(re);
  return m ? m[1] : null;
}

function allTags(html: string, tag: string): string[] {
  const out: string[] = [];
  const re = new RegExp(`<${tag}\\b[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'gi');
  let m: RegExpExecArray | null;
  while ((m = re.exec(html))) out.push(stripTags(m[1]));
  return out;
}

function attrOf(tagHtml: string, attr: string): string | null {
  const m = tagHtml.match(new RegExp(`${attr}\\s*=\\s*"([^"]*)"`, 'i'));
  return m ? decodeEntities(m[1]) : null;
}

function parsePage(url: string, base: string, status: number, html: string): Page {
  const u = new URL(url);
  const path = u.pathname;
  const locale = LOCALES.find((l) => path === `/${l}` || path.startsWith(`/${l}/`)) ?? 'en';
  const clean = withoutScripts(html);

  const metas: Record<string, string> = {};
  for (const m of html.matchAll(/<meta\b[^>]*>/gi)) {
    const tag = m[0];
    const key = attrOf(tag, 'name') ?? attrOf(tag, 'property');
    const content = attrOf(tag, 'content');
    if (key && content !== null) metas[key.toLowerCase()] = content;
  }

  let canonical: string | null = null;
  let hreflangCount = 0;
  for (const m of html.matchAll(/<link\b[^>]*>/gi)) {
    const tag = m[0];
    const rel = (attrOf(tag, 'rel') ?? '').toLowerCase();
    if (rel === 'canonical') canonical = attrOf(tag, 'href');
    if (rel === 'alternate' && attrOf(tag, 'hreflang')) hreflangCount++;
  }

  const anchors: Page['anchors'] = [];
  for (const m of clean.matchAll(/<a\b([^>]*)>([\s\S]*?)<\/a>/gi)) {
    anchors.push({
      href: attrOf(`<a ${m[1]}>`, 'href') ?? '',
      text: stripTags(m[2]).slice(0, 120),
      rel: attrOf(`<a ${m[1]}>`, 'rel') ?? '',
    });
  }

  const images: Page['images'] = [];
  for (const m of clean.matchAll(/<img\b[^>]*>/gi)) {
    images.push({ src: attrOf(m[0], 'src') ?? '', alt: attrOf(m[0], 'alt') });
  }

  const bodyHtml = firstGroup(clean, /<body\b[^>]*>([\s\S]*)<\/body>/i) ?? clean;
  const mainHtml = firstGroup(clean, /<main\b[^>]*>([\s\S]*?)<\/main>/i) ?? bodyHtml;
  const footerHtml = firstGroup(clean, /<footer\b[^>]*>([\s\S]*?)<\/footer>/i) ?? '';

  return {
    url,
    path,
    locale,
    status,
    title: stripTags(firstGroup(html, /<title[^>]*>([\s\S]*?)<\/title>/i) ?? ''),
    metas,
    canonical,
    hreflangCount,
    h1s: allTags(bodyHtml, 'h1'),
    h3s: allTags(bodyHtml, 'h3'),
    anchors,
    images,
    bodyText: stripTags(bodyHtml),
    mainText: stripTags(mainHtml),
    footerText: stripTags(footerHtml),
    robotsNoindex: /noindex/i.test(metas['robots'] ?? ''),
  };
}

// ---------------------------------------------------------------------------
// URL collection
// ---------------------------------------------------------------------------

async function fetchText(url: string): Promise<{ status: number; text: string }> {
  try {
    const res = await fetch(url, {
      headers: { 'user-agent': 'domlivo-content-qa/1.0' },
      redirect: 'follow',
      signal: AbortSignal.timeout(30_000),
    });
    return { status: res.status, text: await res.text() };
  } catch (err) {
    return { status: 0, text: String(err) };
  }
}

function extractLocs(xml: string): string[] {
  return [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => decodeEntities(m[1]).trim());
}

/** Collapse a path to a "shape" so sampling caps apply per page type per locale. */
function groupKey(path: string): string {
  const segs = path.split('/').filter(Boolean);
  const locale = LOCALES.includes(segs[0]) ? segs.shift() : 'en';
  if (segs[0] === 'property') return `${locale}/property/*`;
  if (segs[0] === 'blog' && segs.length > 1) return `${locale}/blog/*`;
  if (segs.includes('districts') && segs.length > 3) return `${locale}/districts/*`;
  if (segs[0] === 'guides') return `${locale}/guides/*`;
  return `${locale}/${segs.join('/')}`;
}

async function collectUrls(base: string, maxPerGroup: number): Promise<string[]> {
  const urls = new Set<string>();
  const { status, text } = await fetchText(`${base}/sitemap.xml`);
  if (status === 200) {
    const children = extractLocs(text);
    for (const child of children) {
      const childUrl = child.replace(/^https?:\/\/[^/]+/, base);
      const res = await fetchText(childUrl);
      if (res.status === 200) for (const loc of extractLocs(res.text)) {
        urls.add(loc.replace(/^https?:\/\/[^/]+/, base));
      }
    }
  }
  for (const locale of LOCALES) {
    for (const route of KNOWN_ROUTES) {
      urls.add(`${base}/${locale}${route ? `/${route}` : ''}`);
    }
  }
  // sample per group
  const grouped = new Map<string, string[]>();
  for (const u of urls) {
    const key = groupKey(new URL(u).pathname);
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key)!.push(u);
  }
  const out: string[] = [];
  for (const [, list] of grouped) {
    list.sort();
    out.push(...(maxPerGroup > 0 ? list.slice(0, maxPerGroup) : list));
  }
  return out;
}

// ---------------------------------------------------------------------------
// rules
// ---------------------------------------------------------------------------

function isListingOrRentRoute(path: string): boolean {
  return /\/(investment|property)\//.test(path) || /\/(rent|short-term-rent)(\/|$)/.test(path);
}

function englishWordHits(text: string): string[] {
  const lower = ` ${text.toLowerCase()} `;
  return EN_COMMON_WORDS.filter((w) => lower.includes(` ${w} `));
}

function runRules(pages: Page[]): Finding[] {
  const findings: Finding[] = [];
  const add = (rule: string, severity: Severity, p: Page, message: string, quote?: string) =>
    findings.push({ rule, severity, url: p.url, locale: p.locale, message, ...(quote ? { quote: quote.slice(0, 160) } : {}) });

  // cross-page accumulators
  const h1ByLocale = new Map<string, Map<string, string[]>>();
  const ogImageCount = new Map<string, string[]>();

  for (const p of pages) {
    if (p.status !== 200) continue;
    const isHome = /^\/[a-z]{2}$/.test(p.path);

    // CQ-01 language leak
    if (p.locale !== 'en') {
      for (const phrase of EN_PHRASES) {
        if (new RegExp(`\\b${phrase}\\b`).test(p.bodyText)) {
          add('CQ-01', 'warning', p, `English UI string on ${p.locale} page: "${phrase}"`);
        }
      }
    }
    if (p.locale === 'ru' || p.locale === 'uk') {
      for (const w of NON_CYRILLIC_UI_WORDS) {
        if (p.mainText.includes(w)) add('CQ-01', 'warning', p, `Non-${p.locale} UI string: "${w}"`);
      }
    }

    // CQ-02 placeholders
    for (const re of [/\bTODO(-CONTENT)?\b/, /\bLorem\b/i, /\bplaceholder\b/i, /\[object /, /\bNaN\b/, /£/]) {
      const m = p.bodyText.match(re);
      if (m) add('CQ-02', 'critical', p, `Placeholder/garbage text: "${m[0]}"`, contextOf(p.bodyText, m.index ?? 0));
    }
    if (/\btest\b/i.test(p.title) || p.h1s.some((h) => /\btest\b/i.test(h))) {
      add('CQ-02', 'warning', p, 'The word "test" in title/H1');
    }

    // CQ-03 thin content (district/city editorial + hubs)
    if (/\/districts\/[^/]+$/.test(p.path) || /\/info$/.test(p.path)) {
      if (p.mainText.length < 200) add('CQ-03', 'warning', p, `Thin page: main text ${p.mainText.length} chars (<200)`);
    }
    if (/\/districts$/.test(p.path) || /\/cities$/.test(p.path)) {
      const sentences = p.mainText.split(/[.!?]/).filter((s) => s.trim().length > 25).length;
      if (sentences < 3) add('CQ-03', 'warning', p, `Hub page with ${sentences} real sentences of copy (one-liner filler)`);
    }

    // CQ-04 sq grammar
    if (p.locale === 'sq') {
      const scope = `${p.title} ${p.h1s.join(' ')} ${p.mainText}`;
      for (const rule of SQ_GRAMMAR_RULES) {
        rule.bad.lastIndex = 0;
        const m = rule.bad.exec(scope);
        if (m) add('CQ-04', 'warning', p, `Albanian grammar: "${m[0]}" → "${rule.good}"`, contextOf(scope, m.index));
      }
    }

    // CQ-05 invalid link shapes (broken-link HEAD pass happens later)
    for (const a of p.anchors) {
      if (/wa\.me\/?$/.test(a.href) || /wa\.me\/(?![+0-9])/.test(a.href)) {
        add('CQ-05', 'warning', p, `WhatsApp link without a phone number: ${a.href}`);
      }
      if (/^https?:\/\/(www\.)?(youtube|facebook|instagram|linkedin)\.com\/?$/.test(a.href)) {
        add('CQ-05', 'warning', p, `Bare social link (no profile path): ${a.href}`);
      }
      if (
        /\/guides\//.test(p.path) &&
        /^https?:\/\//.test(a.href) &&
        !a.href.includes('domlivo') &&
        !a.href.includes('sanity.io') &&
        !/nofollow/.test(a.rel)
      ) {
        add('CQ-05', 'info', p, `External link without rel=nofollow: ${a.href}`);
      }
    }

    // CQ-06 rent leak outside investment/property/rent routes
    if (!isListingOrRentRoute(p.path)) {
      const zones: Array<[string, string]> = [
        ['H1', p.h1s.join(' | ')],
        ['title', p.title],
        ['meta description', p.metas['description'] ?? ''],
      ];
      for (const [zone, text] of zones) {
        const m = text.match(RENT_WORDS);
        if (m) add('CQ-06', isHome ? 'critical' : 'warning', p, `Rent wording in ${zone}: "${m[0]}"`, text);
      }
      const faqLeak = p.mainText.match(/[^.?!]{0,80}(qira|rent|аренд|оренд)[^.?!]{0,80}[.?!]/i);
      if (faqLeak && !/\/blog\//.test(p.path)) {
        add('CQ-06', isHome ? 'critical' : 'warning', p, 'Rent wording in page copy/FAQ', faqLeak[0]);
      }
      for (const a of p.anchors) {
        if (/\/(short-term-rent|rent)(\/|$|\?)/.test(a.href) && !/investment/.test(a.href) && a.text) {
          add('CQ-06', 'critical', p, `Visible link to a rent listing route: "${a.text}" → ${a.href}`);
        }
      }
    }

    // CQ-07 metadata
    const brandHits = (p.title.match(/Domlivo/g) ?? []).length;
    if (brandHits >= 2) add('CQ-07', 'warning', p, `Brand duplicated in title`, p.title);
    if (p.locale !== 'en') {
      for (const key of ['og:title', 'og:description'] as const) {
        const val = p.metas[key];
        if (val && englishWordHits(val).length >= 2) {
          add('CQ-07', 'warning', p, `${key} appears to be English on a ${p.locale} page`, val);
        }
      }
    }
    const og = p.metas['og:image'];
    if (og) {
      if (!ogImageCount.has(og)) ogImageCount.set(og, []);
      ogImageCount.get(og)!.push(p.url);
    } else if (/\/(districts\/[^/]+|guides\/[^/]+|blog\/[^/]+)$/.test(p.path)) {
      add('CQ-07', 'warning', p, 'og:image missing on an editorial page');
    }
    if (!p.robotsNoindex) {
      if (!p.canonical) add('CQ-07', 'critical', p, 'canonical missing on an indexable page');
      if (p.hreflangCount < LOCALES.length) {
        add('CQ-07', 'critical', p, `hreflang incomplete (${p.hreflangCount}/${LOCALES.length + 1} expected)`);
      }
    }

    // CQ-08 empty states
    for (const re of [/Nuk ka [^.<]{0,40} për të shfaqur/i, /No [^.<]{0,40} to show/i]) {
      const inFooter = p.footerText.match(re);
      if (inFooter) add('CQ-08', 'critical', p, 'Empty-state text in the footer', inFooter[0]);
      else {
        const m = p.mainText.match(re);
        if (m) add('CQ-08', isHome ? 'critical' : 'warning', p, 'Empty-state text on the page', m[0]);
      }
    }

    // CQ-09 duplicate card titles within one hub page
    if (/\/(districts|cities)$/.test(p.path)) {
      const seen = new Map<string, number>();
      for (const h of p.h3s) seen.set(h, (seen.get(h) ?? 0) + 1);
      for (const [text, n] of seen) {
        if (n >= 2 && text.length > 2) add('CQ-09', 'warning', p, `Duplicate card title ×${n}: "${text}"`);
      }
    }
    const firstH1 = p.h1s[0];
    if (firstH1) {
      if (!h1ByLocale.has(p.locale)) h1ByLocale.set(p.locale, new Map());
      const map = h1ByLocale.get(p.locale)!;
      if (!map.has(firstH1)) map.set(firstH1, []);
      map.get(firstH1)!.push(p.url);
    }

    // CQ-10 images
    const noAlt = p.images.filter((i) => i.src && (i.alt === null || i.alt === ''));
    if (noAlt.length > 0) add('CQ-10', 'warning', p, `${noAlt.length} <img> without alt`, noAlt[0].src);
    for (const img of p.images) {
      if (
        img.src &&
        /^https?:\/\//.test(img.src) &&
        !/cdn\.sanity\.io|domlivo|localhost|\/_next\/|\/images\//.test(img.src)
      ) {
        add('CQ-10', 'critical', p, `Hotlinked third-party image: ${img.src}`);
      }
    }

    // CQ-11 number formatting
    const glued = p.bodyText.match(/\d+(properties|prona|objekte|об'єкт|объект)/i);
    if (glued) add('CQ-11', 'warning', p, `Number glued to its noun (no space/plural): "${glued[0]}"`);
    if (/€\s*undefined|\bundefined\b|\bnull\b/.test(p.bodyText)) {
      const m = p.bodyText.match(/€\s*undefined|\bundefined\b|\bnull\b/);
      add('CQ-11', 'critical', p, `Unrendered value: "${m![0]}"`, contextOf(p.bodyText, m!.index ?? 0));
    }
  }

  // cross-page: duplicate H1s (skip listing shells that legitimately share H1)
  for (const [locale, map] of h1ByLocale) {
    for (const [h1, urls] of map) {
      const distinctShapes = new Set(urls.map((u) => groupKey(new URL(u).pathname)));
      if (urls.length >= 2 && distinctShapes.size >= 2) {
        findings.push({
          rule: 'CQ-09', severity: 'warning', url: urls.slice(0, 3).join(' , '), locale,
          message: `Same H1 on ${urls.length} different URLs: "${h1}"`,
        });
      }
    }
  }
  // cross-page: generic og:image spread over many editorial pages
  for (const [img, urls] of ogImageCount) {
    const editorial = urls.filter((u) => /\/(districts\/[^/]+|guides\/[^/]+|blog\/[^/]+)$/.test(new URL(u).pathname));
    if (urls.length > 5 && editorial.length > 0) {
      findings.push({
        rule: 'CQ-07', severity: 'warning', url: editorial.slice(0, 3).join(' , '), locale: '*',
        message: `Generic og:image reused on ${urls.length} pages incl. editorial ones: ${img}`,
      });
    }
  }
  return findings;
}

function contextOf(text: string, index: number): string {
  return text.slice(Math.max(0, index - 60), index + 100);
}

// CQ-05: broken internal links (HEAD with GET fallback)
async function checkInternalLinks(base: string, pages: Page[]): Promise<Finding[]> {
  const targets = new Map<string, { from: string; locale: string }>();
  for (const p of pages) {
    for (const a of p.anchors) {
      let href = a.href;
      if (!href || href.startsWith('#') || /^(mailto:|tel:|javascript:)/.test(href)) continue;
      if (/^https?:\/\//.test(href)) {
        if (!href.startsWith(base) && !href.includes('domlivo.com')) continue;
        href = href.replace(/^https?:\/\/[^/]+/, '');
      }
      const abs = `${base}${href.split('#')[0]}`;
      if (!targets.has(abs)) targets.set(abs, { from: p.url, locale: p.locale });
      if (targets.size >= 400) break;
    }
  }
  const findings: Finding[] = [];
  const entries = [...targets.entries()];
  let idx = 0;
  await Promise.all(
    Array.from({ length: 8 }, async () => {
      while (idx < entries.length) {
        const [url, meta] = entries[idx++];
        try {
          let res = await fetch(url, { method: 'HEAD', redirect: 'follow', signal: AbortSignal.timeout(20_000) });
          if (res.status === 405) res = await fetch(url, { method: 'GET', redirect: 'follow', signal: AbortSignal.timeout(20_000) });
          if (res.status === 404 || res.status >= 500) {
            findings.push({
              rule: 'CQ-05', severity: 'critical', url: meta.from, locale: meta.locale,
              message: `Broken internal link (${res.status}): ${url}`,
            });
          }
        } catch {
          findings.push({
            rule: 'CQ-05', severity: 'warning', url: meta.from, locale: meta.locale,
            message: `Internal link did not respond: ${url}`,
          });
        }
      }
    }),
  );
  return findings;
}

// ---------------------------------------------------------------------------
// main
// ---------------------------------------------------------------------------

async function main() {
  const args = process.argv.slice(2);
  const argOf = (name: string) => {
    const i = args.indexOf(name);
    return i >= 0 ? args[i + 1] : undefined;
  };
  const base = (argOf('--base') ?? 'http://localhost:3000').replace(/\/$/, '');
  const strict = args.includes('--strict');
  const maxPerGroup = Number(argOf('--max-per-group') ?? 40);

  console.log(`[content-qa] collecting URLs from ${base} …`);
  const urls = await collectUrls(base, maxPerGroup);
  console.log(`[content-qa] crawling ${urls.length} pages …`);

  const pages: Page[] = [];
  let idx = 0;
  await Promise.all(
    Array.from({ length: 8 }, async () => {
      while (idx < urls.length) {
        const url = urls[idx++];
        const { status, text } = await fetchText(url);
        pages.push(parsePage(url, base, status, text));
        if (pages.length % 50 === 0) console.log(`[content-qa]   ${pages.length}/${urls.length}`);
      }
    }),
  );

  for (const p of pages) {
    if (p.status !== 200 && p.status !== 404) {
      console.log(`[content-qa] note: ${p.url} → HTTP ${p.status}`);
    }
  }

  const findings = [...runRules(pages), ...(await checkInternalLinks(base, pages))];

  const order: Severity[] = ['critical', 'warning', 'info'];
  findings.sort((a, b) => order.indexOf(a.severity) - order.indexOf(b.severity) || a.rule.localeCompare(b.rule));
  const counts = { critical: 0, warning: 0, info: 0 };
  for (const f of findings) counts[f.severity]++;

  const json = { base, generatedAt: new Date().toISOString(), pagesCrawled: pages.length, counts, findings };
  writeFileSync('content-qa-report.json', JSON.stringify(json, null, 2));

  const md: string[] = [
    `# Content QA report`,
    ``,
    `- Base: ${base}`,
    `- Generated: ${json.generatedAt}`,
    `- Pages crawled: ${pages.length}`,
    `- **Critical: ${counts.critical}** · Warning: ${counts.warning} · Info: ${counts.info}`,
    ``,
  ];
  for (const sev of order) {
    const group = findings.filter((f) => f.severity === sev);
    if (group.length === 0) continue;
    md.push(`## ${sev.toUpperCase()} (${group.length})`, ``);
    for (const f of group) {
      md.push(`- **${f.rule}** [${f.locale}] ${f.message}`);
      md.push(`  - ${f.url}`);
      if (f.quote) md.push(`  - > ${f.quote.replace(/\n/g, ' ')}`);
    }
    md.push(``);
  }
  writeFileSync('content-qa-report.md', md.join('\n'));

  console.log(`[content-qa] done: ${counts.critical} critical, ${counts.warning} warning, ${counts.info} info`);
  console.log('[content-qa] wrote content-qa-report.md / content-qa-report.json');
  if (strict && counts.critical > 0) process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
