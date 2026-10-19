import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import Link from "@/components/shared/Link";
import { Breadcrumb } from "@/components/shared/Breadcrumb";
import { BreadcrumbJsonLd } from "@/components/shared/BreadcrumbJsonLd";
import { FaqJsonLd } from "@/components/shared/FaqJsonLd";
import { FaqAccordion } from "@/components/shared/faq/FaqAccordion";
import { PriceTableSection } from "@/components/landing/sections/PriceTableSection";
import {
  BODY_TEXT,
  CONTAINER,
  MEASURE,
  PAGE_TOP,
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
import { organizationId } from "@/lib/seo/siteJsonLd";
import { formatBlogDate } from "@/lib/date/formatLocale";
import { resolveLocalizedString } from "@/lib/sanity/localized";
import { MIN_HEADLINE_SAMPLE, type PriceIndexCity, type PriceIndexFigures } from "@/lib/priceIndex/snapshot";
import { priceIndexCatalogId } from "@/lib/priceIndex/jsonLd";
import {
  methodologyPath,
  PRICE_INDEX_JSON_PATH,
  PRICE_INDEX_LICENSE_URL,
  PRICE_INDEX_NAME,
} from "@/lib/priceIndex/publish";
import { cn } from "@/lib/utils";

type Props = { params: Promise<{ locale: string }> };

/**
 * `/prices` — property prices in Albania by city, in one table: the question
 * "how much is a flat in Albania, city by city" that the AI prompt audit of
 * 2026-10-19 found answered by other portals (reports/ai-visibility). The
 * figures are the live Domlivo Price Index snapshot, the same one the city
 * pages and the downloads publish; the copy is in `PriceIndex.prices`.
 */
export const revalidate = 3600;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "PriceIndex.prices" });
  return buildSimplePageMetadata({
    locale,
    title: t("metaTitle"),
    description: t("metaDescription"),
    pathAfterLocale: "prices",
    robots: { index: true, follow: true },
  });
}

const loc = (value: string) => ({ en: value, uk: value, ru: value, sq: value, it: value, pl: value, de: value });
const linkClass = "text-primary underline underline-offset-2 hover:no-underline";

function cityName(city: PriceIndexCity, locale: string): string {
  return resolveLocalizedString(city.title as never, locale) || city.slug;
}

function figureCell(f: PriceIndexFigures, number: Intl.NumberFormat): string {
  return f.reliable && f.median !== null ? `€${number.format(f.median)}` : "—";
}

export default async function PricesByCityPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const [t, tCrumbs, snapshot, baseUrl] = await Promise.all([
    getTranslations({ locale, namespace: "PriceIndex.prices" }),
    getTranslations({ locale, namespace: "Breadcrumbs" }),
    fetchPriceIndexSnapshot(),
    getBaseUrl(),
  ]);
  const base = baseUrl.replace(/\/$/, "");

  const items = buildFlatCrumbs({ locale, homeLabel: tCrumbs("home"), label: t("breadcrumb") });
  const jsonLdItems = toBreadcrumbJsonLdItems(items, `/${locale}/prices`);

  const number = new Intl.NumberFormat(locale, { maximumFractionDigits: 0 });
  const date = snapshot ? formatBlogDate(new Date(snapshot.computedAt), locale) : "";
  const cities = snapshot?.cities.filter((c) => c.count > 0) ?? [];
  const reliable = cities.filter((c) => c.reliable && c.median !== null);
  // "Cheapest" and "most expensive" need two cities to compare: with one
  // reliable sample (October 2026: Durrës alone) both answers would name it.
  const comparable = reliable.length >= 2;
  const cheapest = comparable ? reliable.reduce((a, b) => (b.median! < a.median! ? b : a)) : null;
  const dearest = comparable ? reliable.reduce((a, b) => (b.median! > a.median! ? b : a)) : null;

  const faq = [
    cheapest
      ? {
          question: t("faq1q"),
          answer: t("faq1a", { city: cityName(cheapest, locale), median: number.format(cheapest.median!), date }),
        }
      : null,
    dearest
      ? {
          question: t("faq2q"),
          answer: t("faq2a", { city: cityName(dearest, locale), median: number.format(dearest.median!), date }),
        }
      : null,
    { question: t("faq3q"), answer: t("faq3a") },
  ].filter((x): x is { question: string; answer: string } => x !== null);

  const dataset = snapshot
    ? {
        "@context": "https://schema.org",
        "@type": "Dataset",
        "@id": `${base}${PRICE_INDEX_JSON_PATH}#dataset`,
        name: `${PRICE_INDEX_NAME}: asking prices of flats in Albania by city`,
        description: `Median and 20th–80th percentile asking price per m² of flats and studios listed for sale on domlivo.com, by city, computed on ${snapshot.asOf} from ${snapshot.national.listings} listings.`,
        url: `${base}/${locale}/prices`,
        inLanguage: locale,
        isAccessibleForFree: true,
        license: PRICE_INDEX_LICENSE_URL,
        dateModified: snapshot.computedAt,
        temporalCoverage: snapshot.asOf,
        spatialCoverage: { "@type": "Country", name: "Albania" },
        creator: { "@id": organizationId(base) },
        publisher: { "@id": organizationId(base) },
        distribution: [
          {
            "@type": "DataDownload",
            encodingFormat: "application/json",
            contentUrl: `${base}${PRICE_INDEX_JSON_PATH}`,
          },
        ],
        includedInDataCatalog: { "@id": priceIndexCatalogId(base) },
        isBasedOn: `${base}${methodologyPath("en")}`,
      }
    : null;

  return (
    <main>
      <BreadcrumbJsonLd items={jsonLdItems} baseUrl={base} />
      {dataset ? (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(dataset).replace(/</g, "\\u003c") }}
        />
      ) : null}
      <FaqJsonLd items={faq} />

      <section className={PAGE_TOP}>
        <div className={CONTAINER}>
          <Breadcrumb items={items} />
          <div className={cn(MEASURE, "mt-6")}>
            <h1 className={SECTION_TITLE}>{t("h1")}</h1>
            <p className={cn(SECTION_LEAD, "mt-4")}>
              {snapshot
                ? t("lead", { date, listings: number.format(snapshot.national.listings), min: MIN_HEADLINE_SAMPLE })
                : t("leadNoData")}
            </p>
          </div>
        </div>
      </section>

      {snapshot && cities.length > 0 ? (
        <>
          <PriceTableSection
            locale={locale}
            section={{
              title: loc(t("tableTitle")),
              subtitle: loc(t("tableLead")),
              labelHeader: loc(t("colCity")),
              columns: [loc(t("colMedian")), loc(t("colRange")), loc(t("colCount"))],
              rows: cities.map((c) => ({
                _key: c.slug,
                label: loc(cityName(c, locale)),
                cells: c.reliable
                  ? [
                      loc(c.median === null ? "—" : `€${number.format(c.median)}`),
                      loc(c.p20 === null || c.p80 === null ? "—" : `€${number.format(c.p20)}–${number.format(c.p80)}`),
                      loc(number.format(c.count)),
                    ]
                  : [loc(t("lowSampleCell")), loc("—"), loc(number.format(c.count))],
                href: `/${c.country}/${c.slug}/info`,
              })),
              caption: t("tableCaption", { date }),
              lastUpdated: snapshot.computedAt,
            }}
          />
          <PriceTableSection
            locale={locale}
            section={{
              title: loc(t("stageTitle")),
              subtitle: loc(t("stageLead", { min: MIN_HEADLINE_SAMPLE })),
              labelHeader: loc(t("colCity")),
              columns: [loc(t("colNewBuild")), loc(t("colCompleted"))],
              rows: cities.map((c) => ({
                _key: `${c.slug}-stage`,
                label: loc(cityName(c, locale)),
                cells: [loc(figureCell(c.newBuild, number)), loc(figureCell(c.completed, number))],
                href: `/${c.country}/${c.slug}/info`,
              })),
              caption: t("stageCaption", { date }),
              lastUpdated: snapshot.computedAt,
            }}
          />
        </>
      ) : null}

      <Section aria-labelledby="how-heading">
        <div className={SPLIT}>
          <div className={SPLIT_ASIDE}>
            <h2 id="how-heading" className={SECTION_TITLE}>
              {t("howTitle")}
            </h2>
          </div>
          <div className={cn(SPLIT_MAIN, "space-y-4")}>
            <p className={BODY_TEXT}>{t("howBody", { min: MIN_HEADLINE_SAMPLE })}</p>
            <p className={BODY_TEXT}>
              <Link href={methodologyPath(locale)} className={linkClass}>
                {t("methodologyLink")}
              </Link>
              {" · "}
              <a href={PRICE_INDEX_JSON_PATH} className={linkClass} type="application/json">
                {t("downloadJson")}
              </a>
              {" · "}
              <a href={PRICE_INDEX_LICENSE_URL} className={linkClass} rel="license noopener" target="_blank">
                CC BY 4.0
              </a>
            </p>
          </div>
        </div>
      </Section>

      {faq.length > 0 ? (
        <Section aria-labelledby="faq-heading">
          <div className={SPLIT}>
            <div className={SPLIT_ASIDE}>
              <h2 id="faq-heading" className={SECTION_TITLE}>
                {t("faqTitle")}
              </h2>
            </div>
            <div className={SPLIT_MAIN}>
              <FaqAccordion idPrefix="prices-faq" items={faq.map((f) => ({ question: f.question, answer: f.answer }))} />
            </div>
          </div>
        </Section>
      ) : null}
    </main>
  );
}
