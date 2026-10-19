import { KnowledgeLinks } from "@/components/knowledge/KnowledgeLinks";
import { KNOWLEDGE_LINKS_ON_METHODOLOGY } from "@/lib/knowledge/links";
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Breadcrumb } from "@/components/shared/Breadcrumb";
import { BreadcrumbJsonLd } from "@/components/shared/BreadcrumbJsonLd";
import { PriceTableSection } from "@/components/landing/sections/PriceTableSection";
import {
  BODY_TEXT,
  CONTAINER,
  MEASURE,
  PAGE_TOP,
  PANEL,
  Section,
  SECTION_LEAD,
  SECTION_TITLE,
  SPLIT,
  SPLIT_ASIDE,
  SPLIT_MAIN,
} from "@/components/shared/layout";
import { fetchPriceIndexSnapshot } from "@/lib/sanity/client";
import { buildFlatCrumbs, toBreadcrumbJsonLdItems } from "@/lib/routes/breadcrumbs";
import { getBaseUrl } from "@/lib/seo/baseUrl";
import { buildSimplePageMetadata } from "@/lib/seo/simplePageMetadata";
import { formatBlogDate } from "@/lib/date/formatLocale";
import { resolveLocalizedString } from "@/lib/sanity/localized";
import { MIN_HEADLINE_SAMPLE } from "@/lib/priceIndex/snapshot";
import {
  cityCsvPath,
  cityInfoPath,
  citationLine,
  placeName,
  PRICE_INDEX_JSON_PATH,
  PRICE_INDEX_LICENSE_URL,
} from "@/lib/priceIndex/publish";
import { buildPriceIndexCatalogJsonLd } from "@/lib/priceIndex/jsonLd";
import { cn } from "@/lib/utils";

type Props = { params: Promise<{ locale: string }> };

/**
 * `/methodology` — how the Domlivo Price Index is computed, how to cite it,
 * its licence and its downloads. Every price table on the site links here.
 *
 * The method copy lives in `messages/*.json` (`PriceIndex.methodology`); the
 * figures, the example citation and the file list come from the live
 * snapshot, so the page never describes a city the index does not have.
 * Carries the `DataCatalog` whose parts are the city datasets on `/info`.
 */
export const revalidate = 3600;

const METHOD_ITEMS = ["asking", "sample", "filters", "threshold", "median", "frequency", "research"] as const;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "PriceIndex.methodology" });
  return buildSimplePageMetadata({
    locale,
    title: t("metaTitle"),
    description: t("metaDescription"),
    pathAfterLocale: "methodology",
    robots: { index: true, follow: true },
  });
}

const loc = (value: string) => ({ en: value, uk: value, ru: value, sq: value, it: value, pl: value, de: value });
const subhead = "text-lg md:text-xl font-medium text-dark dark:text-white";
const linkClass = "text-primary underline underline-offset-2 hover:no-underline";

export default async function MethodologyPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const [t, tCrumbs, snapshot, baseUrl] = await Promise.all([
    getTranslations({ locale, namespace: "PriceIndex.methodology" }),
    getTranslations({ locale, namespace: "Breadcrumbs" }),
    fetchPriceIndexSnapshot(),
    getBaseUrl(),
  ]);
  const base = baseUrl.replace(/\/$/, "");

  const items = buildFlatCrumbs({ locale, homeLabel: tCrumbs("home"), label: t("breadcrumb") });
  const jsonLdItems = toBreadcrumbJsonLdItems(items, `/${locale}/methodology`);
  const catalog = snapshot ? buildPriceIndexCatalogJsonLd({ baseUrl: base, locale, snapshot }) : null;

  const number = new Intl.NumberFormat(locale, { maximumFractionDigits: 0 });
  const date = snapshot ? formatBlogDate(new Date(snapshot.computedAt), locale) : "";
  const cities = snapshot?.cities.filter((c) => c.count > 0) ?? [];
  const example = cities.find((c) => c.reliable) ?? cities[0];

  return (
    <main>
      <BreadcrumbJsonLd items={jsonLdItems} baseUrl={base} />
      {catalog ? (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(catalog).replace(/</g, "\\u003c") }}
        />
      ) : null}

      <section className={PAGE_TOP}>
        <div className={CONTAINER}>
          <Breadcrumb items={items} />
          <div className={cn(MEASURE, "mt-6")}>
            <h1 className={SECTION_TITLE}>{t("h1")}</h1>
            <p className={cn(SECTION_LEAD, "mt-4")}>{t("lead")}</p>
          </div>
        </div>
      </section>

      {snapshot && cities.length > 0 ? (
        <PriceTableSection
          locale={locale}
          section={{
            title: loc(t("figuresTitle")),
            subtitle: loc(t("figuresLead", { date, min: MIN_HEADLINE_SAMPLE })),
            labelHeader: loc(t("colCity")),
            columns: [loc(t("colMedian")), loc(t("colRange")), loc(t("colCount"))],
            rows: cities.map((c) => ({
              _key: c.slug,
              label: loc(resolveLocalizedString(c.title as never, locale) || c.slug),
              cells: c.reliable
                ? [
                    loc(c.median === null ? "—" : `€${number.format(c.median)}`),
                    loc(c.p20 === null || c.p80 === null ? "—" : `€${number.format(c.p20)}–${number.format(c.p80)}`),
                    loc(number.format(c.count)),
                  ]
                : [loc(t("lowSampleCell")), loc("—"), loc(number.format(c.count))],
              href: `/${c.country}/${c.slug}/info`,
            })),
            caption: t("figuresCaption", { date }),
            lastUpdated: snapshot.computedAt,
          }}
        />
      ) : null}

      <Section aria-labelledby="method-heading">
        <div className={SPLIT}>
          <div className={SPLIT_ASIDE}>
            <h2 id="method-heading" className={SECTION_TITLE}>
              {t("methodTitle")}
            </h2>
          </div>
          <div className={cn(SPLIT_MAIN, "space-y-8")}>
            {METHOD_ITEMS.map((key) => (
              <div key={key}>
                <h3 className={subhead}>{t(`${key}Title`, { min: MIN_HEADLINE_SAMPLE })}</h3>
                <p className={cn(BODY_TEXT, "mt-2")}>{t(`${key}Body`, { min: MIN_HEADLINE_SAMPLE })}</p>
              </div>
            ))}
          </div>
        </div>
      </Section>

      <Section aria-labelledby="use-heading">
        <div className={SPLIT}>
          <div className={SPLIT_ASIDE}>
            <h2 id="use-heading" className={SECTION_TITLE}>
              {t("useTitle")}
            </h2>
          </div>
          <div className={cn(SPLIT_MAIN, "space-y-8")}>
            <div>
              <h3 className={subhead}>{t("citeTitle")}</h3>
              <p className={cn(BODY_TEXT, "mt-2")}>{t("citeBody")}</p>
              <p className={cn(PANEL, "mt-4 px-5 py-4 font-mono text-sm text-dark dark:text-white")}>
                {t("citeTemplate")}
              </p>
              {example ? (
                <p className={cn(BODY_TEXT, "mt-4")}>
                  {t("citeExample")}{" "}
                  <span className="text-dark dark:text-white">
                    {citationLine(
                      resolveLocalizedString(example.title as never, locale) || placeName(example.title, example.slug),
                      date,
                      `${base}${cityInfoPath(example, locale)}`,
                    )}
                  </span>
                </p>
              ) : null}
            </div>
            <div>
              <h3 className={subhead}>{t("licenceTitle")}</h3>
              <p className={cn(BODY_TEXT, "mt-2")}>
                {t("licenceBody")}{" "}
                <a href={PRICE_INDEX_LICENSE_URL} className={linkClass} rel="license noopener" target="_blank">
                  CC BY 4.0
                </a>
              </p>
            </div>
            <div>
              <h3 className={subhead}>{t("downloadsTitle")}</h3>
              <p className={cn(BODY_TEXT, "mt-2")}>{t("downloadsBody")}</p>
              <ul className={cn(BODY_TEXT, "mt-3 space-y-1.5")}>
                <li>
                  <a href={PRICE_INDEX_JSON_PATH} className={linkClass} type="application/json">
                    {t("downloadAll")}
                  </a>
                </li>
                {cities.map((c) => (
                  <li key={c.slug}>
                    <a href={cityCsvPath(c.slug)} className={linkClass} type="text/csv">
                      {t("downloadCity", { city: resolveLocalizedString(c.title as never, locale) || c.slug })}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
            <KnowledgeLinks locale={locale} slugs={KNOWLEDGE_LINKS_ON_METHODOLOGY} as="h3" />
          </div>
        </div>
      </Section>
    </main>
  );
}
