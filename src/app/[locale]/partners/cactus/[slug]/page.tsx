import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { PartnerLandingView } from "@/components/partnerLandings/PartnerLandingView";
import { ListingContactBar } from "@/components/catalog/ListingContactBar";
import { fetchAgentMessengerContacts } from "@/lib/sanity/queries/agent";
import { agentTelegramUrl, agentWhatsAppDigits } from "@/lib/contacts/messengers";
import { loadPartnerLanding } from "@/lib/partnerLandings/load";
import { PARTNER_LANDING_MIN_LISTINGS, PARTNER_LANDINGS, PARTNER_NAME, PARTNER_SLUG, partnerLandingPathAfterLocale } from "@/lib/partnerLandings/config";
import { percentVsPlace } from "@/lib/partnerLandings/facts";
import { buildSimplePageMetadata } from "@/lib/seo/simplePageMetadata";
import { formatMoney } from "@/lib/currency/format";
import { routing } from "@/i18n/routing";

type Props = { params: Promise<{ locale: string; slug: string }> };

/**
 * `/partners/cactus/{slug}`: one partner agency's flats in one place or
 * complex, with the figures a district catalogue does not print — layouts,
 * asking prices against the district median, distance to the sea, what is
 * still being built. See `lib/partnerLandings/config.ts` for which pages
 * exist and why they live in code.
 */
export const revalidate = 3600;

export function generateStaticParams() {
  return routing.locales.flatMap((locale) => PARTNER_LANDINGS.map((l) => ({ locale, slug: l.slug })));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params;
  const data = await loadPartnerLanding(locale, slug);
  if (!data) return {};
  const t = await getTranslations({ locale, namespace: "PartnerLanding" });
  const { facts, names, placeMedianPricePerSqm, hero } = data;
  const money = (n: number) => formatMoney(n, "EUR", locale);
  const vsPlace = percentVsPlace(facts.medianPricePerSqm, placeMedianPricePerSqm);
  const description =
    facts.priceFrom && facts.medianPricePerSqm
      ? t("metaDescription", {
          count: facts.count,
          placeFull: names.placeFull,
          partner: PARTNER_NAME,
          from: money(facts.priceFrom),
          median: money(facts.medianPricePerSqm),
          vsPlace: vsPlace !== null ? t("metaVsPlace", { percent: Math.abs(vsPlace), direction: vsPlace < 0 ? "below" : vsPlace > 0 ? "above" : "same" }) : "",
          sea: facts.sea && facts.sea.within300 > 0 ? t("metaSea", { within: facts.sea.within300 }) : "",
        })
      : t("metaDescriptionShort", { count: facts.count, placeFull: names.placeFull, partner: PARTNER_NAME });
  return buildSimplePageMetadata({
    locale,
    title: t("metaTitle", { place: names.place, count: facts.count }),
    description,
    pathAfterLocale: partnerLandingPathAfterLocale(data.landing),
    photo: hero?.heroImageUrl ? { url: hero.heroImageUrl } : undefined,
    // A selection of a few flats is a filter, not a page (registry policy).
    robots: facts.count >= PARTNER_LANDING_MIN_LISTINGS ? { index: true, follow: true } : { index: false, follow: true },
  });
}

export default async function PartnerLandingPage({ params }: Props) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const [data, agent] = await Promise.all([loadPartnerLanding(locale, slug), fetchAgentMessengerContacts(PARTNER_SLUG)]);
  if (!data) notFound();
  const agentWhatsApp = agentWhatsAppDigits(agent?.phone);
  const agentTelegram = agentTelegramUrl(agent?.telegramUrl);
  return (
    <>
      {/* Every flat on this page is the partner's: messenger clicks open the
          partner's agent and the click lead goes to the partner's group
          (LeadTracker reads this marker). */}
      {agent ? (
        <div
          hidden
          data-listing-agent=""
          data-listing-agent-slug={agent.slug}
          data-listing-agent-whatsapp={agentWhatsApp ?? undefined}
          data-listing-agent-telegram={agentTelegram ?? undefined}
        />
      ) : null}
      <PartnerLandingView locale={locale} data={data} />
      <ListingContactBar locale={locale} />
    </>
  );
}
