/**
 * Which places an article is about, and which listing and price pages it
 * links to (growth plan B5). Pure: no I/O, no copy. `InventoryLinksSection`
 * fetches the inventory and the indexing decisions and asks these functions
 * what to show.
 *
 * Where the places come from:
 * - a blog post: its reviewed line in `BLOG_POST_LISTING_TOPICS`; a post with
 *   no line falls back to the cities and districts its slug names. `blogPost`
 *   has no city or district field to read instead.
 * - a guide (`landingPage`, pageType `custom`): its `topicTags`, `city:<slug>`
 *   and `zone:<slug>` (a zone is a city or a district; foreign zones such as
 *   `zone:croatia` are dropped).
 *
 * What the places give:
 * - one city: cards from that city (its district first when the article names
 *   one), links to the district/city listing pages, and the city's price index;
 * - several cities: the price index of each, at most three, and cards from the
 *   first;
 * - none: the national price index and cards from the largest city.
 */
import {
  hasMappedListingTopics,
  listingTopicsForBlogPost,
  type BlogListingTopic,
} from "@/lib/blog/postListingTopics";

export type PlaceTopic = BlogListingTopic;

/** The places the site knows: published cities, and each district's city. */
export type PlaceDirectory = {
  cities: readonly string[];
  /** District slug → its city's slug. */
  districtCity: Readonly<Record<string, string>>;
};

/** Price index links per article. More reads as a directory, not a pointer. */
export const MAX_INDEX_CITIES = 3;
/** Listing cards per article. */
export const INVENTORY_CARD_COUNT = 3;

/**
 * Spellings an English slug uses for a city whose CMS slug is the Albanian
 * indefinite form: `saranda-…` is Sarandë (`sarande`), `vlora-…` is Vlorë.
 */
const CITY_SLUG_ALIASES: Readonly<Record<string, string>> = {
  saranda: "sarande",
  sarande: "sarande",
  vlora: "vlore",
  vlore: "vlore",
  tirane: "tirana",
  tirana: "tirana",
  durres: "durres",
  durresi: "durres",
  himara: "himare",
  himare: "himare",
  shkodra: "shkoder",
  shkoder: "shkoder",
  shengjin: "shengjin",
};

const norm = (v: unknown): string => (typeof v === "string" ? v.trim().toLowerCase() : "");

export function topicKey(topic: PlaceTopic): string {
  return [topic.city, topic.district ?? "", topic.type ?? ""].join("|");
}

function dedupeTopics(topics: readonly PlaceTopic[]): PlaceTopic[] {
  const seen = new Set<string>();
  const out: PlaceTopic[] = [];
  for (const t of topics) {
    const k = topicKey(t);
    if (seen.has(k)) continue;
    seen.add(k);
    out.push(t);
  }
  return out;
}

/** A zone or slug token as a topic: a city, a district under its city, or nothing. */
function placeTopic(slug: string, dir: PlaceDirectory): PlaceTopic | null {
  const s = norm(slug);
  if (!s) return null;
  if (dir.cities.includes(s)) return { city: s };
  const city = dir.districtCity[s];
  if (city && dir.cities.includes(city)) return { city, district: s };
  return null;
}

/**
 * Places a slug names, in the order it names them: `saranda-apartment-prices`
 * → Sarandë, `golem-sewage-buying` → Golem under Durrës. District slugs can
 * span tokens (`mali-i-robit`), so the longest match wins.
 */
export function inferTopicsFromSlug(slug: string, dir: PlaceDirectory): PlaceTopic[] {
  const tokens = norm(slug).split("-").filter(Boolean);
  const out: PlaceTopic[] = [];
  for (let i = 0; i < tokens.length; i++) {
    let matched = 0;
    for (let len = Math.min(4, tokens.length - i); len >= 1; len--) {
      const joined = tokens.slice(i, i + len).join("-");
      const alias = len === 1 ? CITY_SLUG_ALIASES[joined] : undefined;
      const topic = placeTopic(alias ?? joined, dir);
      if (topic) {
        out.push(topic);
        matched = len;
        break;
      }
    }
    if (matched > 1) i += matched - 1;
  }
  return dedupeTopics(out);
}

/** A blog post's places: the reviewed map first, else what its slug names. */
export function blogPostTopics(slug: string, dir: PlaceDirectory): PlaceTopic[] {
  if (hasMappedListingTopics(slug)) {
    return dedupeTopics(listingTopicsForBlogPost(slug).filter((t) => dir.cities.includes(norm(t.city))));
  }
  return inferTopicsFromSlug(slug, dir);
}

/** A guide's places from its `topicTags` (`city:` and `zone:` keys, in tag order). */
export function guideTopics(topicTags: unknown, dir: PlaceDirectory): PlaceTopic[] {
  if (!Array.isArray(topicTags)) return [];
  const out: PlaceTopic[] = [];
  for (const raw of topicTags) {
    const tag = norm(raw);
    const m = /^(city|zone):(.+)$/.exec(tag);
    if (!m) continue;
    const topic = m[1] === "city" ? (dir.cities.includes(m[2]) ? { city: m[2] } : null) : placeTopic(m[2], dir);
    if (topic) out.push(topic);
  }
  // `city:durres` and `zone:durres` on the same guide are one place.
  return dedupeTopics(out);
}

/** Cities of the topics, first mention first. */
export function topicCities(topics: readonly PlaceTopic[]): string[] {
  return [...new Set(topics.map((t) => t.city))];
}

export type InventoryLinkPlan = {
  kind: "city" | "cities" | "national";
  /** Cities whose price index (`/info`) the article links, at most three. */
  indexCities: string[];
  /** Listing queries the cards are filled from, in order, until there are enough. */
  cardSources: PlaceTopic[];
  /** Listing pages to link, before the indexing check. */
  catalogTopics: PlaceTopic[];
};

export function planInventoryLinks(
  topics: readonly PlaceTopic[],
  opts: { fallbackCity: string },
): InventoryLinkPlan {
  const clean = dedupeTopics(topics);
  const cities = topicCities(clean);
  if (cities.length === 0) {
    const city = { city: opts.fallbackCity };
    return { kind: "national", indexCities: [], cardSources: [city], catalogTopics: [city] };
  }
  const first = cities[0];
  // The first city's own topics in the order written (a district before the
  // whole city when the article names one), then the whole city, then the
  // other cities only to make up a short row.
  const cardSources = dedupeTopics([
    ...clean.filter((t) => t.city === first && t.district),
    ...clean.filter((t) => t.city === first && !t.district),
    { city: first },
    ...cities.slice(1).map((city) => ({ city })),
  ]);
  return {
    kind: cities.length === 1 ? "city" : "cities",
    indexCities: cities.slice(0, MAX_INDEX_CITIES),
    cardSources,
    catalogTopics: clean,
  };
}

/**
 * The listing page a topic links to, following the codebase's rule for links
 * (`districtLinkTargets`, `hubCities`): only a page the SEO registry indexes
 * in this locale. A district or typed page that is not falls back to its
 * city's page; a city page that is not is not linked. Duplicates collapse.
 */
export function resolveCatalogTargets(
  topics: readonly PlaceTopic[],
  isIndexable: (topic: PlaceTopic) => boolean,
): PlaceTopic[] {
  const out: PlaceTopic[] = [];
  for (const topic of topics) {
    let target: PlaceTopic | null = null;
    if ((topic.district || topic.type) && isIndexable(topic)) target = topic;
    else if (isIndexable({ city: topic.city })) target = { city: topic.city };
    if (target) out.push(target);
  }
  return dedupeTopics(out);
}

/**
 * The cards: up to `count`, sources in order, listings with a photo before
 * those without, never the same listing twice or one the page already shows.
 */
export function pickInventoryCards<T extends { slug: string; images?: readonly unknown[] }>(
  batches: readonly (readonly T[])[],
  opts: { count?: number; exclude?: readonly string[] } = {},
): T[] {
  const count = opts.count ?? INVENTORY_CARD_COUNT;
  const taken = new Set(opts.exclude ?? []);
  const out: T[] = [];
  for (const withPhoto of [true, false]) {
    for (const batch of batches) {
      for (const item of batch) {
        if (out.length >= count) return out;
        if (!item.slug || taken.has(item.slug)) continue;
        if ((item.images?.length ?? 0) > 0 !== withPhoto) continue;
        taken.add(item.slug);
        out.push(item);
      }
    }
  }
  return out;
}

/** The national fallback's city: the one with the most listings. */
export function largestCity(rows: readonly { city: string; count: number }[], fallback = "durres"): string {
  let best: { city: string; count: number } | null = null;
  for (const row of rows) if (!best || row.count > best.count) best = row;
  return best?.city || fallback;
}
