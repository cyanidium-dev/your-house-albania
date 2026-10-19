import { ADD_PROPERTY_HREF } from "./navConfig";

/**
 * Footer groups (not CMS-driven). Labels from `Footer.nav.*`; the locale is
 * prefixed at render time. The CMS still supplies the city list (Property
 * column), the guide links (Useful column) and the policy links (credits row).
 *
 * Rebuilt 2026-09-26 with the header (docs/ux/IA-AUDIT-2026-09-26.md). The
 * footer stopped mirroring the site map: the investment landing (a noindex
 * duplicate of /sale) and the realtor landing (0 clicks in 3 months) are out,
 * the contact page and the "list your property" note are in.
 */
export type FooterNavItem = { key: string; href: `/${string}` };

/** Property column: the national hub first, the CMS cities, then the hub of cities. */
export const FOOTER_PROPERTY_HEAD: readonly FooterNavItem[] = [
  { key: "allListings", href: "/sale" },
];
export const FOOTER_PROPERTY_TAIL: readonly FooterNavItem[] = [
  { key: "allCities", href: "/cities" },
];

/** Useful column: after the CMS guide links. */
export const FOOTER_USEFUL_ITEMS: readonly FooterNavItem[] = [
  { key: "blog", href: "/blog" },
];

/** Company column. */
export const FOOTER_COMPANY_ITEMS: readonly FooterNavItem[] = [
  { key: "about", href: "/about" },
  { key: "contacts", href: "/contacts" },
  { key: "addProperty", href: ADD_PROPERTY_HREF },
];

/** Every code-defined footer link, for tests and for the sitemap of internal links. */
export const FOOTER_STABLE_NAV_ITEMS: readonly FooterNavItem[] = [
  ...FOOTER_PROPERTY_HEAD,
  ...FOOTER_PROPERTY_TAIL,
  ...FOOTER_USEFUL_ITEMS,
  ...FOOTER_COMPANY_ITEMS,
];

/**
 * The single-language lead landing of each locale (Sanity
 * `landing-unique-<locale>-<slug>`, built 2026-10-11 from Ahrefs demand).
 * Linked from the Property column so every page passes it an internal link;
 * before this the landings were reachable only from the sitemap.
 */
export const FOOTER_LEAD_LANDING: Readonly<Record<string, `/${string}`>> = {
  en: "/property-for-sale-albania-by-the-sea",
  de: "/immobilien-albanien-am-meer",
  pl: "/nieruchomosci-albania-nad-morzem",
  it: "/comprare-casa-in-albania",
  ru: "/kupit-kvartiru-v-albanii",
  uk: "/kupyty-kvartyru-v-albanii",
  sq: "/apartamente-ne-shitje-durres-okazion",
};

/**
 * The market guide of the three markets with their own article series
 * (track B of the Q4 plan, 2026-10-19): Germany's buying guide, the Polish
 * buyers' guide and the Albanian reference prices. Linked from the Useful
 * column so every page in that locale passes them an internal link.
 */
export const FOOTER_MARKET_GUIDE: Readonly<Record<string, `/${string}`>> = {
  de: "/blog/buying-property-albania-from-germany-2026",
  pl: "/blog/albania-property-for-polish-buyers-2026",
  sq: "/blog/albania-reference-prices-2026-by-city",
};
