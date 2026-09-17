import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { PortableText } from '@portabletext/react'
import type { PortableTextBlock } from '@portabletext/types'
import { Breadcrumb } from '@/components/shared/Breadcrumb'
import { BreadcrumbJsonLd } from '@/components/shared/BreadcrumbJsonLd'
import { Icon } from '@iconify/react'
import KnowledgeTable, { assignRowAnchors } from '@/components/knowledge/KnowledgeTable'
import { fetchKnowledgeArticle, fetchKnowledgeSlugs } from '@/lib/sanity/queries/knowledge'
import { getBaseUrl } from '@/lib/seo/baseUrl'
import { buildSimplePageMetadata } from '@/lib/seo/simplePageMetadata'
import { indexingDisabledRobots, isIndexingEnabled } from '@/lib/seo/envSeo'
import { toBreadcrumbJsonLdItems } from '@/lib/routes/breadcrumbs'

type Props = { params: Promise<{ locale: string; slug: string }> }

export const revalidate = 900

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
    robots: isIndexingEnabled() ? undefined : indexingDisabledRobots,
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
      <section className="pt-32 md:pt-40 pb-16 md:pb-24">
        <div className="container mx-auto max-w-5xl px-5 2xl:px-0">
          <BreadcrumbJsonLd
            items={toBreadcrumbJsonLdItems(crumbs, `/${locale}/knowledge/${slug}`)}
            baseUrl={baseUrl}
          />
          <Breadcrumb items={crumbs} />

          <header className="mt-6">
            <h1 className="text-36 md:text-46 leading-[1.15] font-bold text-dark dark:text-white">
              {article.title}
            </h1>
            {article.summary ? (
              <p className="mt-5 text-lg leading-relaxed text-dark/75 dark:text-white/75">
                {article.summary}
              </p>
            ) : null}

            <dl className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-sm text-dark/60 dark:text-white/60">
              {article.dataPeriod ? (
                <div className="flex gap-1.5">
                  <dt className="font-medium">{t('period')}:</dt>
                  <dd>{article.dataPeriod}</dd>
                </div>
              ) : null}
              {article.lastUpdated ? (
                <div className="flex gap-1.5">
                  <dt className="font-medium">{t('updated')}:</dt>
                  <dd>{article.lastUpdated}</dd>
                </div>
              ) : null}
              {article.confidence ? (
                <div className="flex gap-1.5">
                  <dt className="font-medium">{t('confidence')}:</dt>
                  <dd>{article.confidence}</dd>
                </div>
              ) : null}
              {article.exchangeRateNote ? (
                <div className="flex gap-1.5">
                  <dt className="font-medium">{t('exchangeRate')}:</dt>
                  <dd>{article.exchangeRateNote}</dd>
                </div>
              ) : null}
            </dl>
          </header>

          {faqEntries.length > 0 ? (
            <section className="mt-10 rounded-2xl border border-dark/10 p-5 md:p-6 dark:border-white/15">
              <h2 className="text-lg font-semibold text-dark dark:text-white">
                {t('questionsHeading')}
              </h2>
              <ul className="mt-3 space-y-1.5 text-dark/75 dark:text-white/75">
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

          {(article.sections ?? []).map((section) => (
            <section key={section.sectionKey} id={section.sectionKey} className="mt-12 scroll-mt-28">
              <h2 className="text-24 md:text-28 font-bold text-dark dark:text-white">
                {section.heading}
              </h2>
              {Array.isArray(section.body) && section.body.length > 0 ? (
                <div className="prose prose-lg mt-4 max-w-none text-dark/80 dark:prose-invert dark:text-white/80">
                  <PortableText value={section.body as PortableTextBlock[]} />
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

          <section className="mt-12 rounded-2xl bg-primary/8 p-6">
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

          {(article.relatedArticles ?? []).length > 0 ? (
            <section className="mt-12">
              <h2 className="text-lg font-semibold text-dark dark:text-white">{t('related')}</h2>
              <ul className="mt-3 space-y-1.5">
                {article.relatedArticles.map((related) => (
                  <li key={related.slug}>
                    <Link
                      href={`/${locale}/knowledge/${related.slug}`}
                      className="text-primary hover:underline"
                    >
                      {related.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
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
