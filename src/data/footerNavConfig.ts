import { NON_GEO_DEAL_NAV_HREF } from "./nonGeoDealNavHref";

/**
 * Stable footer navigation (not CMS-driven). Labels from `Footer.nav.*` translations.
 * Paths match `DRAWER_NAV_ITEMS` / header patterns (locale applied at render).
 */
export const FOOTER_STABLE_NAV_ITEMS = [
  { key: "home", href: "/" },
  { key: "buy", href: NON_GEO_DEAL_NAV_HREF.buy },
  { key: "rent", href: NON_GEO_DEAL_NAV_HREF.rent },
  { key: "shortTermRent", href: NON_GEO_DEAL_NAV_HREF.shortTermRent },
  { key: "cities", href: "/cities" },
  { key: "realtors", href: "/for-realtors" },
  { key: "blog", href: "/blog" },
] as const;
