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
    { key: "realtors", href: "/for-realtors" },
    { key: "blog", href: "/blog" },
  ] as const
).filter((item) => isPublicNavKey(item.key));
