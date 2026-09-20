import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { MarketMoney } from "@/components/shared/property/MarketMoney";
import { PURCHASE_COST_RATES, computePurchaseCosts } from "@/lib/property/ownershipCosts";

/** Guides every foreign buyer needs, whatever the city. Slugs from `BLOG_POST_LISTING_TOPICS`. */
const FOREIGN_BUYER_GUIDES = [
  { slug: "can-foreigners-buy-real-estate-albania", label: "guideForeigners" },
  { slug: "legal-guide-buyers", label: "guideLegal" },
] as const;

const textLinkClass = "text-primary font-medium underline-offset-4 hover:underline";

/**
 * "Buying as a foreigner: what it costs" — the fees on top of the price, from
 * the same rates the property page's cost block uses, and a worked example at
 * the median flat price of the page it sits on (a city, a district, or the
 * whole country on `/sale`). No median, no example: the rates stand alone.
 */
export async function BuyingCostsSection({
  locale,
  medianFlatPrice,
  headingClassName,
}: {
  locale: string;
  medianFlatPrice: number | null;
  headingClassName: string;
}) {
  const [t, tCosts] = await Promise.all([
    getTranslations({ locale, namespace: "Catalog.depth" }),
    getTranslations({ locale, namespace: "PropertyOwnershipCosts" }),
  ]);
  const number = (n: number, digits = 0) => new Intl.NumberFormat(locale, { maximumFractionDigits: digits }).format(n);
  const example = medianFlatPrice ? computePurchaseCosts(medianFlatPrice) : null;

  return (
    <section aria-labelledby="listing-costs">
      <h2 id="listing-costs" className={headingClassName}>
        {t("costs.title")}
      </h2>
      <p className="mt-2 text-sm leading-relaxed text-dark/75 dark:text-white/75 max-w-3xl">{t("costs.lead")}</p>
      <ul className="mt-3 grid gap-1.5 text-sm text-dark/80 dark:text-white/80 list-disc pl-5 max-w-3xl">
        <li>
          {t("costs.notary", {
            min: number(PURCHASE_COST_RATES.notaryPctMin, 2),
            max: number(PURCHASE_COST_RATES.notaryPctMax, 2),
          })}
        </li>
        <li>
          {t("costs.registration", {
            lek: number(PURCHASE_COST_RATES.registrationAll),
            eur: number(PURCHASE_COST_RATES.registrationEur),
          })}
        </li>
        <li>{t("costs.agency", { pct: number(PURCHASE_COST_RATES.agencyBuyerPct, 1) })}</li>
        <li>{tCosts("transferTaxNote")}</li>
      </ul>
      {example && medianFlatPrice ? (
        <p className="mt-3 text-sm text-dark/80 dark:text-white/80 max-w-3xl">
          {t.rich("costs.example", {
            pct: number(example.pct, 1),
            price: () => <MarketMoney min={medianFlatPrice} step={100} locale={locale} />,
            total: () => <MarketMoney min={example.totalEur} step={10} locale={locale} />,
          })}
        </p>
      ) : null}
      <p className="mt-3 text-xs text-dark/50 dark:text-white/50 max-w-3xl">{t("costs.source")}</p>
      <p className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-sm">
        {FOREIGN_BUYER_GUIDES.map((guide) => (
          <Link key={guide.slug} href={`/${locale}/blog/${guide.slug}`} className={textLinkClass}>
            {t(`costs.${guide.label}`)}
          </Link>
        ))}
      </p>
    </section>
  );
}
