import { NON_GEO_DEAL_NAV_HREF } from "./nonGeoDealNavHref";
import { isPublicNavKey } from "./navConfig";

/**
 * Stable footer navigation (not CMS-driven). Labels from `Footer.nav.*` translations.
 * Paths match `DRAWER_NAV_ITEMS` / header patterns (locale applied at render).
 * Deal items are filtered by `PUBLIC_DEAL_TYPES` (rentals hidden from the UI).
 */
export const FOOTER_STABLE_NAV_ITEMS = (
  [
    { key: "home", href: "/" },
    { key: "buy", href: NON_GEO_DEAL_NAV_HREF.buy },
    { key: "rent", href: NON_GEO_DEAL_NAV_HREF.rent },
    { key: "shortTermRent", href: NON_GEO_DEAL_NAV_HREF.shortTermRent },
    { key: "cities", href: "/cities" },
    // The investment landings had no inbound link anywhere on the site — not
    // from the homepage, the catalogue, /cities or any city page — so they were
    // reachable only from a sitemap (SEO-08 audit, 02.09.2026). Only the sale
    // page is listed: /investment/rent and /investment/short-term-rent describe
    // the rental vertical, which is hidden from the UI by PUBLIC_DEAL_TYPES.
    { key: "investment", href: "/investment/sale" },
    { key: "realtors", href: "/for-realtors" },
    { key: "blog", href: "/blog" },
  ] as const
).filter((item) => isPublicNavKey(item.key));
