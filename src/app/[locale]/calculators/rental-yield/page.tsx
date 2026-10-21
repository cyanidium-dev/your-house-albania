import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { RoiCalcSection } from "@/components/landing/sections/RoiCalcSection";
import { CalculatorPageView, type FaqItem, type MethodRow } from "@/components/calculatorPages/CalculatorPageView";
import { fetchCalculatorSections } from "@/lib/sanity/client";
import { buildFlatCrumbs } from "@/lib/routes/breadcrumbs";
import { getBaseUrl } from "@/lib/seo/baseUrl";
import {
  BUYING_COSTS_FIXED_EUR,
  BUYING_COSTS_PCT,
  FIXED_OWNER_COSTS_EUR,
  REPAIRS_PCT_OF_PRICE,
  STR_LOCAL_TAX_PCT,
  STR_PLATFORM_FEE_PCT,
  STR_UTILITIES_EUR,
  calculateRoi,
} from "@/lib/calculators/roi";
import {
  CALCULATOR_SOURCE_LANDING_SLUG,
  RENTAL_EXAMPLE_PRICE_EUR,
  calculatorPath,
} from "@/lib/calculatorPages/config";
import { formatEur, formatPercent, localizeRoiSection, type LocalizedPreset } from "@/lib/calculatorPages/localize";
import {
  calculatorLinkSnippet,
  calculatorPageMetadata,
  calculatorRelatedLinks,
  optionalT,
  type CalcPagesT,
} from "@/lib/calculatorPages/page";

type Props = { params: Promise<{ locale: string }> };

/**
 * `/calculators/rental-yield`: the landing ROI calculator as a page of its
 * own, for other sites to link to (lib/calculatorPages). Presets and the tax
 * rate come from the `roiCalcSection` of the source landing; the cost model
 * is `lib/calculators/roi.ts`, and the method block prints its constants.
 */
export const revalidate = 3600;

/** Used when Sanity has no section to read the rate from; the same default as `RoiCalcSection`. */
const DEFAULT_TAX_PCT = 15;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const [t, sections] = await Promise.all([
    getTranslations({ locale, namespace: "CalculatorPages" }),
    fetchCalculatorSections(CALCULATOR_SOURCE_LANDING_SLUG),
  ]);
  const taxRate = Number.isFinite(Number(sections.roi?.taxRatePct)) ? Number(sections.roi?.taxRatePct) : DEFAULT_TAX_PCT;
  return calculatorPageMetadata({
    locale,
    key: "rental",
    title: t("rental.metaTitle"),
    description: t("rental.metaDescription", { tax: formatPercent(locale, taxRate) }),
  });
}

function presetNetYield(preset: LocalizedPreset, priceEur: number, taxRatePct: number) {
  return calculateRoi({
    priceEur,
    rentalType: preset.rentalType,
    monthlyRentEur: preset.monthlyRentEur ?? 0,
    adrEur: preset.adrEur ?? 0,
    occupancyPct: preset.occupancyPct ?? 0,
    seasonNightsCap: preset.seasonNightsCap,
    mgmtFeePct: preset.mgmtFeePct ?? 0,
    taxRatePct,
  });
}

export default async function RentalYieldCalculatorPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const [tRaw, tCrumbs, sections, baseUrl] = await Promise.all([
    getTranslations({ locale, namespace: "CalculatorPages" }),
    getTranslations({ locale, namespace: "Breadcrumbs" }),
    fetchCalculatorSections(CALCULATOR_SOURCE_LANDING_SLUG),
    getBaseUrl(),
  ]);
  const t = tRaw as unknown as CalcPagesT;
  const localized = localizeRoiSection(sections.roi, locale, optionalT(t));
  const eur = (n: number) => formatEur(locale, n);
  const pct = (n: number) => formatPercent(locale, n);
  const yieldPct = (n: number) => formatPercent(locale, Math.round(n * 10) / 10);

  const taxRatePct = localized?.taxRatePct ?? DEFAULT_TAX_PCT;
  const tax = pct(taxRatePct);
  const presets = localized?.presets ?? [];

  const method: MethodRow[] = [
    { label: t("rental.methodGrossLabel"), rule: t("rental.methodGross") },
    {
      label: t("rental.methodLetLabel"),
      rule: t("rental.methodLet", { platform: pct(STR_PLATFORM_FEE_PCT), localTax: pct(STR_LOCAL_TAX_PCT) }),
    },
    { label: t("rental.methodMgmtLabel"), rule: t("rental.methodMgmt") },
    {
      label: t("rental.methodRunningLabel"),
      rule: t("rental.methodRunning", {
        repairs: pct(REPAIRS_PCT_OF_PRICE),
        fixed: eur(FIXED_OWNER_COSTS_EUR),
        utilities: eur(STR_UTILITIES_EUR),
      }),
    },
    { label: t("rental.methodTaxLabel"), rule: t("rental.methodTax", { tax }) },
    { label: t("rental.methodGrossYieldLabel"), rule: t("rental.methodGrossYield") },
    {
      label: t("rental.methodNetYieldLabel"),
      rule: t("rental.methodNetYield", { buyPct: pct(BUYING_COSTS_PCT), buyFixed: eur(BUYING_COSTS_FIXED_EUR) }),
    },
  ];

  const examplePrice = eur(RENTAL_EXAMPLE_PRICE_EUR);
  const ltr = presets.find((p) => p.rentalType === "ltr" && (p.monthlyRentEur ?? 0) > 0) ?? null;
  const str = presets.find((p) => p.rentalType === "str" && (p.adrEur ?? 0) > 0 && (p.occupancyPct ?? 0) > 0) ?? null;
  const ltrResult = ltr ? presetNetYield(ltr, RENTAL_EXAMPLE_PRICE_EUR, taxRatePct) : null;
  const presetYields = presets
    .map((p) => ({ preset: p, result: presetNetYield(p, RENTAL_EXAMPLE_PRICE_EUR, taxRatePct) }))
    .filter((x) => x.result !== null);

  const strFigures = str
    ? str.seasonNightsCap
      ? t("rental.strFigures", {
          adr: eur(str.adrEur!),
          occupancy: pct(str.occupancyPct!),
          nights: str.seasonNightsCap,
        })
      : t("rental.strFiguresNoCap", { adr: eur(str.adrEur!), occupancy: pct(str.occupancyPct!) })
    : null;

  const faq: FaqItem[] = [
    { question: t("rental.faq1q"), answer: t("rental.faq1a", { tax }) },
    {
      question: t("rental.faq2q"),
      answer: ltrResult
        ? `${t("rental.faq2a")} ${t("rental.faq2Example", {
            price: examplePrice,
            gross: yieldPct(ltrResult.grossYieldPct),
            net: yieldPct(ltrResult.netYieldPct),
          })}`
        : t("rental.faq2a"),
    },
    presetYields.length > 1
      ? {
          question: t("rental.faq3q"),
          answer: t("rental.faq3a", {
            price: examplePrice,
            // Semicolons, not a list format: preset labels carry commas of their own.
            list: presetYields
              .map(({ preset, result }) =>
                t("rental.presetYield", { label: preset.label, net: yieldPct(result!.netYieldPct) }),
              )
              .join("; "),
          }),
        }
      : null,
    str && ltr && strFigures
      ? {
          question: t("rental.faq4q"),
          answer: t("rental.faq4a", { str: strFigures, ltr: t("rental.ltrFigures", { rent: eur(ltr.monthlyRentEur!) }) }),
        }
      : null,
  ].filter((x): x is FaqItem => x !== null);

  return (
    <CalculatorPageView
      baseUrl={baseUrl}
      path={calculatorPath(locale, "rental")}
      crumbs={buildFlatCrumbs({ locale, homeLabel: tCrumbs("home"), label: t("rental.breadcrumb") })}
      h1={t("rental.h1")}
      lead={t("rental.lead", { tax })}
      calculator={localized ? <RoiCalcSection locale={locale} section={localized.section} /> : null}
      method={{
        title: t("shared.methodTitle"),
        rows: method,
        footnotes: presets.length > 0 ? [t("rental.presetsNote")] : [],
      }}
      faq={{ title: t("shared.faqTitle"), items: faq }}
      related={{ title: t("shared.relatedTitle"), links: calculatorRelatedLinks(locale, "rental", t) }}
      linkBox={{
        title: t("shared.linkTitle"),
        lead: t("shared.linkLead"),
        snippet: calculatorLinkSnippet(baseUrl, locale, "rental", t("rental.linkText")),
        copyLabel: t("shared.linkCopy"),
        copiedLabel: t("shared.linkCopied"),
        fieldLabel: t("shared.linkField"),
      }}
    />
  );
}
