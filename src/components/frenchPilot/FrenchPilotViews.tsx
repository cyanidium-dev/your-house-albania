import { getTranslations } from "next-intl/server";
import Link from "@/components/shared/Link";
import PropertyCard from "@/components/shared/property/PropertyCard";
import { Breadcrumb } from "@/components/shared/Breadcrumb";
import { BreadcrumbJsonLd } from "@/components/shared/BreadcrumbJsonLd";
import { FaqAccordion } from "@/components/shared/faq/FaqAccordion";
import { FaqJsonLd } from "@/components/shared/FaqJsonLd";
import { ItemListJsonLd } from "@/components/shared/ItemListJsonLd";
import { PriceTableSection } from "@/components/landing/sections/PriceTableSection";
import { LeadFormSection } from "@/components/landing/sections/LeadFormSection";
import { PartnerLandingHero } from "@/components/partnerLandings/PartnerLandingHero";
import { brandButtonClass } from "@/components/shared/BrandButton";
import { textLinkClass } from "@/components/catalog/depthUi";
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
import type { BreadcrumbItem } from "@/components/shared/Breadcrumb";
import { toBreadcrumbJsonLdItems } from "@/lib/routes/breadcrumbs";
import { MIN_HEADLINE_SAMPLE } from "@/lib/priceIndex/snapshot";
import { methodologyPath } from "@/lib/priceIndex/publish";
import { FRENCH_PILOT_CITY, FRENCH_PILOT_DISTRICTS, frenchGuidePath, frenchHubPath, type FrenchGuideKey } from "@/lib/frenchPilot/config";
import { FRENCH_SEA_MAX_METERS, frenchSeaListings, type FrenchPilotData } from "@/lib/frenchPilot/load";
import type { FrenchPilotListing } from "@/lib/sanity/queries/frenchPilot";
import { cn } from "@/lib/utils";

/**
 * The French pilot's own pages: the hub `/fr/immobilier-albanie` and its two
 * guides. Every figure is the live Price Index or a listing; the prose
 * repeats facts the German guides state with their sources, plus the
 * Franco-Albanian tax convention of 2002. A block without data is not
 * rendered. Copy: `messages/fr.json` `FrenchPilot`.
 */

/** A table cell in every locale the table resolver may ask for. */
const loc = (value: string) => ({ en: value, uk: value, ru: value, sq: value, it: value, pl: value, de: value, fr: value });

type T = Awaited<ReturnType<typeof getTranslations<"FrenchPilot">>>;

function helpers(locale: string, data: FrenchPilotData) {
  const money = (n: number) => formatMoney(n, "EUR", locale);
  const number = (n: number) => new Intl.NumberFormat(locale, { maximumFractionDigits: 0 }).format(n);
  const date = data.snapshot ? formatBlogDate(new Date(data.snapshot.computedAt), locale) : "";
  const placeName = (row: { slug: string; title?: unknown }) => resolveLocalizedString(row.title as never, locale) || row.slug;
  const cityHref = (row: { slug: string; country: string }) =>
    catalogFilterPath({ locale, country: row.country, trustedCityCountrySlug: row.country, city: row.slug });
  const districtHref = (slug: string) =>
    catalogFilterPath({ locale, country: "albania", trustedCityCountrySlug: "albania", city: FRENCH_PILOT_CITY, district: slug });
  return { money, number, date, placeName, cityHref, districtHref };
}

async function messengersFor(locale: string, data: FrenchPilotData) {
  const context = await getMessengerContext({ locale, placement: "landing" });
  const list = resolveMessengers((data.siteSettings as { socialLinks?: SocialLinkInput[] } | null)?.socialLinks, locale, context);
  return list.length ? list : null;
}

function ListingsSection({
  id,
  title,
  lead,
  cards,
  locale,
  trailing,
}: {
  id: string;
  title: string;
  lead?: string;
  cards: Awaited<ReturnType<typeof attachMarketPositionToCards>>;
  locale: string;
  trailing?: React.ReactNode;
}) {
  if (cards.length === 0) return null;
  return (
    <Section aria-labelledby={id}>
      <SectionHeading id={id} title={title} lead={lead} trailing={trailing} />
      <div className={balancedGridClass(cards.length)}>
        {cards.map((card) => (
          <PropertyCard key={card.slug} item={card} locale={locale} fillHeight />
        ))}
      </div>
    </Section>
  );
}

function DistrictTable({ t, locale, data }: { t: T; locale: string; data: FrenchPilotData }) {
  const { money, number, date, placeName, districtHref } = helpers(locale, data);
  if (!data.snapshot || data.durresDistricts.length === 0) return null;
  return (
    <PriceTableSection
      locale={locale}
      section={{
        title: loc(t("districts.title")),
        subtitle: loc(t("districts.lead")),
        labelHeader: loc(t("districts.colDistrict")),
        columns: [loc(t("table.colMedian")), loc(t("table.colFrom")), loc(t("table.colSample"))],
        rows: data.durresDistricts.map((d) => ({
          _key: d.slug,
          label: loc(placeName(d)),
          cells: [
            loc(d.median !== null ? money(d.median) : t("table.lowSample")),
            loc(d.flatPriceFrom !== null ? money(d.flatPriceFrom) : "-"),
            loc(number(d.count)),
          ],
          // Only the pilot's districts have a French page worth sending a reader to.
          href: d.pilot ? districtHref(d.slug) : undefined,
        })),
        caption: t("districts.caption", { date }),
        footnote: t("table.footnote", { min: MIN_HEADLINE_SAMPLE }),
        lastUpdated: data.snapshot.computedAt,
      }}
    />
  );
}

function ProseSection({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <Section aria-labelledby={id}>
      <div className={SPLIT}>
        <div className={SPLIT_ASIDE}>
          <h2 id={id} className={SECTION_TITLE}>
            {title}
          </h2>
        </div>
        <div className={cn(SPLIT_MAIN, BODY_TEXT, "space-y-4")}>{children}</div>
      </div>
    </Section>
  );
}

async function toCards(rows: readonly FrenchPilotListing[], locale: string) {
  return attachMarketPositionToCards(rows.map((row) => mapCatalogPropertyToCard(row, locale)));
}

function cardItemList(cards: Awaited<ReturnType<typeof toCards>>) {
  return cards.map((card) => ({ name: card.name, slug: card.slug, href: card._href, image: card.images[0]?.src ?? null }));
}

/** The hub's lead figures: "Durrës 1 400 €/m² (420 appartements), Tirana …". */
export function frenchLeadFigures(t: T, locale: string, data: FrenchPilotData): string {
  const { money, placeName } = helpers(locale, data);
  return data.leadCities
    .map((c) => t("leadFigure", { city: placeName(c), median: money(c.medianPerSqm!), count: c.count }))
    .join(", ");
}

export async function FrenchHubView({ locale, data }: { locale: string; data: FrenchPilotData }) {
  const [t, tCrumbs, messengers] = await Promise.all([
    getTranslations({ locale, namespace: "FrenchPilot" }),
    getTranslations({ locale, namespace: "Breadcrumbs" }),
    messengersFor(locale, data),
  ]);
  const { money, number, date, placeName, cityHref } = helpers(locale, data);
  const base = data.baseUrl.replace(/\/$/, "");
  const pagePath = frenchHubPath();
  const figures = frenchLeadFigures(t, locale, data);
  const durres = data.cityRows.find((c) => c.slug === FRENCH_PILOT_CITY);

  const crumbs: BreadcrumbItem[] = [{ label: tCrumbs("home"), href: `/${locale}` }, { label: t("breadcrumb") }];
  const cards = await toCards(data.listings.slice(0, 12), locale);
  const hero = data.listings[0];

  const faq = [1, 2, 3, 4, 5, 6].map((n) => {
    let answer: string;
    if (n === 4) {
      answer = durres?.medianPerSqm && date ? t("faq.a4", { date, durresMedian: money(durres.medianPerSqm) }) : t("faq.a4NoData");
    } else {
      answer = t(`faq.a${n}` as "faq.a1");
    }
    const href = n === 4 ? frenchGuidePath("seaside") : frenchGuidePath("buying");
    return { n, question: t(`faq.q${n}` as "faq.q1"), answer, href };
  });

  const guides: { key: FrenchGuideKey; title: string; lead: string }[] = [
    { key: "buying", title: t("buying.cardTitle"), lead: t("buying.cardLead") },
    { key: "seaside", title: t("seaside.cardTitle"), lead: t("seaside.cardLead") },
  ];

  return (
    <main>
      <BreadcrumbJsonLd items={toBreadcrumbJsonLdItems(crumbs, pagePath)} baseUrl={base} />
      <ItemListJsonLd
        locale={locale}
        baseUrl={base}
        items={cardItemList(cards)}
        collection={{ name: t("hub.h1"), url: `${base}${pagePath}`, placeName: "Albanie" }}
      />
      <FaqJsonLd items={faq.map((f) => ({ question: f.question, answer: f.answer }))} />

      <PartnerLandingHero
        breadcrumb={<Breadcrumb items={crumbs} overHero />}
        label={t("label")}
        title={t("hub.h1")}
        lead={figures && date ? t("hub.lead", { date, figures, count: cards.length }) : t("hub.leadNoData")}
        image={hero?.mainImageUrl ? { src: hero.mainImageUrl, alt: t("heroAlt") } : null}
        footer={
          durres ? (
            <Link href={cityHref(durres)} className={`${textLinkClass} !text-white`}>
              {t("allDurres")}
            </Link>
          ) : null
        }
      />

      {data.snapshot && data.cityRows.length > 0 ? (
        <PriceTableSection
          locale={locale}
          section={{
            title: loc(t("table.title")),
            subtitle: loc(t("table.lead")),
            labelHeader: loc(t("table.colCity")),
            columns: [loc(t("table.colMedian")), loc(t("table.colFrom")), loc(t("table.colCount")), loc(t("table.colSample"))],
            rows: data.cityRows.map((c) => ({
              _key: c.slug,
              label: loc(placeName(c)),
              cells: [
                loc(c.medianPerSqm !== null ? money(c.medianPerSqm) : t("table.lowSample")),
                loc(c.flatPriceFrom !== null ? money(c.flatPriceFrom) : "-"),
                loc(number(c.listings)),
                loc(number(c.count)),
              ],
              href: cityHref(c),
            })),
            caption: t("table.caption", { date }),
            footnote: t("table.footnote", { min: MIN_HEADLINE_SAMPLE }),
            lastUpdated: data.snapshot.computedAt,
          }}
        />
      ) : null}
      {data.snapshot ? (
        <Section className="!pt-0">
          <p className={BODY_TEXT}>
            <Link href={`/${locale}/prices`} className={textLinkClass}>
              {t("table.pricesLink")}
            </Link>
            {" · "}
            <Link href={methodologyPath(locale)} className={textLinkClass}>
              {t("table.methodologyLink")}
            </Link>
          </p>
        </Section>
      ) : null}

      <ListingsSection
        id="fr-hub-listings"
        title={t("listings.title", { count: cards.length })}
        lead={t("listings.lead")}
        cards={cards}
        locale={locale}
        trailing={
          durres ? (
            <Link href={cityHref(durres)} className={brandButtonClass("secondary", undefined, "md")}>
              {t("allDurres")}
            </Link>
          ) : null
        }
      />

      <DistrictTable t={t} locale={locale} data={data} />

      <Section aria-labelledby="fr-hub-guides">
        <SectionHeading id="fr-hub-guides" title={t("guides.title")} lead={t("guides.lead")} />
        <ul className="grid gap-6 md:grid-cols-2">
          {guides.map((g) => (
            <li key={g.key} className="rounded-2xl border border-dark/10 p-6 dark:border-white/15">
              <h3 className="text-xl font-semibold text-dark dark:text-white">
                <Link href={frenchGuidePath(g.key)} className="hover:underline">
                  {g.title}
                </Link>
              </h3>
              <p className={cn(BODY_TEXT, "mt-2")}>{g.lead}</p>
              <p className="mt-4">
                <Link href={frenchGuidePath(g.key)} className={textLinkClass}>
                  {t("guides.read")}
                </Link>
              </p>
            </li>
          ))}
        </ul>
      </Section>

      <Section aria-labelledby="fr-hub-faq">
        <div className={SPLIT}>
          <div className={SPLIT_ASIDE}>
            <h2 id="fr-hub-faq" className={SECTION_TITLE}>
              {t("faq.title")}
            </h2>
            <p className={cn(SECTION_LEAD, "mt-3")}>{t("faq.lead")}</p>
          </div>
          <div className={SPLIT_MAIN}>
            <FaqAccordion
              idPrefix="fr-hub-faq"
              items={faq.map((f) => ({
                question: f.question,
                answer: (
                  <>
                    <p>{f.answer}</p>
                    <p className="mt-3">
                      <Link href={f.href} className={textLinkClass}>
                        {t("faq.more")}
                      </Link>
                    </p>
                  </>
                ),
              }))}
            />
          </div>
        </div>
      </Section>

      <LeadFormSection
        locale={locale}
        anchorId="demande"
        title={t("contact.title")}
        subtitle={t("contact.subtitle")}
        budgetOptions={[]}
        withMessage
        messengers={messengers}
      />
    </main>
  );
}

export async function FrenchGuideView({ locale, data, guide }: { locale: string; data: FrenchPilotData; guide: FrenchGuideKey }) {
  const [t, tCrumbs, messengers] = await Promise.all([
    getTranslations({ locale, namespace: "FrenchPilot" }),
    getTranslations({ locale, namespace: "Breadcrumbs" }),
    messengersFor(locale, data),
  ]);
  const { money, number, date, placeName, cityHref } = helpers(locale, data);
  const base = data.baseUrl.replace(/\/$/, "");
  const pagePath = frenchGuidePath(guide);
  const crumbs: BreadcrumbItem[] = [
    { label: tCrumbs("home"), href: `/${locale}` },
    { label: t("breadcrumb"), href: frenchHubPath() },
    { label: guide === "buying" ? t("buying.cardTitle") : t("seaside.cardTitle") },
  ];
  const durres = data.snapshot?.cities.find((c) => c.slug === FRENCH_PILOT_CITY);
  const durresRow = data.cityRows.find((c) => c.slug === FRENCH_PILOT_CITY);
  const rows = guide === "buying" ? data.listings.slice(0, 6) : frenchSeaListings(data.listings).slice(0, 12);
  const cards = await toCards(rows, locale);
  const hero = rows[0] ?? data.listings[0];
  const updated = <p className={cn(BODY_TEXT, "text-sm")}>{t("updated", { date: date || "21 oct. 2026" })}</p>;

  let lead: string;
  if (guide === "buying") {
    lead = t("buying.lead");
  } else {
    lead =
      durres?.median && durres.p20 && durres.p80 && date
        ? t("seaside.lead", {
            date,
            median: money(durres.median),
            p20: money(durres.p20),
            p80: money(durres.p80),
            metres: number(FRENCH_SEA_MAX_METERS),
          })
        : t("seaside.leadNoData");
  }

  const coastRows = data.cityRows.filter((c) => ["durres", "vlore", "sarande", "shengjin", "himare", "ksamil"].includes(c.slug));

  return (
    <main>
      <BreadcrumbJsonLd items={toBreadcrumbJsonLdItems(crumbs, pagePath)} baseUrl={base} />
      {cards.length > 0 ? (
        <ItemListJsonLd
          locale={locale}
          baseUrl={base}
          items={cardItemList(cards)}
          collection={{ name: t(`${guide}.h1`), url: `${base}${pagePath}`, placeName: "Durrës" }}
        />
      ) : null}

      <PartnerLandingHero
        breadcrumb={<Breadcrumb items={crumbs} overHero />}
        label={t(`${guide}.label`)}
        title={t(`${guide}.h1`)}
        lead={lead}
        image={hero?.mainImageUrl ? { src: hero.mainImageUrl, alt: t("heroAlt") } : null}
        footer={
          <Link href={frenchHubPath()} className={`${textLinkClass} !text-white`}>
            {t("breadcrumb")}
          </Link>
        }
      />

      {guide === "buying" ? (
        <>
          <ProseSection id="fr-who" title={t("buying.who.title")}>
            <p>{t("buying.who.p1")}</p>
            <p>{t("buying.who.p2")}</p>
          </ProseSection>
          <ProseSection id="fr-steps" title={t("buying.steps.title")}>
            <ol className="list-decimal space-y-2 pl-5">
              {(["s1", "s2", "s3", "s4", "s5"] as const).map((s) => (
                <li key={s}>{t(`buying.steps.${s}`)}</li>
              ))}
            </ol>
            <p>{t("buying.steps.total")}</p>
          </ProseSection>
          <PriceTableSection
            locale={locale}
            section={{
              title: loc(t("buying.costs.title")),
              subtitle: loc(t("buying.costs.lead")),
              labelHeader: loc(t("buying.costs.colItem")),
              columns: [loc(t("buying.costs.colRule"))],
              rows: (["notary", "cadastre", "transfer", "vat", "yearly"] as const).map((k) => ({
                _key: k,
                label: loc(t(`buying.costs.${k}`)),
                cells: [loc(t(`buying.costs.${k}Rule`))],
              })),
              caption: t("buying.costs.title"),
              footnote: t("buying.costs.total"),
            }}
          />
          <ProseSection id="fr-taxes" title={t("buying.taxes.title")}>
            <p>{t("buying.taxes.p1")}</p>
            <p>{t("buying.taxes.p2")}</p>
            <p>{t("buying.taxes.p3")}</p>
          </ProseSection>
          <ProseSection id="fr-finance" title={t("buying.finance.title")}>
            <p>{t("buying.finance.p1")}</p>
          </ProseSection>
          <ProseSection id="fr-travel" title={t("buying.travel.title")}>
            <p>{t("buying.travel.p1")}</p>
            <p className="text-sm">{t("buying.sources")}</p>
            {updated}
          </ProseSection>
          <ListingsSection
            id="fr-buying-listings"
            title={t("buying.listingsTitle")}
            cards={cards}
            locale={locale}
            trailing={
              <Link href={frenchHubPath()} className={brandButtonClass("secondary", undefined, "md")}>
                {t("breadcrumb")}
              </Link>
            }
          />
        </>
      ) : (
        <>
          <DistrictTable t={t} locale={locale} data={data} />
          {data.snapshot && coastRows.length > 0 ? (
            <PriceTableSection
              locale={locale}
              section={{
                title: loc(t("seaside.coast.title")),
                subtitle: loc(t("seaside.coast.p1")),
                labelHeader: loc(t("table.colCity")),
                columns: [loc(t("table.colMedian")), loc(t("table.colFrom")), loc(t("table.colSample"))],
                rows: coastRows.map((c) => ({
                  _key: c.slug,
                  label: loc(placeName(c)),
                  cells: [
                    loc(c.medianPerSqm !== null ? money(c.medianPerSqm) : t("table.lowSample")),
                    loc(c.flatPriceFrom !== null ? money(c.flatPriceFrom) : "-"),
                    loc(number(c.count)),
                  ],
                  href: c.slug === FRENCH_PILOT_CITY ? cityHref(c) : undefined,
                })),
                caption: t("table.caption", { date }),
                footnote: t("seaside.coast.p2"),
                lastUpdated: data.snapshot.computedAt,
              }}
            />
          ) : null}
          <ListingsSection
            id="fr-sea-listings"
            title={t("seaside.sea.title", { count: cards.length, metres: number(FRENCH_SEA_MAX_METERS) })}
            lead={t("seaside.sea.lead", { metres: number(FRENCH_SEA_MAX_METERS) })}
            cards={cards}
            locale={locale}
            trailing={
              durresRow ? (
                <Link href={cityHref(durresRow)} className={brandButtonClass("secondary", undefined, "md")}>
                  {t("allDurres")}
                </Link>
              ) : null
            }
          />
          <ProseSection id="fr-read" title={t("seaside.read.title")}>
            <p>{t("seaside.read.p1", { min: MIN_HEADLINE_SAMPLE })}</p>
            <p>
              <Link href={methodologyPath(locale)} className={textLinkClass}>
                {t("table.methodologyLink")}
              </Link>
            </p>
            {updated}
          </ProseSection>
        </>
      )}

      <LeadFormSection
        locale={locale}
        anchorId="demande"
        title={t("contact.title")}
        subtitle={t("contact.subtitle")}
        budgetOptions={[]}
        withMessage
        messengers={messengers}
      />
    </main>
  );
}

/** Districts of the pilot, for the metadata of pages that name them. */
export const FRENCH_PILOT_DISTRICT_COUNT = FRENCH_PILOT_DISTRICTS.length;
