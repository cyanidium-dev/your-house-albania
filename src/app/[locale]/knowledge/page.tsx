import type { Metadata } from 'next'
import Link from 'next/link'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { Breadcrumb } from '@/components/shared/Breadcrumb'
import { BreadcrumbJsonLd } from '@/components/shared/BreadcrumbJsonLd'
import { Icon } from '@iconify/react'
import { fetchKnowledgeIndex } from '@/lib/sanity/queries/knowledge'
import { buildFlatCrumbs, toBreadcrumbJsonLdItems } from '@/lib/routes/breadcrumbs'
import { getBaseUrl } from '@/lib/seo/baseUrl'
import { buildSimplePageMetadata } from '@/lib/seo/simplePageMetadata'
import { indexingDisabledRobots, isIndexingEnabled } from '@/lib/seo/envSeo'

type Props = { params: Promise<{ locale: string }> }

export const revalidate = 900

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations('Knowledge')
  const entries = await fetchKnowledgeIndex(locale)
  return buildSimplePageMetadata({
    locale,
    title: t('title'),
    description: t('description'),
    pathAfterLocale: 'knowledge',
    robots: isIndexingEnabled() && entries.length > 0 ? undefined : indexingDisabledRobots,
  })
}

/** Topic groups, in the order a buyer meets them. */
const GROUPS: { key: string; categories: string[] }[] = [
  { key: 'costs', categories: ['electricity', 'water', 'internet', 'gas', 'heating', 'air_conditioning', 'building_fees', 'cleaning', 'utilities'] },
  { key: 'market', categories: ['property_prices', 'real_estate', 'market_analysis', 'districts'] },
  { key: 'renting', categories: ['long_term_rental', 'short_term_rental', 'rental_prices', 'property_management', 'occupancy'] },
  { key: 'buying', categories: ['taxes', 'purchase_costs', 'legal', 'renovation', 'furniture', 'investment', 'roi'] },
  { key: 'outlook', categories: ['forecast', 'macro', 'tourism'] },
]

/**
 * `/knowledge` — the index of the research base.
 *
 * Grouped by what someone is trying to work out (what it costs to run, what it
 * is worth, what it earns, what buying it involves, where it is going) rather
 * than by the internal taxonomy, which is a filing system, not a question.
 */
export default async function KnowledgeIndexPage({ params }: Props) {
  const { locale } = await params
  setRequestLocale(locale)
  const t = await getTranslations('Knowledge')
  const entries = await fetchKnowledgeIndex(locale)

  const crumbs = buildFlatCrumbs({
    locale,
    homeLabel: t('breadcrumbHome'),
    label: t('title'),
  })
  const baseUrl = await getBaseUrl()

  const used = new Set<string>()
  const groups = GROUPS.map((group) => {
    const items = entries.filter((entry) => {
      if (used.has(entry.documentId)) return false
      if (!group.categories.includes(entry.category)) return false
      used.add(entry.documentId)
      return true
    })
    return { key: group.key, items }
  }).filter((group) => group.items.length > 0)

  const rest = entries.filter((entry) => !used.has(entry.documentId))
  if (rest.length > 0) groups.push({ key: 'other', items: rest })

  return (
    <main>
      <section className="pt-32 md:pt-40 pb-16 md:pb-24">
        <div className="container mx-auto max-w-6xl px-5 2xl:px-0">
          <BreadcrumbJsonLd
            items={toBreadcrumbJsonLdItems(crumbs, `/${locale}/knowledge`)}
            baseUrl={baseUrl}
          />
          <Breadcrumb items={crumbs} />

          <h1 className="mt-6 text-40 md:text-52 leading-[1.1] font-bold text-dark dark:text-white">
            {t('title')}
          </h1>
          <p className="mt-5 max-w-3xl text-lg leading-relaxed text-dark/75 dark:text-white/75">
            {t('intro')}
          </p>

          {entries.length === 0 ? (
            <p className="mt-10 text-dark/60 dark:text-white/60">{t('empty')}</p>
          ) : (
            groups.map((group) => (
              <section key={group.key} className="mt-12">
                <h2 className="text-24 font-bold text-dark dark:text-white">
                  {t(`groups.${group.key}` as never)}
                </h2>
                <ul className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
                  {group.items.map((entry) => (
                    <li key={entry.documentId}>
                      <Link
                        href={`/${locale}/knowledge/${entry.slug}`}
                        className="group flex h-full flex-col rounded-2xl border border-dark/10 p-5 transition-colors hover:border-primary dark:border-white/15"
                      >
                        <span className="text-base font-semibold text-dark group-hover:text-primary dark:text-white">
                          {entry.title}
                        </span>
                        {entry.summary ? (
                          <span className="mt-2 line-clamp-3 text-sm text-dark/65 dark:text-white/65">
                            {entry.summary}
                          </span>
                        ) : null}
                        <span className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-dark/45 dark:text-white/45">
                          {entry.dataPeriod ? <span>{entry.dataPeriod}</span> : null}
                          {entry.questionCount > 0 ? (
                            <span>
                              {entry.questionCount} {t('questionsShort')}
                            </span>
                          ) : null}
                          {entry.lastUpdated ? (
                            <span>
                              {t('updated')} {entry.lastUpdated}
                            </span>
                          ) : null}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            ))
          )}

          <section className="mt-14 rounded-2xl bg-primary/8 p-6">
            <h2 className="text-lg font-semibold text-dark dark:text-white">{t('askHeading')}</h2>
            <p className="mt-1 text-dark/70 dark:text-white/70">{t('askIntro')}</p>
            <Link
              href={`/${locale}/ai-search`}
              className="mt-4 inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary/90"
            >
              <Icon icon="ph:sparkle" width={16} height={16} aria-hidden />
              {t('askCta')}
            </Link>
          </section>

          <p className="mt-8 text-sm text-dark/55 dark:text-white/55">{t('methodNote')}</p>
        </div>
      </section>
    </main>
  )
}
