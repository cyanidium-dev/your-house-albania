/** Values accepted by `/properties` search `deal` param (see PropertyList DEAL_TYPE_VALUES). */
export type PropertiesDealParam = "sale" | "rent" | "short-term";

function normalizeKey(s: string): string {
  return s.trim().toLowerCase().replace(/[\s_-]+/g, "");
}

function dealFromNormalizedKey(key: string): PropertiesDealParam | undefined {
  if (!key) return undefined;
  if (key.includes("shortterm")) return "short-term";
  if (key === "sale" || key === "forsale") return "sale";
  if (key === "rent" || key === "rental" || key === "longtermrent") return "rent";
  return undefined;
}

/**
 * Derives catalog `deal` query param from landing `pageType` and/or document `slug`
 * (e.g. slug `short-term-rent` → `short-term`). First match wins: pageType, then slug.
 */
export function propertiesDealFromLandingContext(input: {
  pageType?: string | null;
  slug?: string | null;
}): PropertiesDealParam | undefined {
  const keys = [input.pageType, input.slug]
    .filter((v): v is string => typeof v === "string" && v.trim() !== "")
    .map(normalizeKey);

  for (const key of keys) {
    const deal = dealFromNormalizedKey(key);
    if (deal) return deal;
  }
  return undefined;
}
