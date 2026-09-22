import { NextResponse } from 'next/server'
import { routing } from '@/i18n/routing'
import { isIndexingEnabled } from '@/lib/seo/envSeo'
import { fetchKnowledgeIndex } from '@/lib/sanity/queries/knowledge'
import { latestDate, parseDateOrUndefined } from '@/lib/seo/contentLastmod'
import { buildUrlsetXml } from '@/lib/seo/sitemapXml'
import { getSiteBaseUrl } from '@/lib/siteUrl'

export const revalidate = 3600

/**
 * `/knowledge` and every published page under it, in all six locales.
 *
 * Its own sitemap file rather than a few more lines in `sitemap-static.xml`,
 * because these pages change on a research cadence of their own: a tariff page
 * gets a new `lastUpdated` in December when the regulator decides, and nothing
 * else on the site moves with it.
 */
export async function GET() {
  if (!isIndexingEnabled()) {
    return new NextResponse(buildUrlsetXml([]), {
      headers: { 'Content-Type': 'application/xml; charset=utf-8' },
    })
  }

  const base = getSiteBaseUrl()
  const entries = await fetchKnowledgeIndex('en')
  const urls: Array<{ loc: string; lastmod?: Date }> = []

  // The index changes when its newest page does; a page without a
  // `lastUpdated` gets no date rather than the time of this request.
  const pages = entries
    .filter((entry) => Boolean(entry.slug))
    .map((entry) => ({
      slug: entry.slug,
      lastmod: parseDateOrUndefined(entry.lastUpdated ? `${entry.lastUpdated}T00:00:00Z` : undefined),
    }))
  const indexLastmod = latestDate(...pages.map((p) => p.lastmod))

  for (const locale of routing.locales) {
    urls.push({ loc: `${base}/${locale}/knowledge`, lastmod: indexLastmod })
    for (const page of pages) {
      urls.push({
        loc: `${base}/${locale}/knowledge/${encodeURIComponent(page.slug)}`,
        lastmod: page.lastmod,
      })
    }
  }

  return new NextResponse(buildUrlsetXml(urls), {
    headers: { 'Content-Type': 'application/xml; charset=utf-8' },
  })
}
