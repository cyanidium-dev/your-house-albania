import { getTranslations } from "next-intl/server";
import Link from "@/components/shared/Link";
import PropertyCard from "@/components/shared/property/PropertyCard";
import { MarketMoney } from "@/components/shared/property/MarketMoney";
import { FaqAccordion } from "@/components/shared/faq/FaqAccordion";
import { FaqJsonLd } from "@/components/shared/FaqJsonLd";
import { ItemListJsonLd } from "@/components/shared/ItemListJsonLd";
import { CatalogBreadcrumb } from "@/components/shared/CatalogBreadcrumb";
import { PriceTableSection } from "@/components/landing/sections/PriceTableSection";
import { QuickLeadForm } from "@/components/shared/QuickLead/QuickLeadForm";
import { StatTiles, chipLinkClass, countClass, noteClass, textLinkClass } from "@/components/catalog/depthUi";
import {
  BODY_TEXT,
  CONTAINER,
  PANEL,
  Section,
  SectionHeading,
  SECTION_LEAD,
  SECTION_TITLE,
  SPLIT,
  SPLIT_ASIDE,
  SPLIT_MAIN,
  balancedGridClass,
} from "@/components/shared/layout";
import { brandButtonClass } from "@/components/shared/BrandButton";
import { PartnerLandingHero } from "./PartnerLandingHero";
import { mapCatalogPropertyToCard } from "@/lib/sanity/propertyAdapter";
import { attachMarketPositionToCards } from "@/lib/property/marketPosition";
import { formatMoney } from "@/lib/currency/format";
import { agentFilterPath, catalogFilterPath, cityInfoPath, districtInfoPath } from "@/lib/routes/catalog";
import { getBaseUrl } from "@/lib/seo/baseUrl";
import { PARTNER_LANDING_MIN_LISTINGS, PARTNER_NAME, PARTNER_SLUG, partnerLandingPath, siblingPartnerLandings } from "@/lib/partnerLandings/config";
import { NEAR_SEA_METERS, percentVsPlace, type LayoutKey } from "@/lib/partnerLandings/facts";
import type { PartnerLandingData } from "@/lib/partnerLandings/load";
import { buildPartnerLandingFaq, partnerLandingDataDate } from "@/lib/partnerLandings/copy";
import { cn } from "@/lib/utils";

const LAYOUT_LABEL_KEY: Record<LayoutKey, "studio" | "oneOne" | "twoOne" | "threePlus"> = {
  studio: "studio",
  "1": "oneOne",
  "2": "twoOne",
  "3": "threePlus",
};

const loc = (value: string) => ({ en: value, uk: value, ru: value, sq: value, it: value, pl: value, de: value });

/**
 * A partner landing: a place (or complex) where one partner agency has a
 * selection worth a page. Everything on it is computed from the live listings
 * or already written in the CMS (the district's own card text); the copy in
 * `messages/*.json` `PartnerLanding` only words the figures. A block whose
 * figure is missing is not rendered.
 */
export async function PartnerLandingView({ locale, data }: { locale: string; data: PartnerLandingData }) {
  const { landing, facts, names, grid, hero, placeMedianPricePerSqm, placeText } = data;
  const { country, city, district } = landing.place;
  const [t, baseUrl] = await Promise.all([getTranslations({ locale, namespace: "PartnerLanding" }), getBaseUrl()]);
  const base = baseUrl.replace(/\/$/, "");
  const number = (n: number) => new Intl.NumberFormat(locale, { maximumFractionDigits: 0 }).format(n);
  const money = (n: number) => formatMoney(n, "EUR", locale);
  const date = partnerLandingDataDate(locale);
  const partner = PARTNER_NAME;
  const vsPlace = percentVsPlace(facts.medianPricePerSqm, placeMedianPricePerSqm);
  const pagePath = partnerLandingPath(locale, landing);
  const pageUrl = `${base}${pagePath}`;
  const title = t("title", { place: names.place, count: facts.count, partner });

  const allHref = agentFilterPath({
    locale,
    agentSlug: PARTNER_SLUG,
    country,
    trustedCityCountrySlug: country,
    city,
    district,
  });
  const placeCatalogHref = catalogFilterPath({ locale, country, trustedCityCountrySlug: country, city, district });
  const infoHref = district ? districtInfoPath(locale, city, district, country) : cityInfoPath(locale, city, country);

  // Cards: the same mapper the catalogue uses, with the district's market band
  // attached so a flat below the median says so on its card.
  const cards = await attachMarketPositionToCards(grid.map((row) => mapCatalogPropertyToCard(row, locale)));

  // "0 m" is the first line, not a distance.
  const seaMinLabel = facts.sea ? (facts.sea.min === 0 ? t("firstLine") : t("metres", { n: number(facts.sea.min) })) : "";

  const stageLine =
    facts.stage.unfinished > 0
      ? facts.stage.handoverYears.length > 0
        ? t("stage.mixed", {
            completed: facts.stage.completed,
            unfinished: facts.stage.unfinished,
            years: facts.stage.handoverYears.join("–"),
          })
        : t("stage.mixedNoYear", { completed: facts.stage.completed, unfinished: facts.stage.unfinished })
      : facts.stage.completed > 0
        ? t("stage.allCompleted", { count: facts.stage.completed })
        : "";

  const lead = [t("lead", { count: facts.count, placeFull: names.placeFull, partner }), stageLine].filter(Boolean).join(" ");

  const stats: Array<{ label: string; value: React.ReactNode }> = [
    { label: t("stats.listings"), value: number(facts.count) },
    ...(facts.priceFrom ? [{ label: t("stats.from"), value: <MarketMoney min={facts.priceFrom} step={1} locale={locale} /> }] : []),
    ...(facts.medianPricePerSqm
      ? [{ label: t("stats.medianSqm"), value: <MarketMoney min={facts.medianPricePerSqm} step={1} locale={locale} /> }]
      : []),
    // A place nobody lists within 300 m of the sea (Tocak: 440 m and up) shows the nearest distance instead of "0 / 10".
    ...(facts.sea
      ? facts.sea.within300 > 0
        ? [{ label: t("stats.nearSea", { metres: NEAR_SEA_METERS }), value: `${number(facts.sea.within300)} / ${number(facts.sea.known)}` }]
        : [{ label: t("stats.nearestSea"), value: seaMinLabel }]
      : []),
  ];

  const aboutLines: string[] = [
    facts.priceFrom && facts.medianPricePerSqm
      ? vsPlace !== null && placeMedianPricePerSqm
        ? t("about.priceVsPlace", {
            from: money(facts.priceFrom),
            median: money(facts.medianPricePerSqm),
            percent: Math.abs(vsPlace),
            direction: vsPlace < 0 ? "below" : vsPlace > 0 ? "above" : "same",
            place: names.district ?? names.city,
            placeMedian: money(placeMedianPricePerSqm),
          })
        : t("about.price", { from: money(facts.priceFrom), median: money(facts.medianPricePerSqm) })
      : "",
    facts.layouts.length > 0
      ? t("about.layouts", {
          list: facts.layouts
            .map((l) => `${t(`layout.${LAYOUT_LABEL_KEY[l.layout]}`)} (${number(l.count)})`)
            .join(", "),
        })
      : "",
    facts.sea
      ? facts.sea.within300 > 0
        ? t("about.sea", { within: facts.sea.within300, known: facts.sea.known, metres: NEAR_SEA_METERS, min: seaMinLabel })
        : t("about.seaNone", { known: facts.sea.known, metres: NEAR_SEA_METERS, min: seaMinLabel, median: number(facts.sea.median) })
      : "",
    stageLine,
  ].filter(Boolean);

  const faq = buildPartnerLandingFaq({ t, facts, names, partner, date, placeMedianPricePerSqm, money, number, seaMinLabel });
  const siblings = siblingPartnerLandings(landing);
  const thin = facts.count < PARTNER_LANDING_MIN_LISTINGS;

  return (
    <main>
      <ItemListJsonLd
        locale={locale}
        baseUrl={base}
        items={cards.map((card) => ({
          name: card.name,
          slug: card.slug,
          href: card._href,
          image: card.images[0]?.src ?? null,
        }))}
        collection={{ name: title, url: pageUrl, placeName: names.placeFull }}
      />
      <FaqJsonLd items={faq} />

      <PartnerLandingHero
        breadcrumb={
          <CatalogBreadcrumb
            locale={locale}
            country={country}
            city={city}
            district={district}
            leaf={t("crumb", { partner })}
            currentPath={pagePath}
          />
        }
        label={t("label", { partner, place: names.placeFull })}
        title={title}
        lead={lead}
        image={hero?.heroImageUrl ? { src: hero.heroImageUrl, alt: t("heroAlt", { placeFull: names.placeFull, partner }) } : null}
        footer={
          <Link href={allHref} className={`${textLinkClass} !text-white`}>
            {t("allListings", { count: facts.count, partner })}
          </Link>
        }
      />

      {stats.length > 0 ? (
        <section className="pt-6 md:pt-8">
          <div className={CONTAINER}>
            <StatTiles stats={stats} />
            {vsPlace !== null && placeMedianPricePerSqm ? (
              <p className={`mt-3 ${noteClass}`}>
                {t("stats.vsPlaceNote", {
                  percent: Math.abs(vsPlace),
                  direction: vsPlace < 0 ? "below" : vsPlace > 0 ? "above" : "same",
                  place: names.district ?? names.city,
                  placeMedian: money(placeMedianPricePerSqm),
                })}
              </p>
            ) : null}
          </div>
        </section>
      ) : null}

      {thin ? (
        <section className="pt-8">
          <div className={CONTAINER}>
            <p className={cn(PANEL, "p-5 text-sm text-dark/70 dark:text-white/70")}>{t("thin", { min: PARTNER_LANDING_MIN_LISTINGS })}</p>
          </div>
        </section>
      ) : null}

      {aboutLines.length > 0 ? (
        <Section aria-labelledby="partner-about">
          <div className={SPLIT}>
            <div className={SPLIT_ASIDE}>
              <h2 id="partner-about" className={SECTION_TITLE}>
                {t("about.title", { partner, place: names.place })}
              </h2>
              <p className={`${SECTION_LEAD} mt-3`}>{t("about.lead")}</p>
            </div>
            <div className={SPLIT_MAIN}>
              <ul className="space-y-3">
                {aboutLines.map((line) => (
                  <li key={line} className={`${BODY_TEXT} flex gap-3`}>
                    <span aria-hidden className="mt-[0.7em] h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                    <span>{line}</span>
                  </li>
                ))}
              </ul>
              {facts.complexes.length > 0 ? (
                <div className="mt-8">
                  <h3 className="text-sm font-semibold text-dark/70 dark:text-white/70">{t("about.complexes")}</h3>
                  <ul className="mt-3 flex flex-wrap gap-2">
                    {facts.complexes.map((c) => {
                      const complexPage = siblings.find((s) => s.complex?.name === c.name);
                      const body = (
                        <>
                          {c.name}
                          <span className={countClass}>{number(c.count)}</span>
                        </>
                      );
                      return (
                        <li key={c.name}>
                          {complexPage ? (
                            <Link href={partnerLandingPath(locale, complexPage)} className={chipLinkClass}>
                              {body}
                            </Link>
                          ) : (
                            <span className={chipLinkClass.replace("hover:border-primary hover:text-primary", "")}>{body}</span>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ) : null}
              <p className={`mt-6 ${noteClass}`}>{t("about.asOf", { date, count: facts.count })}</p>
            </div>
          </div>
        </Section>
      ) : null}

      {facts.layouts.length >= 2 ? (
        <PriceTableSection
          locale={locale}
          section={{
            title: loc(t("table.title", { place: names.place })),
            subtitle: loc(t("table.lead", { partner })),
            labelHeader: loc(t("table.colLayout")),
            columns: [loc(t("table.colCount")), loc(t("table.colArea")), loc(t("table.colFrom")), loc(t("table.colMedianSqm"))],
            rows: facts.layouts.map((l) => ({
              _key: l.layout,
              label: loc(t(`layout.${LAYOUT_LABEL_KEY[l.layout]}`)),
              cells: [
                loc(number(l.count)),
                loc(l.areaMin !== null && l.areaMax !== null ? (l.areaMin === l.areaMax ? `${number(l.areaMin)} m²` : `${number(l.areaMin)}–${number(l.areaMax)} m²`) : "—"),
                loc(l.priceFrom ? money(l.priceFrom) : "—"),
                loc(l.medianPricePerSqm ? `${money(l.medianPricePerSqm)}/m²` : "—"),
              ],
            })),
            caption: t("table.caption", { placeFull: names.placeFull, partner, date }),
            footnote: t("table.footnote"),
          }}
        />
      ) : null}

      {cards.length > 0 ? (
        <Section aria-labelledby="partner-listings">
          <SectionHeading
            id="partner-listings"
            title={t("grid.title", { place: names.place })}
            lead={t("grid.lead", { shown: cards.length, count: facts.count })}
            trailing={
              facts.count > cards.length ? (
                <Link href={allHref} className={brandButtonClass("secondary", undefined, "md")}>
                  {t("grid.all", { count: facts.count })}
                </Link>
              ) : undefined
            }
          />
          <div className={balancedGridClass(cards.length)}>
            {cards.map((card) => (
              <PropertyCard key={card.slug} item={card} locale={locale} fillHeight />
            ))}
          </div>
        </Section>
      ) : null}

      {placeText ? (
        <Section aria-labelledby="partner-place">
          <div className={SPLIT}>
            <div className={SPLIT_ASIDE}>
              <h2 id="partner-place" className={SECTION_TITLE}>
                {t("place.title", { place: names.district ?? names.city })}
              </h2>
            </div>
            <div className={SPLIT_MAIN}>
              <p className={`${BODY_TEXT} whitespace-pre-line`}>{placeText}</p>
              <ul className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-base">
                <li>
                  <Link href={placeCatalogHref} className={textLinkClass}>
                    {t("place.allListings", { place: names.district ?? names.city })}
                  </Link>
                </li>
                <li>
                  <Link href={infoHref} className={textLinkClass}>
                    {t("place.prices", { place: names.district ?? names.city })}
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </Section>
      ) : null}

      {faq.length > 0 ? (
        <Section aria-labelledby="partner-faq">
          <div className={SPLIT}>
            <div className={`${SPLIT_ASIDE} lg:sticky lg:top-28 lg:self-start`}>
              <h2 id="partner-faq" className={SECTION_TITLE}>
                {t("faq.heading", { place: names.place })}
              </h2>
            </div>
            <FaqAccordion
              className={SPLIT_MAIN}
              idPrefix="partner-faq"
              items={faq.map((item) => ({ question: item.question, answer: <p className="whitespace-pre-line">{item.answer}</p> }))}
            />
          </div>
        </Section>
      ) : null}

      <Section aria-labelledby="partner-contact" data-lead-placement="landing">
        <div className={SPLIT}>
          <div className={SPLIT_ASIDE}>
            <h2 id="partner-contact" className={SECTION_TITLE}>
              {t("contact.title", { place: names.place })}
            </h2>
            <p className={`${SECTION_LEAD} mt-3`}>{t("contact.lead", { partner })}</p>
          </div>
          <div className={SPLIT_MAIN}>
            <QuickLeadForm
              locale={locale}
              sourceLabel={`partner:${PARTNER_SLUG}:${landing.slug}`}
              placement="landing"
              landingSlug={`partners/${PARTNER_SLUG}/${landing.slug}`}
              withMessage
              stacked
              messagePlaceholder={t("contact.placeholder")}
              submitLabel={t("contact.submit")}
              subject={{ city, ...(district ? { district } : {}) }}
            />
          </div>
        </div>
      </Section>

      {siblings.length > 0 ? (
        <Section aria-labelledby="partner-more">
          <SectionHeading id="partner-more" title={t("more.title", { partner })} />
          <ul className="flex flex-wrap gap-2">
            {siblings.map((s) => (
              <li key={s.slug}>
                <Link href={partnerLandingPath(locale, s)} className={chipLinkClass}>
                  {t(`more.chips.${s.slug.replace(/-/g, "_")}`)}
                </Link>
              </li>
            ))}
            <li>
              <Link href={agentFilterPath({ locale, agentSlug: PARTNER_SLUG })} className={chipLinkClass}>
                {t("more.agent", { partner })}
              </Link>
            </li>
          </ul>
          <p className={`mt-6 ${noteClass}`}>{t("more.sellerNote", { partner })}</p>
        </Section>
      ) : null}
    </main>
  );
}
