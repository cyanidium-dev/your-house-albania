import type { Metadata } from 'next'
import Link from "@/components/shared/Link";
import { getTranslations, setRequestLocale } from 'next-intl/server'
import {
  balancedGridClass,
  CONTAINER,
  SECTION_TITLE,
  SPLIT,
  SPLIT_ASIDE,
  SPLIT_MAIN,
} from '@/components/shared/layout'
import { Breadcrumb } from '@/components/shared/Breadcrumb'
import { BreadcrumbJsonLd } from '@/components/shared/BreadcrumbJsonLd'
import { SpriteIcon as Icon } from '@/components/shared/SpriteIcon'
import { fetchKnowledgeIndex } from '@/lib/sanity/queries/knowledge'
import { fetchPriceIndexSnapshot } from '@/lib/sanity/queries/priceIndex'
import { interpolatePriceIndexTokens } from '@/lib/priceIndex/tokens'
import { buildFlatCrumbs, toBreadcrumbJsonLdItems } from '@/lib/routes/breadcrumbs'
import { getBaseUrl } from '@/lib/seo/baseUrl'
import { buildSimplePageMetadata } from '@/lib/seo/simplePageMetadata'
import { indexingDisabledRobots, isIndexingEnabled, indexableRobots } from '@/lib/seo/envSeo'
import { brandButtonClass } from '@/components/shared/BrandButton'

type Props = { params: Promise<{ locale: string }> }

export const revalidate = 86400

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations('Knowledge')
  const entries = await fetchKnowledgeIndex(locale)
  return buildSimplePageMetadata({
    locale,
    title: t('title'),
    description: t('description'),
    pathAfterLocale: 'knowledge',
    robots: isIndexingEnabled() && entries.length > 0 ? indexableRobots : indexingDisabledRobots,
  })
}

/** Question pages: sections in the order a buyer meets them. */
const TOPIC_GROUPS = ['buying', 'money', 'ownership', 'process', 'geography'] as const

/** Research data sheets, grouped by category. */
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
  const rawEntries = await fetchKnowledgeIndex(locale)
  // Answers quote the price index through tokens; fill them before printing.
  const entries = JSON.stringify(rawEntries).includes('{{')
    ? interpolatePriceIndexTokens(rawEntries, await fetchPriceIndexSnapshot(), locale)
    : rawEntries

  const crumbs = buildFlatCrumbs({
    locale,
    homeLabel: t('breadcrumbHome'),
    label: t('title'),
  })
  const baseUrl = await getBaseUrl()

  const used = new Set<string>()
  const topicGroups = TOPIC_GROUPS.map((key) => {
    const items = entries.filter((entry) => entry.topicGroup === key)
    items.forEach((entry) => used.add(entry.documentId))
    return { key: `topics.${key}`, items }
  }).filter((group) => group.items.length > 0)
  const sheetGroups = GROUPS.map((group) => {
    const items = entries.filter((entry) => {
      if (used.has(entry.documentId)) return false
      if (!group.categories.includes(entry.category)) return false
      used.add(entry.documentId)
      return true
    })
    return { key: `groups.${group.key}`, items }
  }).filter((group) => group.items.length > 0)

  const rest = entries.filter((entry) => !used.has(entry.documentId))
  if (rest.length > 0) sheetGroups.push({ key: 'groups.other', items: rest })
  const groups = [...topicGroups, ...sheetGroups]

  return (
    <main>
      <section className="pt-32 md:pt-40 pb-16 md:pb-24">
        <div className={CONTAINER}>
          <BreadcrumbJsonLd
            items={toBreadcrumbJsonLdItems(crumbs, `/${locale}/knowledge`)}
            baseUrl={baseUrl}
          />
          <Breadcrumb items={crumbs} />

          <h1 className="mt-6 text-4xl md:text-5xl leading-[1.1] tracking-tight font-bold text-dark dark:text-white">
            {t('title')}
          </h1>
          <p className="mt-5 max-w-3xl text-lg leading-relaxed text-dark/75 dark:text-white/75">
            {t('intro')}
          </p>

          {entries.length === 0 ? (
            <p className="mt-10 text-dark/60 dark:text-white/60">{t('empty')}</p>
          ) : (
            groups.map((group) =>
              group.key.startsWith('topics.') ? (
                // Question pages: the question is the link, the answer's first
                // line under it — a reading list, not a card grid.
                <section key={group.key} className={`mt-14 ${SPLIT}`} aria-labelledby={`kb-${group.key}`}>
                  <div className={SPLIT_ASIDE}>
                    <h2 id={`kb-${group.key}`} className={SECTION_TITLE}>
                      {t(group.key as never)}
                    </h2>
                  </div>
                  <ul className={`${SPLIT_MAIN} divide-y divide-dark/10 dark:divide-white/10`}>
                    {group.items.map((entry) => (
                      <li key={entry.documentId} className="py-4 first:pt-0">
                        <Link
                          href={`/${locale}/knowledge/${entry.slug}`}
                          className="text-lg font-semibold text-dark hover:text-primary dark:text-white"
                        >
                          {entry.title}
                        </Link>
                        {entry.summary ? (
                          <p className="mt-1.5 line-clamp-2 text-sm text-dark/65 dark:text-white/65">{entry.summary}</p>
                        ) : null}
                      </li>
                    ))}
                  </ul>
                </section>
              ) : (
              <section key={group.key} className="mt-12">
                <h2 className="text-2xl md:text-[1.75rem] tracking-tight font-bold text-dark dark:text-white">
                  {t(group.key as never)}
                </h2>
                <ul className={`mt-5 ${balancedGridClass(group.items.length)}`}>
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
              ),
            )
          )}

          <section className="mt-14 rounded-2xl bg-primary/8 p-6">
            <h2 className="text-lg font-semibold text-dark dark:text-white">{t('askHeading')}</h2>
            <p className="mt-1 text-dark/70 dark:text-white/70">{t('askIntro')}</p>
            <Link
              href={`/${locale}/ai-search`}
              className={brandButtonClass('primary', 'mt-4', 'sm')}
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
