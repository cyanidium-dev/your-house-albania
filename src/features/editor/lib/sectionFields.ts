import type { AllowedSectionType } from './sectionDefaults';

/** Kind of text input the inspector should render for a given field. */
export type FieldKind = 'text' | 'textarea';

export type FieldDef = {
  /** Dot-notated path into the section object (e.g. `['cta', 'label']`). */
  path: readonly string[];
  /** Human label shown in the inspector. */
  label: string;
  kind: FieldKind;
  /** Optional helper hint under the field. */
  hint?: string;
  /** Optional placeholder. */
  placeholder?: string;
};

/**
 * Curated, section-type-aware editable-field schema.
 *
 * Paths and names must match the Sanity Studio schema at
 * `domlivo-admin/schemaTypes/objects/<section>.ts` exactly — otherwise edits
 * land as orphan fields Studio never displays. This file is the single place
 * where the frontend editor claims knowledge of a CMS shape.
 *
 * CTA labels live under `cta.label` on every section that has a CTA (schema
 * `localizedCtaLink` is an object with `{ href, label: localizedString }`).
 * Only simple short string / textarea values are exposed here — images,
 * references, `content` PortableText, and arrays are left to Studio.
 */
export const SECTION_FIELDS: Partial<Record<AllowedSectionType, readonly FieldDef[]>> = {
  heroSection: [
    { path: ['shortLine'], label: 'Eyebrow', kind: 'text', hint: 'Short trust line above the title' },
    { path: ['title'], label: 'Title', kind: 'textarea' },
    { path: ['subtitle'], label: 'Subtitle', kind: 'textarea' },
    { path: ['cta', 'label'], label: 'Primary button', kind: 'text' },
    { path: ['secondaryCta', 'label'], label: 'Secondary button', kind: 'text' },
    { path: ['seoTextUnderCta'], label: 'Line under buttons', kind: 'text' },
  ],
  propertyCarouselSection: [
    { path: ['shortLine'], label: 'Eyebrow', kind: 'text' },
    { path: ['title'], label: 'Title', kind: 'textarea' },
    { path: ['subtitle'], label: 'Subtitle', kind: 'textarea' },
    { path: ['cta', 'label'], label: 'Button label', kind: 'text' },
  ],
  locationCarouselSection: [
    { path: ['title'], label: 'Title', kind: 'textarea' },
    { path: ['subtitle'], label: 'Subtitle', kind: 'textarea' },
    { path: ['cta', 'label'], label: 'Button label', kind: 'text' },
  ],
  landingCarouselSection: [
    { path: ['title'], label: 'Title', kind: 'textarea' },
    { path: ['subtitle'], label: 'Subtitle', kind: 'textarea' },
    { path: ['cta', 'label'], label: 'Button label', kind: 'text' },
  ],
  propertyTypesSection: [
    { path: ['title'], label: 'Title', kind: 'textarea' },
    { path: ['subtitle'], label: 'Subtitle', kind: 'textarea' },
    { path: ['cta', 'label'], label: 'Button label', kind: 'text' },
  ],
  seoTextSection: [
    { path: ['title'], label: 'Heading', kind: 'textarea' },
    { path: ['category'], label: 'Category chip', kind: 'text', hint: 'e.g. "Market analysis"' },
    { path: ['author', 'name'], label: 'Author name', kind: 'text' },
    { path: ['author', 'role'], label: 'Author role', kind: 'text', hint: 'e.g. "Head of analytics, Domlivo"' },
    { path: ['pullQuote', 'text'], label: 'Pull quote text', kind: 'textarea' },
    { path: ['pullQuote', 'author'], label: 'Pull quote attribution', kind: 'text' },
    { path: ['cta', 'label'], label: 'Button label', kind: 'text' },
  ],
  faqSection: [
    { path: ['title'], label: 'Title', kind: 'textarea' },
    { path: ['subtitle'], label: 'Subtitle', kind: 'textarea' },
    { path: ['callout', 'title'], label: 'Callout title', kind: 'text', hint: 'Sticky brand card title' },
    { path: ['callout', 'subtitle'], label: 'Callout subtitle', kind: 'text' },
    { path: ['callout', 'primaryCta', 'label'], label: 'Callout primary button', kind: 'text' },
    { path: ['callout', 'secondaryCta', 'label'], label: 'Callout secondary button', kind: 'text' },
  ],
  articlesSection: [
    { path: ['title'], label: 'Title', kind: 'textarea' },
    { path: ['subtitle'], label: 'Subtitle', kind: 'textarea' },
    { path: ['cta', 'label'], label: 'Button label', kind: 'text' },
    { path: ['cardCtaLabel'], label: 'Card button label', kind: 'text' },
  ],
  districtsComparisonSection: [
    { path: ['title'], label: 'Title', kind: 'textarea' },
    { path: ['description'], label: 'Description', kind: 'textarea' },
    { path: ['closingText'], label: 'Closing text', kind: 'textarea' },
    { path: ['cta', 'label'], label: 'Button label', kind: 'text' },
  ],
  linkedGallerySection: [
    { path: ['title'], label: 'Title', kind: 'textarea' },
    { path: ['description'], label: 'Description', kind: 'textarea' },
  ],
  landingCollectionSection: [
    { path: ['title'], label: 'Title', kind: 'textarea' },
    { path: ['subtitle'], label: 'Subtitle', kind: 'textarea' },
    { path: ['cta', 'label'], label: 'Button label', kind: 'text' },
  ],
  investorLogosSection: [
    { path: ['title'], label: 'Title', kind: 'textarea' },
    { path: ['description'], label: 'Description', kind: 'textarea' },
  ],
  marketingContentSection: [
    { path: ['eyebrow'], label: 'Eyebrow', kind: 'text' },
    { path: ['title'], label: 'Title', kind: 'textarea' },
    { path: ['subtitle'], label: 'Subtitle', kind: 'textarea' },
    { path: ['description'], label: 'Description', kind: 'textarea' },
    { path: ['supportingText'], label: 'Text below bullets', kind: 'textarea' },
    { path: ['cta', 'label'], label: 'Primary button', kind: 'text' },
    { path: ['secondaryCta', 'label'], label: 'Secondary button', kind: 'text' },
    { path: ['trustStripText'], label: 'Trust strip text', kind: 'text', hint: 'e.g. "10 240 realtors on the platform"' },
  ],
  ctaSection: [
    { path: ['eyebrow'], label: 'Eyebrow', kind: 'text' },
    { path: ['title'], label: 'Title', kind: 'textarea' },
    { path: ['description'], label: 'Description', kind: 'textarea' },
    { path: ['cta', 'label'], label: 'Primary button', kind: 'text' },
    { path: ['secondaryCta', 'label'], label: 'Secondary button', kind: 'text' },
  ],
  // Structural arrays (columns/rows/items/sources) are Studio-only by design.
  priceTableSection: [
    { path: ['title'], label: 'Title', kind: 'textarea' },
    { path: ['subtitle'], label: 'Subtitle', kind: 'textarea' },
    { path: ['sourceNote'], label: 'Source note', kind: 'text', hint: 'Shown under the table' },
    { path: ['cta', 'label'], label: 'Button label', kind: 'text' },
  ],
  statsBandSection: [
    { path: ['title'], label: 'Title', kind: 'textarea' },
    { path: ['sourceNote'], label: 'Source note', kind: 'text', hint: 'Shown under the band' },
  ],
  sourcesSection: [
    { path: ['title'], label: 'Title', kind: 'text' },
    { path: ['intro'], label: 'Intro', kind: 'textarea' },
  ],
  // Only the heading is editable inline: the figures come from `zoneMetrics`,
  // and a number edited on the page would drift from the record.
  zoneStatsAutoSection: [{ path: ['title'], label: 'Title', kind: 'text' }],
  zonePriceTableAutoSection: [
    { path: ['title'], label: 'Title', kind: 'text' },
    { path: ['subtitle'], label: 'Subtitle', kind: 'textarea' },
  ],
  // Numeric defaults and presets/items arrays are Studio-only by design.
  mortgageCalcSection: [
    { path: ['title'], label: 'Title', kind: 'textarea' },
    { path: ['subtitle'], label: 'Subtitle', kind: 'textarea' },
    { path: ['disclaimer'], label: 'Disclaimer', kind: 'textarea', hint: 'Required to publish' },
  ],
  roiCalcSection: [
    { path: ['title'], label: 'Title', kind: 'textarea' },
    { path: ['subtitle'], label: 'Subtitle', kind: 'textarea' },
    { path: ['disclaimer'], label: 'Disclaimer', kind: 'textarea', hint: 'Required to publish' },
  ],
  purchaseCostCalcSection: [
    { path: ['title'], label: 'Title', kind: 'textarea' },
    { path: ['subtitle'], label: 'Subtitle', kind: 'textarea' },
    { path: ['disclaimer'], label: 'Disclaimer', kind: 'textarea', hint: 'Required to publish' },
  ],
  // References (tracker/developer docs) are picked in Studio, not inline.
  trackerSection: [{ path: ['title'], label: 'Title override', kind: 'textarea' }],
  developersRatingSection: [
    { path: ['title'], label: 'Title', kind: 'textarea' },
    { path: ['subtitle'], label: 'Subtitle', kind: 'textarea' },
    { path: ['disclaimer'], label: 'Disclaimer', kind: 'textarea', hint: 'Required to publish' },
  ],
  developerCardSection: [{ path: ['title'], label: 'Title override', kind: 'textarea' }],
};

export function getFieldsForType(type: string): readonly FieldDef[] {
  return (SECTION_FIELDS as Record<string, readonly FieldDef[] | undefined>)[type] ?? [];
}

/** Walk a deep read to fetch value at `path` from `obj`. Returns undefined on miss. */
export function readDeep(obj: unknown, path: readonly string[]): unknown {
  let cur: unknown = obj;
  for (const seg of path) {
    if (!cur || typeof cur !== 'object') return undefined;
    cur = (cur as Record<string, unknown>)[seg];
  }
  return cur;
}

/**
 * Immutable deep-set: return a clone of `obj` with `path` set to `value`.
 * Intermediate missing nodes are created as empty objects.
 */
export function writeDeep(
  obj: Record<string, unknown>,
  path: readonly string[],
  value: unknown,
): Record<string, unknown> {
  if (path.length === 0) return obj;
  const [head, ...rest] = path;
  const next = { ...obj };
  if (rest.length === 0) {
    next[head] = value;
    return next;
  }
  const child = next[head];
  const childObj =
    child && typeof child === 'object' && !Array.isArray(child)
      ? (child as Record<string, unknown>)
      : {};
  next[head] = writeDeep(childObj, rest, value);
  return next;
}

/** Get the localized value at `section[...path][locale]` as a string. */
export function readLocalizedField(
  section: unknown,
  path: readonly string[],
  locale: string,
): string {
  const node = readDeep(section, path);
  if (typeof node === 'string') return node;
  if (node && typeof node === 'object') {
    const loc = (node as Record<string, unknown>)[locale];
    if (typeof loc === 'string') return loc;
    const fallback = (node as Record<string, unknown>).en;
    if (typeof fallback === 'string') return fallback;
  }
  return '';
}

/**
 * Write a localized value. Preserves all other locale keys. If the existing
 * node is a plain string (non-localized legacy value), it is coerced into a
 * localized object with the plain value kept under `en` to avoid data loss.
 */
export function writeLocalizedField(
  section: Record<string, unknown>,
  path: readonly string[],
  locale: string,
  value: string,
): Record<string, unknown> {
  const current = readDeep(section, path);
  let nextNode: Record<string, unknown>;
  if (current && typeof current === 'object' && !Array.isArray(current)) {
    nextNode = { ...(current as Record<string, unknown>), [locale]: value };
  } else if (typeof current === 'string') {
    nextNode = { en: current, [locale]: value };
  } else {
    nextNode = { [locale]: value };
  }
  return writeDeep(section, path, nextNode);
}
