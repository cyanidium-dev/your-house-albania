/**
 * The questions a partner landing answers, each from a figure the page already
 * shows. A question whose figure is missing is not asked. No I/O: the view
 * passes the translator and the facts.
 */
import { NEAR_SEA_METERS, type LayoutKey, type PartnerSelectionFacts } from "./facts";

export type PartnerLandingTranslator = (key: string, values?: Record<string, string | number | Date>) => string;

const LAYOUT_LABEL_KEY: Record<LayoutKey, string> = { studio: "studio", "1": "oneOne", "2": "twoOne", "3": "threePlus" };

export type PartnerLandingFaqItem = { question: string; answer: string };

export function buildPartnerLandingFaq(input: {
  t: PartnerLandingTranslator;
  facts: PartnerSelectionFacts;
  names: { place: string; placeFull: string; city: string; district: string | null };
  partner: string;
  date: string;
  placeMedianPricePerSqm: number | null;
  money: (n: number) => string;
  number: (n: number) => string;
  /** "120 m", or the words for the first line when the nearest listing is on the beach. */
  seaMinLabel: string;
}): PartnerLandingFaqItem[] {
  const { t, facts, names, partner, date, money, number, seaMinLabel } = input;
  const items: PartnerLandingFaqItem[] = [];

  if (facts.priceFrom && facts.medianPricePerSqm) {
    items.push({
      question: t("faq.priceQ", { place: names.place, partner }),
      answer: input.placeMedianPricePerSqm
        ? t("faq.priceAWithPlace", {
            from: money(facts.priceFrom),
            median: money(facts.medianPricePerSqm),
            count: facts.count,
            date,
            placeMedian: money(input.placeMedianPricePerSqm),
            place: names.district ?? names.city,
          })
        : t("faq.priceA", { from: money(facts.priceFrom), median: money(facts.medianPricePerSqm), count: facts.count, date }),
    });
  }

  if (facts.layouts.length > 0) {
    items.push({
      question: t("faq.layoutsQ", { place: names.place }),
      answer: t("faq.layoutsA", {
        list: facts.layouts
          .map((l) =>
            l.priceFrom
              ? t("faq.layoutItemFrom", { layout: t(`layout.${LAYOUT_LABEL_KEY[l.layout]}`), count: l.count, from: money(l.priceFrom) })
              : t("faq.layoutItem", { layout: t(`layout.${LAYOUT_LABEL_KEY[l.layout]}`), count: l.count }),
          )
          .join("; "),
      }),
    });
  }

  if (facts.sea) {
    items.push({
      question: t("faq.seaQ", { place: names.place }),
      answer:
        facts.sea.within300 > 0
          ? t("faq.seaA", {
              within: facts.sea.within300,
              known: facts.sea.known,
              metres: NEAR_SEA_METERS,
              min: seaMinLabel,
              median: number(facts.sea.median),
            })
          : t("faq.seaANone", { known: facts.sea.known, metres: NEAR_SEA_METERS, min: seaMinLabel, median: number(facts.sea.median) }),
    });
  }

  if (facts.stage.unfinished > 0) {
    items.push({
      question: t("faq.stageQ", { place: names.place }),
      answer:
        facts.stage.handoverYears.length > 0
          ? t("faq.stageA", {
              unfinished: facts.stage.unfinished,
              completed: facts.stage.completed,
              years: facts.stage.handoverYears.join("–"),
            })
          : t("faq.stageANoYear", { unfinished: facts.stage.unfinished, completed: facts.stage.completed }),
    });
  } else if (facts.stage.completed > 0) {
    items.push({
      question: t("faq.stageQ", { place: names.place }),
      answer: t("faq.stageAllCompletedA", { count: facts.stage.completed }),
    });
  }

  items.push({
    question: t("faq.sellerQ"),
    answer: t("faq.sellerA", { partner }),
  });

  return items;
}

/** Today in Tirana, long form: the "data as of" date the figures carry. */
export function partnerLandingDataDate(locale: string): string {
  return new Intl.DateTimeFormat(locale, { day: "numeric", month: "long", year: "numeric", timeZone: "Europe/Tirane" }).format(new Date());
}
