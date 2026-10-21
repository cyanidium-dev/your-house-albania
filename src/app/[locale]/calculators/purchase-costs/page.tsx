import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { PurchaseCostCalcSection } from "@/components/landing/sections/PurchaseCostCalcSection";
import { CalculatorPageView, type FaqItem, type MethodRow } from "@/components/calculatorPages/CalculatorPageView";
import { fetchCalculatorSections } from "@/lib/sanity/client";
import { buildFlatCrumbs } from "@/lib/routes/breadcrumbs";
import { getBaseUrl } from "@/lib/seo/baseUrl";
import { calculatePurchaseCost } from "@/lib/calculators/purchaseCost";
import {
  CALCULATOR_SOURCE_LANDING_SLUG,
  PURCHASE_EXAMPLE_PRICE_EUR,
  calculatorPath,
} from "@/lib/calculatorPages/config";
import { formatEur, formatPercent, localizePurchaseSection } from "@/lib/calculatorPages/localize";
import {
  calculatorLinkSnippet,
  calculatorPageMetadata,
  calculatorRelatedLinks,
  optionalT,
  type CalcPagesT,
} from "@/lib/calculatorPages/page";

type Props = { params: Promise<{ locale: string }> };

/**
 * `/calculators/purchase-costs`: the landing purchase-cost calculator as a
 * page of its own, for other sites to link to (lib/calculatorPages). The cost
 * lines come from the `purchaseCostCalcSection` of the source landing.
 */
export const revalidate = 3600;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "CalculatorPages" });
  return calculatorPageMetadata({
    locale,
    key: "purchase",
    title: t("purchase.metaTitle"),
    description: t("purchase.metaDescription"),
  });
}

export default async function PurchaseCostsCalculatorPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const [tRaw, tCrumbs, sections, baseUrl] = await Promise.all([
    getTranslations({ locale, namespace: "CalculatorPages" }),
    getTranslations({ locale, namespace: "Breadcrumbs" }),
    fetchCalculatorSections(CALCULATOR_SOURCE_LANDING_SLUG),
    getBaseUrl(),
  ]);
  const t = tRaw as unknown as CalcPagesT;
  const localized = localizePurchaseSection(sections.purchase, locale, optionalT(t));
  const eur = (n: number) => formatEur(locale, n);
  const pct = (n: number) => formatPercent(locale, n);

  const items = localized?.items ?? [];
  const byKey = new Map(items.map((i) => [i.key, i]));

  const method: MethodRow[] = items.map((item) => ({
    label: item.label,
    rule:
      item.kind === "percent"
        ? item.capEur
          ? t("shared.percentCapRule", { pct: pct(item.value), cap: eur(item.capEur) })
          : t("shared.percentRule", { pct: pct(item.value) })
        : t("shared.fixedRule", { amount: eur(item.value) }),
    ...(item.note ? { note: item.note } : {}),
  }));

  const example = calculatePurchaseCost(PURCHASE_EXAMPLE_PRICE_EUR, items);
  const list = new Intl.ListFormat(locale, { style: "long", type: "conjunction" });
  const lawyer = byKey.get("cost2");
  const translator = byKey.get("cost3");
  const registration = byKey.get("cost1");

  const faq: FaqItem[] = [
    example
      ? {
          question: t("purchase.faq1q"),
          answer: t("purchase.faq1a", {
            price: eur(PURCHASE_EXAMPLE_PRICE_EUR),
            total: eur(example.totalCostsEur),
            pct: pct(Math.round(example.overheadPct * 10) / 10),
            lines: list.format(example.lines.map((l) => `${l.label} ${eur(l.amountEur)}`)),
          }),
        }
      : null,
    { question: t("purchase.faq2q"), answer: t("purchase.faq2a") },
    lawyer?.kind === "fixed" && translator?.kind === "fixed"
      ? {
          question: t("purchase.faq3q"),
          answer: t("purchase.faq3a", { lawyer: eur(lawyer.value), translator: eur(translator.value) }),
        }
      : null,
    registration?.kind === "fixed"
      ? { question: t("purchase.faq4q"), answer: t("purchase.faq4a", { registration: eur(registration.value) }) }
      : null,
  ].filter((x): x is FaqItem => x !== null);

  return (
    <CalculatorPageView
      baseUrl={baseUrl}
      path={calculatorPath(locale, "purchase")}
      crumbs={buildFlatCrumbs({ locale, homeLabel: tCrumbs("home"), label: t("purchase.breadcrumb") })}
      h1={t("purchase.h1")}
      lead={t("purchase.lead")}
      calculator={localized ? <PurchaseCostCalcSection locale={locale} section={localized.section} /> : null}
      method={{
        title: t("shared.methodTitle"),
        rows: method,
        footnotes: [t("purchase.totalNote"), t("purchase.noTransferTax")],
      }}
      faq={{ title: t("shared.faqTitle"), items: faq }}
      related={{ title: t("shared.relatedTitle"), links: calculatorRelatedLinks(locale, "purchase", t) }}
      linkBox={{
        title: t("shared.linkTitle"),
        lead: t("shared.linkLead"),
        snippet: calculatorLinkSnippet(baseUrl, locale, "purchase", t("purchase.linkText")),
        copyLabel: t("shared.linkCopy"),
        copiedLabel: t("shared.linkCopied"),
        fieldLabel: t("shared.linkField"),
      }}
    />
  );
}
