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
