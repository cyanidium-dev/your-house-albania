import Image from "next/image";
import { getTranslations } from "next-intl/server";
import Link from "@/components/shared/Link";
import { MessengerButtons } from "@/components/contact/MessengerButtons";
import { formatMoney } from "@/lib/currency/format";
import { propertyPath } from "@/lib/property/propertyUrl";
import { resolveMessengers } from "@/lib/contacts/messengers";
import { messengerContext } from "@/lib/contacts/messengerContext";
import type { PropertyHomes } from "@/types/propertyHomes";

type Props = {
  locale: string;
  listings: readonly PropertyHomes[];
  /** `siteSettings.socialLinks`, so the buttons open the same accounts as everywhere else. */
  socialLinks?: { platform: string; url: string; channel?: string }[];
  /** Absolute URL of the article, carried into the WhatsApp message. */
  pageUrl: string;
};

function priceLabel(item: PropertyHomes, locale: string, perSqm: (amount: string) => string): string {
  if (typeof item.price !== "number" || !(item.price > 0)) return "";
  const amount = formatMoney(item.price, "EUR", locale);
  return item.priceUnit === "per-sqm" ? perSqm(amount) : amount;
}

/**
 * Up to three listings the article is about, as compact rows, and the
 * messenger buttons, above the key facts (which run 1,200 px on a phone).
 *
 * Why here: on 2026-10-20 the blog carried 35 % of organic clicks and no lead
 * (reports/domlivo-page-analytics-2026-10-20.md). Its listings sat in the
 * sidebar, which on a phone (74 % of visits) comes after the whole article,
 * and the only contact block was the last thing on the page. Leads happen on
 * listing pages; this puts the way there before the first scroll.
 */
export async function BlogEarlyListings({ locale, listings, socialLinks, pageUrl }: Props) {
  if (listings.length === 0) return null;
  const [t, tMessengers, tCard, tChannel] = await Promise.all([
    getTranslations({ locale, namespace: "Shared.blog.earlyListings" }),
    getTranslations({ locale, namespace: "Messengers" }),
    getTranslations({ locale, namespace: "Shared.propertyCard" }),
    getTranslations({ locale, namespace: "QuickContact.channel" }),
  ]);
  const messengers = resolveMessengers(
    socialLinks,
    locale,
    messengerContext(tMessengers, { locale, placement: "blog-top", pageUrl }),
  );

  return (
    <aside
      aria-labelledby="blog-early-listings"
      className="my-8 rounded-2xl border border-dark/10 p-5 dark:border-white/15 sm:p-6"
    >
      <h2 id="blog-early-listings" className="text-lg font-semibold text-dark dark:text-white">
        {t("title")}
      </h2>
      <ul className="mt-4 divide-y divide-dark/10 dark:divide-white/10">
        {listings.map((item) => {
          const photo = item.images?.[0]?.src;
          const facts = [
            item.district || item.city || item.location,
            item.area > 0 ? `${Math.round(item.area)} ${tCard("areaUnit").trim()}` : "",
          ].filter(Boolean);
          const price = priceLabel(item, locale, (amount) => tCard("pricePerSqmFrom", { amount }));
          return (
            <li key={item.slug} className="py-3 first:pt-0 last:pb-0">
              <Link
                href={propertyPath(locale, item.slug)}
                className="group flex items-center gap-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
              >
                <span className="relative block h-16 w-20 shrink-0 overflow-hidden rounded-lg bg-dark/5 dark:bg-white/10">
                  {photo ? <Image src={photo} alt="" fill sizes="80px" className="object-cover" /> : null}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-medium text-dark group-hover:text-primary dark:text-white">
                    {item.name}
                  </span>
                  {facts.length > 0 ? (
                    <span className="block truncate text-sm text-dark/60 dark:text-white/60">{facts.join(" · ")}</span>
                  ) : null}
                </span>
                {price ? (
                  <span className="shrink-0 text-sm font-semibold text-dark dark:text-white">{price}</span>
                ) : null}
              </Link>
            </li>
          );
        })}
      </ul>
      <p className="mt-5 text-sm text-dark/70 dark:text-white/70">{t("ask")}</p>
      <div data-lead-placement="blog-top" className="mt-3">
        <MessengerButtons
          messengers={messengers}
          ariaLabels={{ whatsapp: tChannel("whatsapp"), telegram: tChannel("telegram") }}
          className="grid grid-cols-1 gap-2 sm:flex sm:max-w-md"
        />
      </div>
    </aside>
  );
}
