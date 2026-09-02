import type { Metadata } from 'next'
import Link from 'next/link'
import { getTranslations } from 'next-intl/server'
import AiSearchChat from '@/components/ai/AiSearchChat'
import { isAiSearchEnabled } from '@/lib/ai/config'
import { AI_MAX_MESSAGE_CHARS } from '@/lib/ai/limits'
import { catalogPath } from '@/lib/routes/catalog'
import { indexingDisabledRobots, isIndexingEnabled } from '@/lib/seo/envSeo'

type Props = {
  params: Promise<{ locale: string }>
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'AiSearch' })
  const title = t('metaTitle')
  const description = t('metaDescription')

  if (!isIndexingEnabled()) {
    return { title, description, robots: indexingDisabledRobots }
  }

  /**
   * A conversation is per-visitor and has no stable content, so there is
   * nothing here worth indexing. `follow` keeps the catalog links it produces
   * crawlable — the assistant is a route into the indexable pages, not a
   * replacement for them.
   */
  return { title, description, robots: { index: false, follow: true } }
}

function firstParam(value: string | string[] | undefined): string | undefined {
  if (typeof value === 'string') return value
  if (Array.isArray(value)) return value[0]
  return undefined
}

export default async function AiSearchPage({ params, searchParams }: Props) {
  const { locale } = await params
  const query = await searchParams
  const t = await getTranslations({ locale, namespace: 'AiSearch' })
  const initialQuery = firstParam(query.q)?.trim().slice(0, AI_MAX_MESSAGE_CHARS)
  // Where the visitor came from, for the analytics event the chat fires on mount.
  const entry = initialQuery ? 'hero' : firstParam(query.from) === 'header' ? 'header' : 'direct'

  return (
    <div className="container max-w-4xl mx-auto px-5 2xl:px-0 pt-24 md:pt-32 pb-14 md:pb-20">
      <div className="mb-8">
        <h1 className="text-4xl sm:text-52 font-medium tracking-tighter text-dark dark:text-white mb-3">
          {t('title')}
        </h1>
        <p className="text-xm text-dark/50 dark:text-white/50">{t('subtitle')}</p>
      </div>

      {isAiSearchEnabled() ? (
        <AiSearchChat locale={locale} initialQuery={initialQuery} entry={entry} />
      ) : (
        <div className="rounded-2xl border border-dark/10 bg-white p-6 dark:border-white/10 dark:bg-white/5 sm:p-8">
          <p className="text-dark dark:text-white">{t('errors.unavailable')}</p>
          <Link
            href={catalogPath(locale)}
            className="mt-4 inline-flex items-center rounded-full bg-primary px-6 py-3 font-semibold text-white transition-colors duration-200 hover:bg-dark"
          >
            {t('goToCatalog')}
          </Link>
        </div>
      )}
    </div>
  )
}
