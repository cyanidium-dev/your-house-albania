import Link from "@/components/shared/Link";
import { Breadcrumb } from "@/components/shared/Breadcrumb";
import { BreadcrumbJsonLd } from "@/components/shared/BreadcrumbJsonLd";
import { FaqAccordion } from "@/components/shared/faq/FaqAccordion";
import { FaqJsonLd } from "@/components/shared/FaqJsonLd";
import { PriceTableSection } from "@/components/landing/sections/PriceTableSection";
import { textLinkClass } from "@/components/catalog/depthUi";
import {
  BODY_TEXT,
  MEASURE,
  PAGE_TOP,
  Section,
  SECTION_LEAD,
  SECTION_TITLE,
  SPLIT,
  SPLIT_ASIDE,
  SPLIT_MAIN,
} from "@/components/shared/layout";
import { ReferencePriceCalculator } from "@/components/referencePrices/ReferencePriceCalculator";
import { buildFlatCrumbs, toBreadcrumbJsonLdItems } from "@/lib/routes/breadcrumbs";
import { findIndexCity, type PriceIndexSnapshot } from "@/lib/priceIndex/snapshot";
import { ALL_PER_EUR } from "@/lib/calculators/utilities";
import {
  ALL_REFERENCE_PLACES,
  DRAFT_DURRES_ZONES,
  OUTSIDE_TIRANA,
  REFERENCE_SOURCES,
  TIRANA_UNITS,
  TIRANA_ZONES,
  formatSq,
  referencePricesPath,
} from "@/lib/referencePrices/data";
import { REFERENCE_PRICES_COPY as C } from "@/lib/referencePrices/copy";
import { cn } from "@/lib/utils";

const loc = (value: string) => ({ en: value, uk: value, ru: value, sq: value, it: value, pl: value, de: value });
const n0 = formatSq;
const eurPerSqm = (all: number) => `≈ ${n0(all / ALL_PER_EUR)} €`;

/**
 * `/sq/cmimet-e-references`: the official reference prices for flats, a
 * calculator and the taxes that use them (SEO hypothesis 5, lab E01). Every
 * figure is from the acts in `lib/referencePrices/data.ts`; the asking-price
 * column is the live Domlivo Price Index.
 */
export function ReferencePricesView({
  locale,
  baseUrl,
  snapshot,
  homeLabel,
}: {
  locale: string;
  baseUrl: string;
  snapshot: PriceIndexSnapshot | null;
  homeLabel: string;
}) {
  const base = baseUrl.replace(/\/$/, "");
  const pagePath = referencePricesPath();
  const crumbs = buildFlatCrumbs({ locale, homeLabel, label: C.breadcrumb });
  const asking = (slug?: string) => {
    const city = slug ? findIndexCity(snapshot, slug) : null;
    return city?.median && city.reliable ? `${n0(city.median)} €` : "-";
  };

  return (
    <main>
      <BreadcrumbJsonLd items={toBreadcrumbJsonLdItems(crumbs, pagePath)} baseUrl={base} />
      <FaqJsonLd items={C.faq.map((f) => ({ question: f.q, answer: f.a }))} />

      <Section className={PAGE_TOP}>
        <Breadcrumb items={crumbs} />
        <div className={cn(MEASURE, "mt-6")}>
          <h1 className={SECTION_TITLE}>{C.h1}</h1>
          <p className={cn(SECTION_LEAD, "mt-4")}>{C.lead}</p>
          <p className={cn(BODY_TEXT, "mt-4 text-sm")}>{C.checked}</p>
        </div>
      </Section>

      <PriceTableSection
        locale={locale}
        section={{
          title: loc(C.outside.title),
          subtitle: loc(C.outside.lead),
          labelHeader: loc(C.outside.colPlace),
          columns: [loc(C.outside.colRef), loc(C.outside.colRefEur), loc(C.outside.colAsking)],
          rows: OUTSIDE_TIRANA.map((p) => ({
            _key: p.key,
            label: loc(p.name),
            cells: [loc(`${n0(p.value)} lekë`), loc(eurPerSqm(p.value)), loc(asking(p.citySlug))],
            href: p.citySlug ? `/${locale}/albania/${p.citySlug}/info` : undefined,
          })),
          caption: C.outside.caption,
          footnote: C.outside.footnote,
          lastUpdated: "2026-10-21",
        }}
      />

      <Section aria-labelledby="ref-calc">
        <div className={SPLIT}>
          <div className={SPLIT_ASIDE}>
            <h2 id="ref-calc" className={SECTION_TITLE}>
              {C.calc.title}
            </h2>
            <p className={cn(SECTION_LEAD, "mt-3")}>{C.calc.lead}</p>
          </div>
          <div className={SPLIT_MAIN}>
            <ReferencePriceCalculator places={ALL_REFERENCE_PLACES} />
          </div>
        </div>
      </Section>

      <PriceTableSection
        locale={locale}
        section={{
          title: loc(C.tirana.title),
          subtitle: loc(C.tirana.lead),
          labelHeader: loc(C.tirana.colZone),
          columns: [loc(C.outside.colRef), loc(C.outside.colRefEur)],
          rows: [...TIRANA_ZONES, ...TIRANA_UNITS].map((p) => ({
            _key: p.key,
            label: loc(p.name.replace("Tiranë, ", "")),
            cells: [loc(`${n0(p.value)} lekë`), loc(eurPerSqm(p.value))],
          })),
          caption: C.tirana.caption,
          footnote: C.tirana.footnote,
          lastUpdated: "2026-10-21",
        }}
      />

      <Section aria-labelledby="ref-uses">
        <div className={SPLIT}>
          <div className={SPLIT_ASIDE}>
            <h2 id="ref-uses" className={SECTION_TITLE}>
              {C.uses.title}
            </h2>
          </div>
          <div className={cn(SPLIT_MAIN, BODY_TEXT)}>
            <ul className="space-y-4">
              {C.uses.items.map((item) => (
                <li key={item.head}>
                  <strong className="text-dark dark:text-white">{item.head}</strong> {item.text}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Section>

      <PriceTableSection
        locale={locale}
        section={{
          title: loc(C.draft.title),
          subtitle: loc(C.draft.lead),
          labelHeader: loc(C.draft.colZone),
          columns: [loc(C.draft.colValue), loc(C.outside.colRefEur)],
          rows: DRAFT_DURRES_ZONES.map((z) => ({
            _key: z.zone,
            label: loc(z.zone),
            cells: [loc(`${n0(z.value)} lekë`), loc(eurPerSqm(z.value))],
          })),
          caption: C.draft.caption,
          footnote: C.draft.footnote,
          lastUpdated: "2025-07-17",
        }}
      />

      <Section aria-labelledby="ref-faq">
        <div className={SPLIT}>
          <div className={SPLIT_ASIDE}>
            <h2 id="ref-faq" className={SECTION_TITLE}>
              {C.faqTitle}
            </h2>
          </div>
          <div className={SPLIT_MAIN}>
            <FaqAccordion
              idPrefix="ref-faq"
              items={C.faq.map((f) => ({ question: f.q, answer: <p>{f.a}</p> }))}
            />
          </div>
        </div>
      </Section>

      <Section aria-labelledby="ref-sources">
        <div className={SPLIT}>
          <div className={SPLIT_ASIDE}>
            <h2 id="ref-sources" className={SECTION_TITLE}>
              {C.sources.title}
            </h2>
            <p className={cn(SECTION_LEAD, "mt-3")}>{C.sources.lead}</p>
          </div>
          <div className={SPLIT_MAIN}>
            <ul className={cn(BODY_TEXT, "space-y-3")}>
              {Object.values(REFERENCE_SOURCES).map((s) => (
                <li key={s.url}>
                  <a href={s.url} className={textLinkClass} target="_blank" rel="noopener noreferrer">
                    {s.label}
                  </a>
                </li>
              ))}
            </ul>
            <h3 className="mt-10 text-lg font-semibold text-dark dark:text-white">{C.next.title}</h3>
            <ul className={cn(BODY_TEXT, "mt-3 space-y-2")}>
              {C.next.links.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className={textLinkClass}>
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Section>
    </main>
  );
}
