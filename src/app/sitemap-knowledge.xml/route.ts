import { NextResponse } from 'next/server'
import { routing } from '@/i18n/routing'
import { isIndexingEnabled } from '@/lib/seo/envSeo'
import { fetchKnowledgeIndex } from '@/lib/sanity/queries/knowledge'
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
  const urls: Array<{ loc: string; lastmod: Date }> = []
  const now = new Date()

  for (const locale of routing.locales) {
    urls.push({ loc: `${base}/${locale}/knowledge`, lastmod: now })
    for (const entry of entries) {
      if (!entry.slug) continue
      const lastmod = entry.lastUpdated ? new Date(`${entry.lastUpdated}T00:00:00Z`) : now
      urls.push({
        loc: `${base}/${locale}/knowledge/${encodeURIComponent(entry.slug)}`,
        lastmod: Number.isNaN(lastmod.getTime()) ? now : lastmod,
      })
    }
  }

  return new NextResponse(buildUrlsetXml(urls), {
    headers: { 'Content-Type': 'application/xml; charset=utf-8' },
  })
}
