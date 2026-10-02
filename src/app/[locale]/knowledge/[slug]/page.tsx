import type { Metadata } from 'next'
import Link from "@/components/shared/Link";
import { notFound } from 'next/navigation'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { PortableText, type PortableTextComponents } from '@portabletext/react'
import type { PortableTextBlock } from '@portabletext/types'
import { Breadcrumb } from '@/components/shared/Breadcrumb'
import { BreadcrumbJsonLd } from '@/components/shared/BreadcrumbJsonLd'
import { Icon } from '@/components/shared/Icon'
import KnowledgeTable, { assignRowAnchors } from '@/components/knowledge/KnowledgeTable'
import { fetchKnowledgeArticle, fetchKnowledgeSlugs } from '@/lib/sanity/queries/knowledge'
import { getBaseUrl } from '@/lib/seo/baseUrl'
import { buildSimplePageMetadata } from '@/lib/seo/simplePageMetadata'
import { indexingDisabledRobots, isIndexingEnabled, indexableRobots } from '@/lib/seo/envSeo'
import { toBreadcrumbJsonLdItems } from '@/lib/routes/breadcrumbs'
import { brandButtonClass } from '@/components/shared/BrandButton'
import {
  BODY_TEXT,
  CONTAINER,
  MEASURE,
  PANEL,
  SECTION_LEAD,
  SPLIT,
  SPLIT_ASIDE,
  SPLIT_MAIN,
} from '@/components/shared/layout'

/** Portable Text on knowledge pages: the body scale used by every prose block. */
const knowledgeBodyComponents: PortableTextComponents = {
  block: {
    normal: ({ children }) => <p className={`${BODY_TEXT} mt-4 first:mt-0`}>{children}</p>,
    h3: ({ children }) => (
      <h3 className="mt-8 text-xl font-semibold text-dark dark:text-white">{children}</h3>
    ),
  },
  list: {
    bullet: ({ children }) => <ul className="mt-4 flex flex-col gap-2 pl-0 list-none">{children}</ul>,
    number: ({ children }) => <ol className="mt-4 flex flex-col gap-2 pl-6 list-decimal">{children}</ol>,
  },
  listItem: {
    bullet: ({ children }) => (
      <li className={`flex items-start gap-3 ${BODY_TEXT}`}>
        <span aria-hidden className="mt-[0.65rem] h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
        <span className="min-w-0">{children}</span>
      </li>
    ),
    number: ({ children }) => <li className={BODY_TEXT}>{children}</li>,
  },
}

type Props = { params: Promise<{ locale: string; slug: string }> }

export const revalidate = 3600

export async function generateStaticParams() {
  const slugs = await fetchKnowledgeSlugs()
  return slugs.map((slug) => ({ slug }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params
  const article = await fetchKnowledgeArticle(slug, locale)
  if (!article) return { robots: indexingDisabledRobots }
  return buildSimplePageMetadata({
    locale,
    title: article.title,
    description: article.summary?.slice(0, 300),
    pathAfterLocale: `knowledge/${slug}`,
    robots: isIndexingEnabled() ? indexableRobots : indexingDisabledRobots,
  })
}

/**
 * One page of the knowledge base.
 *
 * It is deliberately not an article: no hero image, no byline, no narrative.
 * What a visitor came for is a number they can check, so the page leads with
 * the summary, then the questions it answers, then tables whose every row is
 * addressable and whose sources are one click away — and it ends by saying
 * what is missing. The `Dataset` and `FAQPage` markup exists for the same
 * reason: this is the page an AI search engine should be able to quote.
 */
export default async function KnowledgeArticlePage({ params }: Props) {
  const { locale, slug } = await params
  setRequestLocale(locale)
  const t = await getTranslations('Knowledge')
  const article = await fetchKnowledgeArticle(slug, locale)
  if (!article) notFound()

  const baseUrl = await getBaseUrl()
  const crumbs = [
    { label: t('breadcrumbHome'), href: `/${locale}` },
    { label: t('title'), href: `/${locale}/knowledge` },
    { label: article.title },
  ]

  const tableLabels = {
    sources: t('sources'),
    confidence: t('confidence'),
    period: t('period'),
    verified: t('verified'),
    estimate: t('estimateNote'),
    method: t('method'),
  }

  const rowAnchors = assignRowAnchors(article.sections ?? [])
  const faqEntries = (article.questions ?? []).filter(Boolean).slice(0, 10)
  const datasetJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Dataset',
    name: article.title,
    description: article.summary ?? undefined,
    url: `${baseUrl}/${locale}/knowledge/${slug}`,
    identifier: article.documentId,
    temporalCoverage: article.dataPeriod ?? undefined,
    dateModified: article.lastUpdated ?? undefined,
    inLanguage: locale,
    isAccessibleForFree: true,
    creator: { '@type': 'Organization', name: 'DomLivo' },
    // The sources are the point of the dataset, so they are declared as
    // citations rather than buried in the page text.
    citation: Array.from(
      new Map(
        (article.sections ?? [])
          .flatMap((section) => section.tables ?? [])
          .flatMap((table) => table.rows ?? [])
          .flatMap((row) => row.facts ?? [])
          .filter((fact) => fact?.source?.name)
          .map((fact) => [
            fact.source!.name,
            {
              '@type': 'CreativeWork',
              name: fact.source!.name,
              url: fact.source!.url ?? undefined,
              datePublished: fact.source!.publishedAt ?? undefined,
            },
          ]),
      ).values(),
    ).slice(0, 40),
  }

  return (
    <main>
      {/* Page grid: the article on the wide side of the split, the facts
          about it (period, confidence, open questions, the assistant) on the
          narrow side. It used to be a 1024px column of its own, centred,
          with heading sizes the theme does not define (text-36, text-46,
          text-24) and `prose` classes from a plugin that is not installed,
          so headings and paragraphs rendered at browser defaults. */}
      <section className="pt-32 md:pt-40 pb-16 md:pb-24">
        <div className={CONTAINER}>
          <BreadcrumbJsonLd
            items={toBreadcrumbJsonLdItems(crumbs, `/${locale}/knowledge/${slug}`)}
            baseUrl={baseUrl}
          />
          <Breadcrumb items={crumbs} />

          <header className={`mt-6 ${MEASURE}`}>
            <h1 className="text-4xl md:text-5xl leading-[1.1] tracking-tight font-bold text-dark dark:text-white text-balance">
              {article.title}
            </h1>
            {article.summary ? (
              <p className={`mt-5 ${SECTION_LEAD}`}>{article.summary}</p>
            ) : null}
          </header>

          <div className={`mt-12 ${SPLIT}`}>
            <div className={SPLIT_MAIN}>
              {(article.sections ?? []).map((section) => (
                <section key={section.sectionKey} id={section.sectionKey} className="mt-12 first:mt-0 scroll-mt-28">
                  <h2 className="text-2xl md:text-[1.75rem] leading-tight tracking-tight font-bold text-dark dark:text-white">
                    {section.heading}
                  </h2>
                  {Array.isArray(section.body) && section.body.length > 0 ? (
                    <div className="mt-4">
                      <PortableText value={section.body as PortableTextBlock[]} components={knowledgeBodyComponents} />
                    </div>
                  ) : null}
                  {(section.tables ?? []).map((table) => (
                    <KnowledgeTable
                      key={table.tableId}
                      table={table}
                      labels={tableLabels}
                      anchors={rowAnchors}
                    />
                  ))}
                </section>
              ))}

              {(article.gaps ?? []).length > 0 ? (
                <section className="mt-12 rounded-2xl border border-amber-500/30 bg-amber-500/5 p-5 md:p-6">
                  <h2 className="text-lg font-semibold text-dark dark:text-white">{t('gapsHeading')}</h2>
                  <p className="mt-1 text-sm text-dark/65 dark:text-white/65">{t('gapsIntro')}</p>
                  <ul className="mt-3 space-y-1.5 text-sm text-dark/75 dark:text-white/75">
                    {article.gaps.map((gap, index) => (
                      <li key={gap.gapId ?? `gap-${index}`} className="flex gap-2">
                        <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500" aria-hidden />
                        <span>
                          {gap.description}
                          {gap.priority ? (
                            <span className="ml-2 text-xs uppercase tracking-wide text-dark/45 dark:text-white/45">
                              {gap.priority}
                            </span>
                          ) : null}
                        </span>
                      </li>
                    ))}
                  </ul>
                </section>
              ) : null}
            </div>

            <aside className={`${SPLIT_ASIDE} lg:sticky lg:top-28 lg:self-start flex flex-col gap-6`}>
              {article.dataPeriod || article.lastUpdated || article.confidence || article.exchangeRateNote ? (
                <dl className={`${PANEL} p-6 grid gap-3 text-sm`}>
                  {article.dataPeriod ? (
                    <div className="flex justify-between gap-4">
                      <dt className="text-dark/55 dark:text-white/55">{t('period')}</dt>
                      <dd className="text-right font-medium text-dark dark:text-white">{article.dataPeriod}</dd>
                    </div>
                  ) : null}
                  {article.lastUpdated ? (
                    <div className="flex justify-between gap-4">
                      <dt className="text-dark/55 dark:text-white/55">{t('updated')}</dt>
                      <dd className="text-right font-medium text-dark dark:text-white">{article.lastUpdated}</dd>
                    </div>
                  ) : null}
                  {article.confidence ? (
                    <div className="flex justify-between gap-4">
                      <dt className="text-dark/55 dark:text-white/55">{t('confidence')}</dt>
                      <dd className="text-right font-medium text-dark dark:text-white">{article.confidence}</dd>
                    </div>
                  ) : null}
                  {article.exchangeRateNote ? (
                    <div className="flex justify-between gap-4">
                      <dt className="text-dark/55 dark:text-white/55">{t('exchangeRate')}</dt>
                      <dd className="text-right font-medium text-dark dark:text-white">{article.exchangeRateNote}</dd>
                    </div>
                  ) : null}
                </dl>
              ) : null}

              {faqEntries.length > 0 ? (
                <section className={`${PANEL} p-6`}>
                  <h2 className="text-lg font-semibold text-dark dark:text-white">{t('questionsHeading')}</h2>
                  <ul className="mt-3 space-y-2 text-dark/75 dark:text-white/75">
                    {faqEntries.map((question, index) => (
                      <li key={`q-${index}`} className="flex gap-2">
                        <Icon
                          icon="ph:question"
                          width={16}
                          height={16}
                          className="mt-1 shrink-0 text-primary"
                          aria-hidden
                        />
                        <span>{question}</span>
                      </li>
                    ))}
                  </ul>
                </section>
              ) : null}

              <section className="rounded-3xl bg-primary/[0.08] ring-1 ring-primary/20 p-6">
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

              {(article.relatedArticles ?? []).length > 0 ? (
                <section>
                  <h2 className="text-lg font-semibold text-dark dark:text-white">{t('related')}</h2>
                  <ul className="mt-3 space-y-2">
                    {article.relatedArticles.map((related) => (
                      <li key={related.slug}>
                        <Link
                          href={`/${locale}/knowledge/${related.slug}`}
                          className="text-primary hover:underline underline-offset-4"
                        >
                          {related.title}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </section>
              ) : null}
            </aside>
          </div>
        </div>
      </section>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(datasetJsonLd) }}
      />
      {faqEntries.length > 0 && article.summary ? (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'FAQPage',
              mainEntity: faqEntries.map((question) => ({
                '@type': 'Question',
                name: question,
                acceptedAnswer: { '@type': 'Answer', text: article.summary },
              })),
            }),
          }}
        />
      ) : null}
    </main>
  )
}
