/**
 * English left on the French pilot's indexed pages.
 *
 * The pilot's Sanity text is translated in the repository
 * (src/data/contentTranslations/fr.json), looked up by the English source.
 * When an editor changes that English text in Sanity, or a new listing
 * appears on a Durrës catalogue page, the page shows English again. This
 * fetches every pilot page in French and in English and prints the visible
 * strings the two share: each is an untranslated text (or a name that is
 * the same in both languages, which is fine).
 *
 * Run:  node scripts/contentTranslationsCoverage.ts --base https://www.domlivo.com
 * Node >= 22.6 (native TypeScript type-stripping; no deps).
 */

// A computed specifier: Node runs the .ts file directly, and the app's type
// check (which does not allow `.ts` import paths) leaves it alone.
const configUrl = new URL("../src/lib/frenchPilot/config.ts", import.meta.url).href;
const {
  FRENCH_GUIDE_PATHS,
  FRENCH_HUB_PATH,
  FRENCH_PILOT_CITY,
  FRENCH_PILOT_DISTRICTS,
  FRENCH_PILOT_LISTINGS,
} = (await import(configUrl)) as typeof import("../src/lib/frenchPilot/config");

const arg = (name: string, fallback: string) => {
  const i = process.argv.indexOf(name);
  return i > 0 && process.argv[i + 1] ? process.argv[i + 1] : fallback;
};
const base = arg("--base", "https://www.domlivo.com").replace(/\/$/, "");

/** French path → the English page to compare with (null: French only, compared with nothing). */
const pages: Array<[string, string | null]> = [
  [`/fr/${FRENCH_HUB_PATH}`, null],
  ...Object.values(FRENCH_GUIDE_PATHS).map((g: string): [string, null] => [`/fr/${FRENCH_HUB_PATH}/${g}`, null]),
  [`/fr/albania/${FRENCH_PILOT_CITY}`, `/en/albania/${FRENCH_PILOT_CITY}`],
  ...FRENCH_PILOT_DISTRICTS.map((d: string): [string, string] => [`/fr/albania/${FRENCH_PILOT_CITY}/${d}`, `/en/albania/${FRENCH_PILOT_CITY}/${d}`]),
  ...FRENCH_PILOT_LISTINGS.map((s: string): [string, string] => [`/fr/property/${s}`, `/en/property/${s.replace(/^appartement-/, "apartment-")}`]),
];

const decode = (s: string) =>
  s.replace(/&amp;/g, "&").replace(/&#x27;|&#39;/g, "'").replace(/&quot;/g, '"').replace(/&nbsp;/g, " ");

function visibleTexts(html: string): Set<string> {
  const body = html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<svg[\s\S]*?<\/svg>/gi, " ");
  const out = new Set<string>();
  for (const m of body.matchAll(/>([^<>]+)</g)) {
    const t = decode(m[1]).replace(/\s+/g, " ").trim();
    if (t) out.add(t);
  }
  for (const m of html.matchAll(/<meta (?:name|property)="(?:description|og:title|og:description)" content="([^"]+)"/g)) {
    out.add(decode(m[1]).trim());
  }
  return out;
}

/** Two words of three letters or more: a sentence or a title, not a place name or a number. */
const looksLikeText = (t: string) => /[a-z]{3,}\W+[a-z]{3,}/i.test(t) && !/^https?:/.test(t);

let total = 0;
for (const [frPath, enPath] of pages) {
  const frRes = await fetch(base + frPath);
  if (!frRes.ok) {
    console.log(`\n${frPath}: HTTP ${frRes.status}`);
    total++;
    continue;
  }
  const fr = visibleTexts(await frRes.text());
  if (!enPath) continue;
  const en = visibleTexts(await (await fetch(base + enPath)).text());
  const same = [...fr].filter((t) => en.has(t) && looksLikeText(t));
  if (same.length === 0) continue;
  total += same.length;
  console.log(`\n${frPath} (${same.length})`);
  for (const t of same) console.log(`  - ${t.slice(0, 160)}`);
}
console.log(total === 0 ? "\nNo English left on the pilot pages." : `\n${total} strings to check.`);
