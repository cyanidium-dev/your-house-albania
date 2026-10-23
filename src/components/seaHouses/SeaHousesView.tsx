import { getTranslations } from "next-intl/server";
import Link from "@/components/shared/Link";
import PropertyCard from "@/components/shared/property/PropertyCard";
import { Breadcrumb } from "@/components/shared/Breadcrumb";
import { BreadcrumbJsonLd } from "@/components/shared/BreadcrumbJsonLd";
import { FaqAccordion } from "@/components/shared/faq/FaqAccordion";
import { FaqJsonLd } from "@/components/shared/FaqJsonLd";
import { ItemListJsonLd } from "@/components/shared/ItemListJsonLd";
import { LeadFormSection } from "@/components/landing/sections/LeadFormSection";
import { PartnerLandingHero } from "@/components/partnerLandings/PartnerLandingHero";
import { brandButtonClass } from "@/components/shared/BrandButton";
import { StatTiles, textLinkClass } from "@/components/catalog/depthUi";
import {
  BODY_TEXT,
  Section,
  SectionHeading,
  SECTION_LEAD,
  SECTION_TITLE,
  SPLIT,
  SPLIT_ASIDE,
  SPLIT_MAIN,
  balancedGridClass,
} from "@/components/shared/layout";
import { mapCatalogPropertyToCard } from "@/lib/sanity/propertyAdapter";
import { attachMarketPositionToCards } from "@/lib/property/marketPosition";
import { resolveLocalizedString } from "@/lib/sanity/localized";
import { resolveMessengers } from "@/lib/contacts/messengers";
import { getMessengerContext } from "@/lib/contacts/messengerContext.server";
import type { SocialLinkInput } from "@/lib/footer/socialChannels";
import { formatMoney } from "@/lib/currency/format";
import { formatBlogDate } from "@/lib/date/formatLocale";
import { catalogFilterPath } from "@/lib/routes/catalog";
import { nonGeoDealListingPath } from "@/lib/routes/catalogPathPrimitives";
import { buildFlatCrumbs, toBreadcrumbJsonLdItems } from "@/lib/routes/breadcrumbs";
import { calculatorPath } from "@/lib/calculatorPages/config";
import { germanHubPath } from "@/lib/germanHub/config";
import { SEA_HOUSES_MAX_METERS, seaHousesPath } from "@/lib/seaHouses/config";
import type { SeaHousesData } from "@/lib/seaHouses/load";
import { cn } from "@/lib/utils";

/**
 * `/de/haus-am-meer-albanien-kaufen`. Every figure is a live listing; a block
 * whose data is missing is not rendered. The cost and legal answers repeat
 * what the German hub and the purchase cost calculator state with their
 * sources. Copy: `messages/de.json` `SeaHouses`.
 */
export async function SeaHousesView({ locale, data }: { locale: string; data: SeaHousesData }) {
  const { figures, districts, cards: cardRows, singleCity, siteSettings, baseUrl } = data;
  const [t, tCrumbs, messengerContext] = await Promise.all([
    getTranslations({ locale, namespace: "SeaHouses" }),
    getTranslations({ locale, namespace: "Breadcrumbs" }),
    getMessengerContext({ locale, placement: "landing" }),
  ]);
  const base = baseUrl.replace(/\/$/, "");
  const pagePath = seaHousesPath();
  const pageUrl = `${base}${pagePath}`;

  const number = (n: number) => new Intl.NumberFormat(locale, { maximumFractionDigits: 0 }).format(n);
  const money = (n: number) => formatMoney(n, "EUR", locale);
  const date = formatBlogDate(new Date(), locale);
  const name = (title: unknown, fallback: string) => resolveLocalizedString(title as never, locale) || fallback;
  const cityName = singleCity ? name(districts[0]?.cityTitle, singleCity) : "";
  const housesHref = nonGeoDealListingPath(locale, "sale", "house");
  const villasHref = nonGeoDealListingPath(locale, "sale", "villa");

  const crumbs = buildFlatCrumbs({ locale, homeLabel: tCrumbs("home"), label: t("breadcrumb") });
  const jsonLdCrumbs = toBreadcrumbJsonLdItems(crumbs, pagePath);
  const cards = await attachMarketPositionToCards(cardRows.map((row) => mapCatalogPropertyToCard(row, locale)));

  const hasFigures = figures.count > 0 && figures.from !== null;
  const lead = hasFigures
    ? singleCity
      ? t("lead", { date, count: figures.count, from: money(figures.from!), total: figures.total, city: cityName })
      : t("leadManyCities", { date, count: figures.count, from: money(figures.from!), total: figures.total })
    : t("leadNoData");

  const tiles = [
    { label: t("tiles.sea", { metres: number(SEA_HOUSES_MAX_METERS) }), value: `${number(figures.count)} / ${number(figures.total)}` },
    figures.from !== null ? { label: t("tiles.from"), value: money(figures.from) } : null,
    figures.median !== null ? { label: t("tiles.median"), value: money(figures.median) } : null,
    { label: t("tiles.beachfront"), value: number(figures.beachfront) },
  ].filter((x): x is { label: string; value: string } => x !== null);

  const faq = [
    {
      q: t("faq.q1"),
      a:
        hasFigures && figures.median !== null
          ? t("faq.a1", { date, count: figures.count, from: money(figures.from!), median: money(figures.median) })
          : t("faq.a1NoData"),
    },
    { q: t("faq.q2"), a: singleCity ? t("faq.a2", { city: cityName }) : t("faq.a2NoData") },
    { q: t("faq.q3"), a: t("faq.a3") },
    { q: t("faq.q4"), a: t("faq.a4") },
    { q: t("faq.q5"), a: t("faq.a5") },
    { q: t("faq.q6"), a: t("faq.a6", { metres: number(SEA_HOUSES_MAX_METERS) }) },
  ];

  const messengers = resolveMessengers(
    (siteSettings as { socialLinks?: SocialLinkInput[] } | null)?.socialLinks,
    locale,
    messengerContext,
  );

  return (
    <main>
      <BreadcrumbJsonLd items={jsonLdCrumbs} baseUrl={base} />
      {cards.length > 0 ? (
        <ItemListJsonLd
          locale={locale}
          baseUrl={base}
          items={cards.map((card) => ({ name: card.name, slug: card.slug, href: card._href, image: card.images[0]?.src ?? null }))}
          collection={{ name: t("h1"), url: pageUrl, placeName: "Albanien" }}
        />
      ) : null}
      <FaqJsonLd items={faq.map((f) => ({ question: f.q, answer: f.a }))} />

      <PartnerLandingHero
        breadcrumb={<Breadcrumb items={crumbs} overHero />}
        label={t("label")}
        title={t("h1")}
        lead={lead}
        // The page sells the coast: the city's photograph, not one house's gate.
        image={null}
        place={singleCity ?? "durres"}
        footer={
          <Link href={housesHref} className={`${textLinkClass} !text-white`}>
            {t("allHouses", { count: figures.total })}
          </Link>
        }
      />

      <Section aria-labelledby="houses-why">
        <div className={SPLIT}>
          <div className={SPLIT_ASIDE}>
            <h2 id="houses-why" className={SECTION_TITLE}>
              {t("why.title")}
            </h2>
            <StatTiles stats={tiles} className="mt-6 !grid-cols-2 lg:!grid-cols-2" />
            <p className="mt-3 text-xs text-dark/50 dark:text-white/50">{t("why.tilesNote", { date })}</p>
          </div>
          <div className={cn(SPLIT_MAIN, "space-y-4")}>
            <p className={BODY_TEXT}>{singleCity ? t("why.p1", { city: cityName }) : t("why.p1ManyCities")}</p>
            <p className={BODY_TEXT}>{t("why.p2")}</p>
            <p className={BODY_TEXT}>{t("why.p3")}</p>
            <p className={BODY_TEXT}>
              <Link href={germanHubPath()} className={textLinkClass}>
                {t("why.hubLink")}
              </Link>
            </p>
          </div>
        </div>
      </Section>

      {districts.length > 0 ? (
        <Section aria-labelledby="houses-districts">
          <div className={SPLIT}>
            <div className={SPLIT_ASIDE}>
              <h2 id="houses-districts" className={SECTION_TITLE}>
                {t("table.title")}
              </h2>
              <p className={cn(SECTION_LEAD, "mt-3")}>{t("table.lead", { date })}</p>
            </div>
            <div className={SPLIT_MAIN}>
              <table className="w-full text-left text-sm md:text-base">
                <caption className="sr-only">{t("table.caption", { date })}</caption>
                <thead>
                  <tr className="text-dark/60 dark:text-white/60">
                    <th scope="col" className="py-2 pr-4 font-medium">{t("table.colPlace")}</th>
                    <th scope="col" className="py-2 pr-4 font-medium tabular-nums">{t("table.colCount")}</th>
                    <th scope="col" className="py-2 pr-4 font-medium tabular-nums">{t("table.colFrom")}</th>
                    <th scope="col" className="py-2 pr-4 font-medium tabular-nums">{t("table.colMedian")}</th>
                    <th scope="col" className="py-2 font-medium tabular-nums">{t("table.colArea")}</th>
                  </tr>
                </thead>
                <tbody>
                  {districts.map((d) => {
                    const label = d.districtSlug
                      ? name(d.districtTitle, d.districtSlug)
                      : t("table.otherIn", { city: name(d.cityTitle, d.citySlug) });
                    const href = catalogFilterPath({
                      locale,
                      country: "albania",
                      trustedCityCountrySlug: "albania",
                      city: d.citySlug,
                      district: d.districtSlug ?? undefined,
                    });
                    return (
                      <tr key={`${d.citySlug}/${d.districtSlug ?? ""}`} className="border-t border-dark/10 dark:border-white/10">
                        <th scope="row" className="py-2.5 pr-4 font-medium text-dark dark:text-white">
                          <Link href={href} className={textLinkClass}>
                            {label}
                          </Link>
                        </th>
                        <td className="py-2.5 pr-4 tabular-nums">{number(d.count)}</td>
                        <td className="py-2.5 pr-4 tabular-nums">{d.from !== null ? money(d.from) : "—"}</td>
                        <td className="py-2.5 pr-4 tabular-nums">{d.median !== null ? money(d.median) : t("table.fewHouses")}</td>
                        <td className="py-2.5 tabular-nums">{d.medianArea !== null ? `${number(d.medianArea)} m²` : "—"}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              <p className="mt-4 text-xs text-dark/50 dark:text-white/50">{t("table.note")}</p>
            </div>
          </div>
        </Section>
      ) : null}

      {cards.length > 0 ? (
        <Section aria-labelledby="houses-cards">
          <SectionHeading
            id="houses-cards"
            title={t("cards.title", { count: cards.length })}
            lead={t("cards.lead", { metres: number(SEA_HOUSES_MAX_METERS), total: figures.count })}
            trailing={
              <Link href={housesHref} className={brandButtonClass("secondary", undefined, "md")}>
                {t("cards.all", { count: figures.total })}
              </Link>
            }
          />
          <div className={balancedGridClass(cards.length)}>
            {cards.map((card) => (
              <PropertyCard key={card.slug} item={card} locale={locale} fillHeight />
            ))}
          </div>
          <p className={cn(BODY_TEXT, "mt-6")}>
            <Link href={villasHref} className={textLinkClass}>
              {t("cards.villas")}
            </Link>
          </p>
        </Section>
      ) : null}

      <Section aria-labelledby="houses-costs">
        <div className={SPLIT}>
          <div className={SPLIT_ASIDE}>
            <h2 id="houses-costs" className={SECTION_TITLE}>
              {t("costs.title")}
            </h2>
            <p className={cn(SECTION_LEAD, "mt-3")}>{t("costs.lead")}</p>
          </div>
          <div className={cn(SPLIT_MAIN, "space-y-4")}>
            <p className={BODY_TEXT}>{t("costs.p1")}</p>
            <p className={BODY_TEXT}>{t("costs.p2")}</p>
            <p className={BODY_TEXT}>{t("costs.p3")}</p>
            <p className={BODY_TEXT}>
              <Link href={calculatorPath(locale, "purchase")} className={textLinkClass}>
                {t("costs.calculatorLink")}
              </Link>
            </p>
          </div>
        </div>
      </Section>

      <Section aria-labelledby="houses-faq">
        <div className={SPLIT}>
          <div className={SPLIT_ASIDE}>
            <h2 id="houses-faq" className={SECTION_TITLE}>
              {t("faq.title")}
            </h2>
            <p className={cn(SECTION_LEAD, "mt-3")}>{t("faq.lead")}</p>
          </div>
          <div className={SPLIT_MAIN}>
            <FaqAccordion idPrefix="houses-faq" items={faq.map((f) => ({ question: f.q, answer: <p>{f.a}</p> }))} />
          </div>
        </div>
      </Section>

      <LeadFormSection
        locale={locale}
        anchorId="anfrage"
        title={t("contact.title")}
        subtitle={t("contact.subtitle")}
        budgetOptions={[]}
        withMessage
        messengers={messengers.length ? messengers : null}
      />
    </main>
  );
}
