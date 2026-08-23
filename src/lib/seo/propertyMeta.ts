/**
 * Composes a property's meta title from its own fields, at render time.
 *
 * Not stored, deliberately. A stored title is derived data that drifts, and
 * this project has paid for that twice: the Vlorë listing carried
 * "Price: €169" across twelve stored fields while its price field said
 * €18,421, and thirteen listings named a district months after it was renamed.
 * Composing also covers every listing written from now on, with no backfill.
 *
 * Measured across the 35 published listings on 2026-08-23: 22 titles named
 * neither city nor district, none carried a price, and 29 descriptions ran
 * past the ~160-character SERP cut. That is what this fixes.
 */
export type PropertyMetaTitleInput = {
  typeLabel?: string;
  area?: number;
  district?: string;
  city?: string;
  price?: number;
  status?: string;
  locale: string;
  /** "m²" / "м²", from the message catalogue. */
  areaUnit: string;
  /** "month" / "мес." — the period word on a rental. */
  perMonth: string;
};

function isLease(status?: string): boolean {
  const key = status ? status.toLowerCase() : "";
  return key === "rent" || key === "short-term";
}

export function composePropertyMetaTitle(input: PropertyMetaTitleInput): string | null {
  const { typeLabel, area, district, city, price, status, locale, areaUnit, perMonth } = input;

  // No room count, on purpose. Russian and Ukrainian inflect the adjective to
  // the noun's gender — двухкомнатная квартира against двухкомнатный дом — and
  // Albanian uses the 2+1 notation rather than a count, so a template that
  // counts rooms is wrong in three locales out of five. Size and place are the
  // terms a search query actually carries.
  const head = [
    typeLabel?.trim() || null,
    typeof area === "number" && area > 0 ? `${area} ${areaUnit}` : null,
    district?.trim() || null,
    city?.trim() || null,
  ].filter((part): part is string => Boolean(part));

  const money =
    typeof price === "number" && price > 0
      ? `€${new Intl.NumberFormat(locale).format(price)}${isLease(status) ? `/${perMonth}` : ""}`
      : null;

  // Nothing to compose must never produce a worse title than the fallback the
  // chain already has, so this returns null and lets `itemTitle` through.
  if (head.length === 0) return money;
  return money ? `${head.join(", ")} — ${money}` : head.join(", ");
}

/**
 * The editorial description is good prose whose only problem is length: 29 of
 * 35 exceed the SERP cut and Google truncates them mid-word. This cuts on a
 * word boundary instead, and marks the cut. The body copy on the page is
 * untouched — this is the meta tag only.
 */
export function truncateMetaDescription(
  text: string | undefined | null,
  limit = 155
): string {
  const s = (text ?? "").trim();
  if (!s || s.length <= limit) return s;
  const slice = s.slice(0, limit);
  const lastSpace = slice.lastIndexOf(" ");
  const cut = lastSpace > 0 ? slice.slice(0, lastSpace) : slice;
  return `${cut.replace(/[\s,;:.–—-]+$/, "")}…`;
}
