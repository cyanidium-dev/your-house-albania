import type { EditorSection } from '../state/types';

/**
 * Section types the editor is allowed to insert.
 * 1:1 with the registry at `src/components/landing/sectionRenderers/registry.tsx`.
 * Extend when the CMS gains a new landing section type.
 */
export const ALLOWED_SECTION_TYPES = [
  'heroSection',
  'propertyCarouselSection',
  'locationCarouselSection',
  'landingCarouselSection',
  'propertyTypesSection',
  'seoTextSection',
  'faqSection',
  'articlesSection',
  'districtsComparisonSection',
  'linkedGallerySection',
  'landingCollectionSection',
  'investorLogosSection',
  'marketingContentSection',
  'ctaSection',
  'priceTableSection',
  'statsBandSection',
  'sourcesSection',
  'mortgageCalcSection',
  'roiCalcSection',
  'purchaseCostCalcSection',
  'trackerSection',
  'developersRatingSection',
  'developerCardSection',
] as const;

export type AllowedSectionType = (typeof ALLOWED_SECTION_TYPES)[number];

export function isAllowedSectionType(t: unknown): t is AllowedSectionType {
  return typeof t === 'string' && (ALLOWED_SECTION_TYPES as readonly string[]).includes(t);
}

/** Friendly labels used in the add-section chooser and inspector. */
export const SECTION_LABELS: Record<AllowedSectionType, string> = {
  heroSection: 'Hero',
  propertyCarouselSection: 'Property carousel',
  locationCarouselSection: 'Cities carousel',
  landingCarouselSection: 'Landings carousel',
  propertyTypesSection: 'Property types',
  seoTextSection: 'SEO text',
  faqSection: 'FAQ',
  articlesSection: 'Blog articles',
  districtsComparisonSection: 'Districts comparison',
  linkedGallerySection: 'Linked gallery',
  landingCollectionSection: 'Landing collection',
  investorLogosSection: 'Investor logos',
  marketingContentSection: 'Marketing content',
  ctaSection: 'CTA',
  priceTableSection: 'Data table (prices)',
  statsBandSection: 'Key figures band',
  sourcesSection: 'Sources & methodology',
  mortgageCalcSection: 'Mortgage calculator',
  roiCalcSection: 'Rental ROI calculator',
  purchaseCostCalcSection: 'Purchase cost calculator',
  trackerSection: 'Status tracker',
  developersRatingSection: 'Developers rating',
  developerCardSection: 'Developer card',
};

/**
 * Generates a Sanity-style array item key — 12 hex chars, same shape Studio emits.
 * Avoids any crypto API that is not available in all runtimes.
 */
export function generateSectionKey(): string {
  const bytes = new Uint8Array(6);
  if (typeof crypto !== 'undefined' && 'getRandomValues' in crypto) {
    crypto.getRandomValues(bytes);
  } else {
    for (let i = 0; i < bytes.length; i++) bytes[i] = Math.floor(Math.random() * 256);
  }
  let out = '';
  for (const b of bytes) out += b.toString(16).padStart(2, '0');
  return out;
}

/**
 * Safe minimal body for an inserted section. Only `_type` is guaranteed —
 * everything else is optional in Studio so the editor creates near-empty
 * sections that the content team fills in after save.
 */
export function createSectionDefaults(type: AllowedSectionType): EditorSection {
  const base: EditorSection = {
    _key: generateSectionKey(),
    _type: type,
  };

  // Type-specific hints kept deliberately tiny. Anything richer belongs in
  // Studio where localization + references are first-class.
  switch (type) {
    case 'seoTextSection':
      return { ...base, content: 'New SEO text — edit in Sanity Studio.' };
    case 'ctaSection':
      return { ...base, title: 'New CTA' };
    case 'heroSection':
      return { ...base, title: 'New hero' };
    case 'sourcesSection':
      return { ...base, title: 'Sources' };
    // Calculators ship with a disclaimer stub (schema requires it to publish)
    // and, for purchase cost, structural item stubs the editor rewrites.
    case 'mortgageCalcSection':
      return {
        ...base,
        disclaimer:
          'Indicative calculation. Rates and limits are decided by the bank individually.',
      };
    case 'roiCalcSection':
      return {
        ...base,
        disclaimer:
          'Conservative estimate. Actual rental income varies by season and property.',
      };
    case 'developersRatingSection':
      return {
        ...base,
        mode: 'all',
        disclaimer:
          'Editorial assessment based on public sources. A mention in a legal case is not a verdict.',
      };
    case 'purchaseCostCalcSection':
      return {
        ...base,
        disclaimer:
          'Typical costs; the exact amounts depend on the deal. Verify with a lawyer and notary.',
        items: [
          {
            _key: generateSectionKey(),
            _type: 'object',
            label: 'Notary (~0.35%)',
            kind: 'percent',
            value: 0.35,
            capEur: 1500,
          },
          {
            _key: generateSectionKey(),
            _type: 'object',
            label: 'Registration fees (ASHK)',
            kind: 'fixed',
            value: 60,
          },
          {
            _key: generateSectionKey(),
            _type: 'object',
            label: 'Agent fee (~1%)',
            kind: 'percent',
            value: 1,
          },
          {
            _key: generateSectionKey(),
            _type: 'object',
            label: 'Legal check',
            kind: 'fixed',
            value: 800,
          },
        ],
      };
    default:
      return base;
  }
}
