import type { Metadata } from 'next'
import { buildHreflangAlternates } from '@/lib/seo/hreflang'
import { indexingDisabledRobots, isIndexingEnabled } from '@/lib/seo/envSeo'
import { getSiteBaseUrl } from '@/lib/siteUrl'
import { withBrand } from '@/lib/seo/brandTitle'
import { resolveLocalizedString } from './localized'
import {
  buildMetadata,
  pickAbsoluteOgImageUrl,
  resolveChainedDescription,
  resolveChainedTitle,
  type LocalizedField,
} from './socialMetadataResolution'

export type LandingSeoObject = {
  metaTitle?: LocalizedField
  metaDescription?: LocalizedField
  ogTitle?: LocalizedField
  ogDescription?: LocalizedField
  ogImage?: { asset?: { url?: string } }
  keywords?: LocalizedField
  canonicalUrl?: string | LocalizedField
  noIndex?: boolean
  noFollow?: boolean
}

export type LandingSeo = LandingSeoObject | null

type SiteDefaultSeo = {
  metaTitle?: LocalizedField
  metaDescription?: LocalizedField
  ogImage?: { asset?: { url?: string } }
  noIndex?: boolean
  noFollow?: boolean
} | null

export type LandingMetadataItemContext = {
  /** landingPage.title or linked city title, localized by caller */
  itemTitle?: string
  /** subtitle, cardDescription, linkedCity.shortDescription, etc. */
  itemDescription?: string
  /** Hero / linked city image URL */
  itemOgImageUrl?: string
  /** Path after locale (e.g. `/cities`, `/sale`). Used for hreflang alternates. */
  pathnameForAlternates?: string
  /** `landingPage.contentUpdatedAt` (date string) → `article:modified_time`. */
  contentUpdatedAt?: string
}

function resolveModifiedTimeIso(raw: string | undefined): string | undefined {
  if (!raw) return undefined
  const d = new Date(raw)
  return Number.isNaN(d.getTime()) ? undefined : d.toISOString()
}

function resolveCanonicalUrl(
  raw: LandingSeoObject['canonicalUrl'] | null | undefined,
  locale: string,
): string | undefined {
  if (!raw) return undefined
  if (typeof raw === 'string') return raw
  const val = resolveLocalizedString(raw as never, locale)
  return val?.trim() ? val.trim() : undefined
}

function resolveKeywords(raw: LandingSeoObject['keywords'] | null | undefined, locale: string): string[] | undefined {
  const str = resolveLocalizedString(raw as never, locale)
  const items = str
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
  return items.length ? items : undefined
}

/**
 * landingPage.seo → Next Metadata (home, cities index, city detail landings).
 * Title/description: og → meta → item (optional) → site default → template.
 * Images: landing seo.ogImage → item image → site defaultSeo.ogImage
 * Twitter: same resolved title/description as metadata / Open Graph (no separate CMS Twitter fields).
 */
export function buildLandingMetadata(
  landingSeo: LandingSeo | undefined,
  siteDefaultSeo: SiteDefaultSeo | undefined,
  locale: string,
  itemContext?: LandingMetadataItemContext,
): Metadata {
  const title = resolveChainedTitle(locale, {
    ogTitle: landingSeo?.ogTitle,
    metaTitle: landingSeo?.metaTitle,
    itemTitle: itemContext?.itemTitle,
    siteMetaTitle: siteDefaultSeo?.metaTitle,
  })

  const description = resolveChainedDescription(locale, {
    ogDescription: landingSeo?.ogDescription,
    metaDescription: landingSeo?.metaDescription,
    itemDescription: itemContext?.itemDescription,
    siteMetaDescription: siteDefaultSeo?.metaDescription,
  })

  const ogImageAbsolute = pickAbsoluteOgImageUrl(
    landingSeo?.ogImage?.asset?.url,
    itemContext?.itemOgImageUrl,
    siteDefaultSeo?.ogImage?.asset?.url,
  )

  const canonicalFromCms = resolveCanonicalUrl(landingSeo?.canonicalUrl, locale)
  const pathnameAfterLocale = itemContext?.pathnameForAlternates?.trim()
  // "" is a valid value: the home page passes an empty path and gets `/{locale}`.
  const canonicalFallback =
    !canonicalFromCms && pathnameAfterLocale != null
      ? pathnameAfterLocale
        ? `${getSiteBaseUrl().replace(/\/$/, '')}/${locale}/${pathnameAfterLocale
            .split('/')
            .filter(Boolean)
            .map((s) => encodeURIComponent(s))
            .join('/')}`
        : `${getSiteBaseUrl().replace(/\/$/, '')}/${locale}`
      : undefined
  const canonical = canonicalFromCms ?? canonicalFallback
  const noIndex = landingSeo?.noIndex ?? siteDefaultSeo?.noIndex ?? false
  const noFollow = landingSeo?.noFollow ?? siteDefaultSeo?.noFollow ?? false

  // `absolute` short-circuits the root layout's `%s — Brand` template;
  // `withBrand` strips any CMS-baked brand and appends it exactly once.
  const titleField: Metadata['title'] = title ? { absolute: withBrand(title) } : title
  const keywords = resolveKeywords(landingSeo?.keywords, locale)
  const modifiedTimeIso = resolveModifiedTimeIso(itemContext?.contentUpdatedAt)

  if (!isIndexingEnabled()) {
    return buildMetadata({
      title: titleField,
      description,
      keywords,
      ogTitle: title,
      ogDescription: description,
      ogImageUrl: ogImageAbsolute,
      twitterCard: 'summary',
      robots: indexingDisabledRobots,
      modifiedTimeIso,
    })
  }

  const hrefPath = itemContext?.pathnameForAlternates
  const hreflang = hrefPath !== undefined ? buildHreflangAlternates(hrefPath) : undefined

  return buildMetadata({
    title: titleField,
    description,
    keywords,
    ogTitle: title,
    ogDescription: description,
    ogImageUrl: ogImageAbsolute,
    twitterCard: 'summary',
    canonical,
    hreflangLanguages: hreflang?.languages,
    robots: noIndex || noFollow ? { index: !noIndex, follow: !noFollow } : undefined,
    modifiedTimeIso,
  })
}
