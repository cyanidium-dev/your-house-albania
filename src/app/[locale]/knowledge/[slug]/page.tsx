import type { Metadata } from 'next'
import Link from "@/components/shared/Link";
import { notFound } from 'next/navigation'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { PortableText, type PortableTextComponents } from '@portabletext/react'
import type { PortableTextBlock } from '@portabletext/types'
import { Breadcrumb } from '@/components/shared/Breadcrumb'
import { BreadcrumbJsonLd } from '@/components/shared/BreadcrumbJsonLd'
import { SpriteIcon as Icon } from '@/components/shared/SpriteIcon'
import { FaqAccordion } from '@/components/shared/faq/FaqAccordion'
import KnowledgeTable, { assignRowAnchors } from '@/components/knowledge/KnowledgeTable'
import KnowledgeProse from '@/components/knowledge/KnowledgeProse'
import {
  fetchKnowledgeArticle,
  fetchKnowledgeSlugs,
  knowledgeArticleLocales,
  type KnowledgeArticle,
  type KnowledgeSource,
} from '@/lib/sanity/queries/knowledge'
import { fetchPriceIndexSnapshot } from '@/lib/sanity/queries/priceIndex'
import { interpolatePriceIndexTokens } from '@/lib/priceIndex/tokens'
import { formatBlogDate } from '@/lib/date/formatLocale'
import { getBaseUrl } from '@/lib/seo/baseUrl'
import { buildSimplePageMetadata } from '@/lib/seo/simplePageMetadata'
import { buildKnowledgeArticleJsonLd, buildKnowledgeFaqJsonLd } from '@/lib/seo/knowledgeArticleJsonLd'
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

const H2 = 'text-2xl md:text-[1.75rem] leading-tight tracking-tight font-bold text-dark dark:text-white'

type Props = { params: Promise<{ locale: string; slug: string }> }

export const revalidate = 86400

export async function generateStaticParams() {
  const slugs = await fetchKnowledgeSlugs()
  return slugs.map((slug) => ({ slug }))
}

/** The article with its price-index tokens filled from the live index. */
async function loadArticle(slug: string, locale: string): Promise<KnowledgeArticle | null> {
  const article = await fetchKnowledgeArticle(slug, locale)
  if (!article) return null
  const hasTokens = JSON.stringify(article).includes('{{')
  if (!hasTokens) return article
  const snapshot = await fetchPriceIndexSnapshot()
  return interpolatePriceIndexTokens(article, snapshot, locale)
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params
  const article = await loadArticle(slug, locale)
  if (!article) return { robots: indexingDisabledRobots }
  // Written in this locale, or only the English fallback? The fallback stays
  // reachable but is `noindex, follow` and drops out of hreflang, so a page
  // translated into two languages is not indexed as six English copies.
  const locales = knowledgeArticleLocales(article)
  const written = locales.includes(locale)
  return buildSimplePageMetadata({
    locale,
    title: article.seoTitle || article.title,
    description: (article.seoDescription || article.summary)?.slice(0, 300),
    pathAfterLocale: `knowledge/${slug}`,
    locales,
    robots: !isIndexingEnabled() ? indexingDisabledRobots : written ? indexableRobots : { index: false, follow: true },
  })
}

/** Page sources first, then any fact source the page did not list itself. */
function collectSources(article: KnowledgeArticle): KnowledgeSource[] {
  const byId = new Map<string, KnowledgeSource>()
  for (const source of article.sources ?? []) if (source?.sourceId) byId.set(source.sourceId, source)
  for (const section of article.sections ?? [])
    for (const table of section.tables ?? [])
      for (const row of table.rows ?? [])
        for (const fact of row.facts ?? [])
          if (fact?.source?.sourceId && !byId.has(fact.source.sourceId)) byId.set(fact.source.sourceId, fact.source)
  return [...byId.values()]
}

/**
 * One page of the knowledge base.
 *
 * Question pages (`topicGroup` set) read as an answer: the question as H1, the
 * answer with its figure and date right under it, who compiled the data and —
 * only once it has happened — who checked it; then the tables with their
 * sources one click away, an FAQ, the full source list and what is missing.
 * The research data sheets keep their Dataset markup and question list.
 */
export default async function KnowledgeArticlePage({ params }: Props) {
  const { locale, slug } = await params
  setRequestLocale(locale)
  const t = await getTranslations('Knowledge')
  const article = await loadArticle(slug, locale)
  if (!article) notFound()

  const baseUrl = await getBaseUrl()
  const url = `${baseUrl}/${locale}/knowledge/${slug}`
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

  const isQuestionPage = Boolean(article.topicGroup)
  const rowAnchors = assignRowAnchors(article.sections ?? [])
  const faq = (article.faq ?? []).filter((item) => item?.question && item?.answer)
  const questions = (article.questions ?? []).filter(Boolean).slice(0, 10)
  const sources = collectSources(article)
  const updated = article.lastUpdated ? formatBlogDate(new Date(article.lastUpdated), locale) : null
  const reviewedOn = article.reviewedAt ? formatBlogDate(new Date(article.reviewedAt), locale) : null

  const articleJsonLd = isQuestionPage
    ? buildKnowledgeArticleJsonLd({
        headline: article.title,
        description: article.summary,
        url,
        locale,
        lastUpdated: article.lastUpdated,
        baseUrl,
        authorSlug: article.author?.slug,
        reviewerSlug: article.reviewer?.slug,
        keywords: article.tags,
        sources,
      })
    : {
        '@context': 'https://schema.org',
        '@type': 'Dataset',
        name: article.title,
        description: article.summary ?? undefined,
        url,
        identifier: article.documentId,
        temporalCoverage: article.dataPeriod ?? undefined,
        dateModified: article.lastUpdated ?? undefined,
        inLanguage: locale,
        isAccessibleForFree: true,
        creator: { '@type': 'Organization', name: 'DomLivo' },
        citation: sources.slice(0, 40).map((source) => ({
          '@type': 'CreativeWork',
          name: source.name,
          url: source.url ?? undefined,
          datePublished: source.publishedAt ?? undefined,
        })),
      }
  const faqJsonLd = buildKnowledgeFaqJsonLd(faq)

  return (
    <main>
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
            {article.summary ? <p className={`mt-5 ${SECTION_LEAD}`}>{article.summary}</p> : null}
            {article.author || updated ? (
              <p className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-dark/60 dark:text-white/60">
                {article.author ? (
                  <span>
                    {t('compiledBy')}{' '}
                    <Link href={`/${locale}/about`} className="font-medium text-dark hover:text-primary dark:text-white">
                      {article.author.name}
                    </Link>
                  </span>
                ) : null}
                {article.reviewer ? (
                  <span>
                    {t('checkedBy')}{' '}
                    <Link href={`/${locale}/about`} className="font-medium text-dark hover:text-primary dark:text-white">
                      {article.reviewer.name}
                    </Link>
                    {reviewedOn ? `, ${reviewedOn}` : null}
                  </span>
                ) : null}
                {updated ? (
                  <span>
                    {t('updatedOn')} <time dateTime={article.lastUpdated}>{updated}</time>
                  </span>
                ) : null}
              </p>
            ) : null}
          </header>

          <div className={`mt-12 ${SPLIT}`}>
            <div className={SPLIT_MAIN}>
              {(article.sections ?? []).map((section) => (
                <section key={section.sectionKey} id={section.sectionKey} className="mt-12 first:mt-0 scroll-mt-28">
                  <h2 className={H2}>{section.heading}</h2>
                  {section.bodyText ? (
                    <div className="mt-4">
                      <KnowledgeProse text={section.bodyText} />
                    </div>
                  ) : Array.isArray(section.body) && section.body.length > 0 ? (
                    <div className="mt-4">
                      <PortableText value={section.body as PortableTextBlock[]} components={knowledgeBodyComponents} />
                    </div>
                  ) : null}
                  {(section.tables ?? []).map((table) => (
                    <KnowledgeTable key={table.tableId} table={table} labels={tableLabels} anchors={rowAnchors} />
                  ))}
                </section>
              ))}

              {faq.length > 0 ? (
                <section id="FAQ" aria-labelledby="knowledge-faq" className="mt-12 scroll-mt-28">
                  <h2 id="knowledge-faq" className={H2}>
                    {t('faqHeading')}
                  </h2>
                  <FaqAccordion
                    className="mt-5"
                    idPrefix="knowledge-faq"
                    items={faq.map((item) => ({ question: item.question, answer: item.answer }))}
                  />
                </section>
              ) : null}

              {isQuestionPage && sources.length > 0 ? (
                <section id="SOURCES" aria-labelledby="knowledge-sources" className="mt-12 scroll-mt-28">
                  <h2 id="knowledge-sources" className={H2}>
                    {t('sources')}
                  </h2>
                  <ol className="mt-4 space-y-3 pl-5 list-decimal marker:text-dark/40 dark:marker:text-white/40">
                    {sources.map((source) => (
                      <li key={source.sourceId} className="text-sm text-dark/75 dark:text-white/75">
                        {source.url ? (
                          <a
                            href={source.url}
                            target="_blank"
                            rel="noopener noreferrer nofollow"
                            className="font-medium text-dark hover:text-primary dark:text-white"
                          >
                            {source.name}
                          </a>
                        ) : (
                          <span className="font-medium text-dark dark:text-white">{source.name}</span>
                        )}
                        {source.publisher ? <span>. {source.publisher}</span> : null}
                        {source.publishedAt ? <span>, {source.publishedAt}</span> : null}
                        {source.accessedAt ? (
                          <span className="text-dark/50 dark:text-white/50">
                            {' '}
                            ({t('accessed')} {source.accessedAt})
                          </span>
                        ) : null}
                      </li>
                    ))}
                  </ol>
                </section>
              ) : null}

              {(article.gaps ?? []).length > 0 ? (
                <section className="mt-12 rounded-2xl border border-amber-500/30 bg-amber-500/5 p-5 md:p-6">
                  <h2 className="text-lg font-semibold text-dark dark:text-white">{t('gapsHeading')}</h2>
                  <p className="mt-1 text-sm text-dark/65 dark:text-white/65">{t('gapsIntro')}</p>
                  <ul className="mt-3 space-y-1.5 text-sm text-dark/75 dark:text-white/75">
                    {article.gaps.map((gap, index) => (
                      <li key={gap.gapId ?? `gap-${index}`} className="flex gap-2">
                        <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500" aria-hidden />
                        <span>{gap.description}</span>
                      </li>
                    ))}
                  </ul>
                </section>
              ) : null}
            </div>

            <aside className={`${SPLIT_ASIDE} lg:sticky lg:top-28 lg:self-start flex flex-col gap-6`}>
              {article.dataPeriod || updated || article.confidence || article.exchangeRateNote ? (
                <dl className={`${PANEL} p-6 grid gap-3 text-sm`}>
                  {article.dataPeriod ? (
                    <div className="flex justify-between gap-4">
                      <dt className="text-dark/55 dark:text-white/55">{t('period')}</dt>
                      <dd className="text-right font-medium text-dark dark:text-white">{article.dataPeriod}</dd>
                    </div>
                  ) : null}
                  {updated ? (
                    <div className="flex justify-between gap-4">
                      <dt className="text-dark/55 dark:text-white/55">{t('updated')}</dt>
                      <dd className="text-right font-medium text-dark dark:text-white">{updated}</dd>
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

              {!isQuestionPage && questions.length > 0 ? (
                <section className={`${PANEL} p-6`}>
                  <h2 className="text-lg font-semibold text-dark dark:text-white">{t('questionsHeading')}</h2>
                  <ul className="mt-3 space-y-2 text-dark/75 dark:text-white/75">
                    {questions.map((question, index) => (
                      <li key={`q-${index}`} className="flex gap-2">
                        <Icon icon="ph:question" width={16} height={16} className="mt-1 shrink-0 text-primary" aria-hidden />
                        <span>{question}</span>
                      </li>
                    ))}
                  </ul>
                </section>
              ) : null}

              {(article.relatedArticles ?? []).length > 0 ? (
                <section className={`${PANEL} p-6`}>
                  <h2 className="text-lg font-semibold text-dark dark:text-white">{t('related')}</h2>
                  <ul className="mt-3 space-y-2.5">
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

              <section className="rounded-3xl bg-primary/[0.08] ring-1 ring-primary/20 p-6">
                <h2 className="text-lg font-semibold text-dark dark:text-white">{t('askHeading')}</h2>
                <p className="mt-1 text-dark/70 dark:text-white/70">{t('askIntro')}</p>
                <Link href={`/${locale}/ai-search`} className={brandButtonClass('primary', 'mt-4', 'sm')}>
                  <Icon icon="ph:sparkle" width={16} height={16} aria-hidden />
                  {t('askCta')}
                </Link>
              </section>
            </aside>
          </div>
        </div>
      </section>

      {articleJsonLd ? (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd).replace(/</g, '\\u003c') }}
        />
      ) : null}
      {faqJsonLd ? (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd).replace(/</g, '\\u003c') }}
        />
      ) : null}
    </main>
  )
}
