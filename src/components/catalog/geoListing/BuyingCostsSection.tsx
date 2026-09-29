import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { MarketMoney } from "@/components/shared/property/MarketMoney";
import { PURCHASE_COST_RATES, computePurchaseCosts } from "@/lib/property/ownershipCosts";
import { PANEL, Section, SECTION_LEAD, SECTION_TITLE, SPLIT, SPLIT_ASIDE, SPLIT_MAIN } from "@/components/shared/layout";
import { textLinkClass } from "@/components/catalog/depthUi";

/** Guides every foreign buyer needs, whatever the city. Slugs from `BLOG_POST_LISTING_TOPICS`. */
const FOREIGN_BUYER_GUIDES = [
  { slug: "can-foreigners-buy-real-estate-albania", label: "guideForeigners" },
  { slug: "legal-guide-buyers", label: "guideLegal" },
] as const;


/**
 * "Buying as a foreigner: what it costs" — the fees on top of the price, from
 * the same rates the property page's cost block uses, and a worked example at
 * the median flat price of the page it sits on (a city, a district, or the
 * whole country on `/sale`). No median, no example: the rates stand alone.
 */
export async function BuyingCostsSection({
  locale,
  medianFlatPrice,
}: {
  locale: string;
  medianFlatPrice: number | null;
}) {
  const [t, tCosts] = await Promise.all([
    getTranslations({ locale, namespace: "Catalog.depth" }),
    getTranslations({ locale, namespace: "PropertyOwnershipCosts" }),
  ]);
  const number = (n: number, digits = 0) => new Intl.NumberFormat(locale, { maximumFractionDigits: digits }).format(n);
  const example = medianFlatPrice ? computePurchaseCosts(medianFlatPrice) : null;

  return (
    <Section aria-labelledby="listing-costs">
      <div className={SPLIT}>
        <div className={SPLIT_ASIDE}>
          <h2 id="listing-costs" className={SECTION_TITLE}>
            {t("costs.title")}
          </h2>
          <p className={`mt-4 ${SECTION_LEAD}`}>{t("costs.lead")}</p>
        </div>
        <div className={SPLIT_MAIN}>
          <div className={`${PANEL} p-6 md:p-8`}>
            <ul className="grid gap-3 text-base text-dark/80 dark:text-white/80">
              {[
                t("costs.notary", {
                  min: number(PURCHASE_COST_RATES.notaryPctMin, 2),
                  max: number(PURCHASE_COST_RATES.notaryPctMax, 2),
                }),
                t("costs.registration", {
                  lek: number(PURCHASE_COST_RATES.registrationAll),
                  eur: number(PURCHASE_COST_RATES.registrationEur),
                }),
                t("costs.agency", { pct: number(PURCHASE_COST_RATES.agencyBuyerPct, 1) }),
                tCosts("transferTaxNote"),
              ].map((line) => (
                <li key={line} className="flex items-start gap-3">
                  <span aria-hidden className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                  <span>{line}</span>
                </li>
              ))}
            </ul>
            {example && medianFlatPrice ? (
              <p className="mt-6 pt-5 border-t border-dark/10 dark:border-white/10 text-base font-medium text-dark dark:text-white">
                {t.rich("costs.example", {
                  pct: number(example.pct, 1),
                  price: () => <MarketMoney min={medianFlatPrice} step={100} locale={locale} />,
                  total: () => <MarketMoney min={example.totalEur} step={10} locale={locale} />,
                })}
              </p>
            ) : null}
          </div>
          <p className="mt-4 text-xs text-dark/50 dark:text-white/50">{t("costs.source")}</p>
          <p className="mt-4 flex flex-wrap gap-x-5 gap-y-1 text-sm">
            {FOREIGN_BUYER_GUIDES.map((guide) => (
              <Link key={guide.slug} href={`/${locale}/blog/${guide.slug}`} className={textLinkClass}>
                {t(`costs.${guide.label}`)}
              </Link>
            ))}
          </p>
        </div>
      </div>
    </Section>
  );
}
