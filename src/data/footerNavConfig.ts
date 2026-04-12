/**
 * Stable footer navigation (not CMS-driven). Labels from `Footer.nav.*` translations.
 * Paths match `DRAWER_NAV_ITEMS` / header patterns (locale applied at render).
 */
export const FOOTER_STABLE_NAV_ITEMS = [
  { key: "home", href: "/" },
  { key: "buy", href: "/investment/sale" },
  { key: "rent", href: "/investment/rent" },
  { key: "shortTermRent", href: "/investment/short-term-rent" },
  { key: "cities", href: "/cities" },
  { key: "realtors", href: "/for-realtors" },
  { key: "blog", href: "/blog" },
] as const;
