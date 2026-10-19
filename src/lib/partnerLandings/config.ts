/**
 * Partner selection landings: one page per place (or named complex) where a
 * partner agency has enough stock for the page to say something a district
 * catalogue does not — the layouts on offer, the asking prices against the
 * district median, how far from the sea, what is still being built.
 *
 * Why this is code and not a CMS document: the production dataset sits at
 * 2,026 of its 2,000 attribute paths (checked 2026-10-20), so a new document
 * type with seven localized fields cannot be written until the owner raises
 * the plan or trims unused fields. Everything on these pages is computed from
 * the listings themselves (`facts.ts`) and worded in `messages/*.json`
 * (`PartnerLanding`); the only hand-written part is this list.
 *
 * Rule from the SEO hypotheses of 2026-10-19: while 42 % of listings are not
 * indexed, new URLs are few and each must carry unique content, so a landing
 * exists only where the partner has at least `PARTNER_LANDING_MIN_LISTINGS`
 * flats (the page noindexes itself below that), and only for the places that
 * met it on 2026-10-20: Plazh 93, Golem 73, Shkëmbi i Kavajës 43, Durrës
 * centre 27, Mali i Robit 20, Shëngjin 18, Qerret 6, and the Tocak complex in
 * Plazh (11). Tirana, Vlorë, Sarandë and Currila had 3–10 scattered listings
 * and no page.
 */

export const PARTNER_SLUG = "cactus";
export const PARTNER_NAME = "Cactus Real Estate";

/** Fewer flats than this and the page is rendered `noindex`: a selection of three is a filter, not a page. */
export const PARTNER_LANDING_MIN_LISTINGS = 5;

/** Flats only: a plot of land on a "flats by the sea" page would be wrong, and land has no price per m² a flat can be compared with. */
export const PARTNER_LANDING_TYPES: readonly string[] = ["apartment", "studio", "penthouse"];

/** Cards on the page; the rest are one click away on the agency's catalogue. */
export const PARTNER_LANDING_GRID_SIZE = 12;

export type PartnerLandingPlace = {
  country: string;
  city: string;
  district?: string;
};

export type PartnerLandingComplex = {
  /** The complex as the listings name it ("Tocak"). Same in every language. */
  name: string;
  /** Matches the listing's English title or description. */
  pattern: RegExp;
};

export type PartnerLanding = {
  /** URL segment under `/{locale}/partners/cactus/`. */
  slug: string;
  place: PartnerLandingPlace;
  /** Set on a page about one named complex; the selection is then the place's listings that name it. */
  complex?: PartnerLandingComplex;
  /** The page's copy last changed (sitemap `lastmod`); the figures change hourly. */
  lastModified: string;
};

const DURRES = { country: "albania", city: "durres" } as const;

/**
 * Complexes the listings name, from the geo work of 2026-10-10 (workspace
 * `geo/complex-hits.json`). A page shows the ones at least two of its listings
 * mention; `Tocak` is also a page of its own.
 */
export const KNOWN_COMPLEXES: readonly PartnerLandingComplex[] = [
  { name: "Tocak", pattern: /\bTocak\b/i },
  { name: "Liburna", pattern: /\bLiburna\b/i },
  { name: "Rotondo", pattern: /\bRotondo\b/i },
  { name: "Pelican", pattern: /\bPeli[ck]an\b/i },
  { name: "Florida", pattern: /\bFlorida\b/i },
  { name: "Spar", pattern: /\bSpar\b/i },
  { name: "Wilson", pattern: /\bWilson\b/i },
  { name: "White Hill", pattern: /\bWhite\s+Hill\b/i },
  { name: "Dyrrakium", pattern: /\bDyrrakium\b/i },
  { name: "Villa One", pattern: /\bVilla\s+One\b/i },
  { name: "Iliada", pattern: /\bIliada\b/i },
  { name: "Vala Park", pattern: /\bVala\s+Park\b/i },
  { name: "Sunsea", pattern: /\bSunsea\b/i },
  { name: "Vjena", pattern: /\bVjena\b/i },
  { name: "Palm Paradise", pattern: /\bPalm\s+Paradise\b/i },
  { name: "Adriatic Garden", pattern: /\bAdriatic\s+Garden\b/i },
  { name: "Alb Adriatik", pattern: /\bAlb[\s-]+Adriatik\b/i },
  { name: "Blue Star", pattern: /\bBlue\s+Star\b/i },
];

const TOCAK = KNOWN_COMPLEXES[0];

export const PARTNER_LANDINGS: readonly PartnerLanding[] = [
  { slug: "plazh-durres", place: { ...DURRES, district: "plazh" }, lastModified: "2026-10-20" },
  { slug: "golem-durres", place: { ...DURRES, district: "golem-durres" }, lastModified: "2026-10-20" },
  { slug: "shkembi-i-kavajes-durres", place: { ...DURRES, district: "shkembi-durres" }, lastModified: "2026-10-20" },
  { slug: "durres-city-centre", place: { ...DURRES, district: "city-center-durres" }, lastModified: "2026-10-20" },
  { slug: "mali-i-robit-durres", place: { ...DURRES, district: "mali-i-robit" }, lastModified: "2026-10-20" },
  { slug: "qerret-durres", place: { ...DURRES, district: "qerret" }, lastModified: "2026-10-20" },
  { slug: "shengjin", place: { country: "albania", city: "shengjin" }, lastModified: "2026-10-20" },
  { slug: "tocak-plazh-durres", place: { ...DURRES, district: "plazh" }, complex: TOCAK, lastModified: "2026-10-20" },
];

export function findPartnerLanding(slug: string | null | undefined): PartnerLanding | null {
  const wanted = (slug ?? "").trim().toLowerCase();
  return PARTNER_LANDINGS.find((l) => l.slug === wanted) ?? null;
}

/** Path after the locale, no leading slash: `partners/cactus/plazh-durres`. */
export function partnerLandingPathAfterLocale(landing: Pick<PartnerLanding, "slug">): string {
  return `partners/${PARTNER_SLUG}/${landing.slug}`;
}

export function partnerLandingPath(locale: string, landing: Pick<PartnerLanding, "slug">): string {
  return `/${locale}/${partnerLandingPathAfterLocale(landing)}`;
}

/**
 * The place page a city or district catalogue links to: the place's own
 * landing, never a complex page (that one is linked from the place landing).
 */
export function partnerLandingForPlace(place: { city: string; district?: string | null }): PartnerLanding | null {
  const city = place.city.trim().toLowerCase();
  const district = (place.district ?? "").trim().toLowerCase() || undefined;
  return (
    PARTNER_LANDINGS.find(
      (l) => !l.complex && l.place.city === city && (l.place.district ?? undefined) === district,
    ) ?? null
  );
}

/** The other pages a landing links to: the same city's places first, then the rest. */
export function siblingPartnerLandings(landing: PartnerLanding): PartnerLanding[] {
  return PARTNER_LANDINGS.filter((l) => l.slug !== landing.slug).sort((a, b) => {
    const sameA = a.place.city === landing.place.city ? 0 : 1;
    const sameB = b.place.city === landing.place.city ? 0 : 1;
    return sameA - sameB;
  });
}
