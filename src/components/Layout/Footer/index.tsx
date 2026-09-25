"use client";

import Image from "next/image";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Icon } from "@/components/shared/Icon";
import type { FooterCityNavItem } from "@/lib/sanity/client";
import type { ResolvedSiteSettings } from "@/lib/sanity/siteSettingsAdapter";
import {
  FOOTER_COMPANY_ITEMS,
  FOOTER_PROPERTY_HEAD,
  FOOTER_PROPERTY_TAIL,
  FOOTER_USEFUL_ITEMS,
} from "@/data/footerNavConfig";
import { orderMenuCities } from "@/data/navConfig";
import { catalogFilterPath } from "@/lib/routes/catalog";
import { deriveFooterCountrySlugFromPathname } from "@/lib/routes/footerCountry";
import { CookieSettingsLink } from "@/lib/cookie-consent";
import { analyticsEnabled } from "@/lib/analytics/config";
import { footerLgColsClass } from "@/lib/footer/columns";
import { MESSENGER_ICON, resolveMessengers } from "@/lib/contacts/messengers";
import CodeSiteTagIcon from "./CodeSiteTagIcon";

type FooterProps = {
  siteSettings?: ResolvedSiteSettings;
  countrySlugs: string[];
  /** Server-rendered city list for `initialCountrySlug` (avoids empty-state flash / SSR gap). */
  initialCities?: FooterCityNavItem[];
  initialCountrySlug?: string;
};

function resolveStableHref(href: string, locale: string): string {
  if (href === "/") return `/${locale}`;
  return `/${locale}${href}`;
}

function cityCatalogHref(
  locale: string,
  city: FooterCityNavItem
): string {
  return catalogFilterPath({
    locale,
    city: city.slug,
    trustedCityCountrySlug: city.countrySlug,
    country: city.countrySlug,
  });
}

/** Pipe with horizontal breathing room for credits row (major blocks only). */
function CreditsDivider() {
  return (
    <span
      className="select-none px-2 text-sm font-light leading-none text-white/35 sm:px-3.5 sm:text-base"
      aria-hidden
    >
      |
    </span>
  );
}

/**
 * Sole partner credit. WebBond was deliberately dropped in 63b48eb; the
 * Code Site Art credit is hardcoded here because the CMS field that used to
 * supply it (footerCodesiteUrl) was removed as unused indirection.
 */
const CODESITE_URL = "https://www.code-site.art";

const colHeadingClass =
  "mb-2.5 text-base font-semibold uppercase tracking-wide text-white/90 md:mb-3.5 md:text-sm";
const colLinkClass =
  "text-[17px] leading-snug text-white/55 transition-colors hover:text-white md:text-base md:leading-normal";
const colBodyClass = "text-[17px] text-white/45 md:text-sm";
const creditsLinkClass =
  "min-w-0 whitespace-nowrap text-white/50 underline-offset-[3px] transition-colors hover:text-primary hover:underline";

/**
 * Four groups, not a site map: Property (the hub, the cities, the hub of
 * cities), Useful (the CMS guide links and the blog), Company (about, contact,
 * listing a property) and Contacts (the form, WhatsApp, Telegram). The legal
 * links share the credits row. Rebuilt 2026-09-26, see
 * docs/ux/IA-AUDIT-2026-09-26.md.
 */
export default function Footer({
  siteSettings,
  countrySlugs,
  initialCities = [],
  initialCountrySlug,
}: FooterProps) {
  const locale = useLocale();
  const pathname = usePathname();
  const t = useTranslations("Footer");
  const navT = useTranslations("Footer.nav");
  const tQuickContact = useTranslations("QuickContact");

  const activeCountry = useMemo(
    () => deriveFooterCountrySlugFromPathname(pathname, locale, countrySlugs),
    [pathname, locale, countrySlugs]
  );

  const [cities, setCities] = useState<FooterCityNavItem[]>(initialCities);

  useEffect(() => {
    // Server already seeded the default-country list; only re-fetch when the
    // visitor is on a different country page.
    if (activeCountry === initialCountrySlug && initialCities.length > 0) return;
    let cancelled = false;
    fetch(
      `/api/footer-cities?locale=${encodeURIComponent(locale)}&country=${encodeURIComponent(activeCountry)}`
    )
      .then((r) => (r.ok ? r.json() : []))
      .then((data: FooterCityNavItem[]) => {
        if (!cancelled && Array.isArray(data)) setCities(data);
      })
      .catch(() => {
        if (!cancelled) setCities([]);
      });
    return () => {
      cancelled = true;
    };
  }, [locale, activeCountry, initialCountrySlug, initialCities.length]);

  // Same order as the header's Buy menu: Durrës and Tirana first.
  const orderedCities = useMemo(() => orderMenuCities(cities, 6), [cities]);

  const flavour =
    siteSettings?.footerIntro?.trim() ||
    siteSettings?.siteTagline?.trim() ||
    "";

  const showAppColumn =
    siteSettings?.footerApp?.enabled === true &&
    Boolean(
      siteSettings.footerApp.iosUrl?.trim() || siteSettings.footerApp.androidUrl?.trim()
    );
  const year = new Date().getFullYear();
  const siteName = siteSettings?.siteName?.trim() ?? "";

  // Property detail pages render a mobile-only fixed bottom bar (price + CTA);
  // pad the footer below lg so its last rows clear that bar.
  const hasMobileStickyBar = pathname.includes("/property/");

  // Every CMS policy link (privacy, terms, …), in CMS order.
  const policyLinks = siteSettings?.policyLinks ?? [];

  // WhatsApp and Telegram, Telegram first for ru/uk. Tracked as footer leads by
  // LeadTracker through the `data-lead-placement` on <footer>.
  const messengers = resolveMessengers(siteSettings?.socialLinks, locale);

  const guideLinks = siteSettings?.footerGuideLinks ?? [];
  const lgColsClass = footerLgColsClass(showAppColumn);

  return (
    <footer data-lead-placement="footer" className="relative z-10 w-full bg-dark transition-[background-color,border-color,box-shadow,opacity] duration-[220ms] ease-out">
      <div
        className={`container mx-auto max-w-8xl min-w-0 px-5 py-8 sm:py-10 2xl:px-0 lg:py-12 ${
          hasMobileStickyBar ? "pb-28 lg:pb-12" : ""
        }`}
      >
        {/* Branding: logo + intro in one block */}
        <div className="mb-6 max-w-xl lg:mb-7">
          <Link href={`/${locale}`} className="inline-block max-w-full">
            {siteSettings?.logoUrl ? (
              <Image
                src={siteSettings.logoUrl}
                alt={siteName || "Logo"}
                width={180}
                height={72}
                className="h-11 w-auto object-contain object-left brightness-0 invert md:h-12"
              />
            ) : (
              <span className="text-xl font-medium text-white">{siteName || "—"}</span>
            )}
          </Link>
          {flavour ? (
            <p className="mt-3 max-w-prose text-[17px] leading-relaxed text-white/65 md:mt-4 md:text-base">
              {flavour}
            </p>
          ) : null}
        </div>

        {/* Column grid (full width below branding) */}
        <div className="min-w-0 w-full">
          <div
            className={`grid min-w-0 grid-cols-1 gap-6 sm:grid-cols-2 sm:gap-5 md:grid-cols-4 md:gap-5 lg:gap-4 ${lgColsClass} xl:gap-4 2xl:gap-5`}
          >
            <nav aria-label={t("columns.property")}>
              <h3 className={colHeadingClass}>{t("columns.property")}</h3>
              <ul className="flex flex-col gap-2 md:gap-2.5">
                {FOOTER_PROPERTY_HEAD.map((item) => (
                  <li key={item.key}>
                    <Link href={resolveStableHref(item.href, locale)} className={colLinkClass}>
                      {navT(item.key)}
                    </Link>
                  </li>
                ))}
                {orderedCities.length === 0 ? (
                  <li className={colBodyClass}>{t("cities.empty")}</li>
                ) : (
                  orderedCities.map((city) => (
                    <li key={city.slug}>
                      <Link
                        href={cityCatalogHref(locale, city)}
                        className={colLinkClass}
                      >
                        {city.label}
                      </Link>
                    </li>
                  ))
                )}
                {FOOTER_PROPERTY_TAIL.map((item) => (
                  <li key={item.key}>
                    <Link href={resolveStableHref(item.href, locale)} className={colLinkClass}>
                      {navT(item.key)}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>

            <nav aria-label={t("columns.useful")}>
              <h3 className={colHeadingClass}>{t("columns.useful")}</h3>
              <ul className="flex flex-col gap-2 md:gap-2.5">
                {guideLinks.map((link) => (
                  <li key={link._key ?? link.href}>
                    <Link href={link.href} className={colLinkClass}>
                      {link.label}
                    </Link>
                  </li>
                ))}
                {FOOTER_USEFUL_ITEMS.map((item) => (
                  <li key={item.key}>
                    <Link href={resolveStableHref(item.href, locale)} className={colLinkClass}>
                      {navT(item.key)}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>

            <nav aria-label={t("columns.company")}>
              <h3 className={colHeadingClass}>{t("columns.company")}</h3>
              <ul className="flex flex-col gap-2 md:gap-2.5">
                {FOOTER_COMPANY_ITEMS.map((item) => (
                  <li key={item.key}>
                    <Link href={resolveStableHref(item.href, locale)} className={colLinkClass}>
                      {navT(item.key)}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>

            {/*
              Direct channels here were hidden on 2026-09-02 because a lead
              that started in the footer left the site before anything could
              record it. WhatsApp and Telegram are back since 2026-09-20: their
              clicks are recorded now (LeadTracker → click_whatsapp /
              click_telegram, placement `footer`), which was the objection.
            */}
            <div>
              <h3 className={colHeadingClass}>{t("columns.contacts")}</h3>
              <Link
                href={`/${locale}/contacts`}
                className={`inline-flex items-center gap-2 ${colLinkClass}`}
              >
                <Icon
                  icon="ph:paper-plane-tilt"
                  width={20}
                  height={20}
                  className="shrink-0 opacity-80"
                  aria-hidden
                />
                <span>{t("contactCta")}</span>
              </Link>
              <ul className="mt-1 flex flex-col">
                {messengers.map((m) => (
                  <li key={m.key}>
                    <a
                      href={m.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={tQuickContact(`channel.${m.key}`)}
                      className={`inline-flex min-h-11 items-center gap-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${colLinkClass}`}
                    >
                      <Icon
                        icon={MESSENGER_ICON[m.key]}
                        width={20}
                        height={20}
                        className="shrink-0 opacity-80"
                        aria-hidden
                      />
                      <span>{t(`contacts.${m.key}`)}</span>
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {showAppColumn ? (
              <div>
                <h3 className={colHeadingClass}>{t("columns.app")}</h3>
                <ul className="flex flex-col gap-2 md:gap-2.5">
                  {siteSettings?.footerApp.iosUrl ? (
                    <li>
                      <a
                        href={siteSettings.footerApp.iosUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={colLinkClass}
                      >
                        {t("app.ios")}
                      </a>
                    </li>
                  ) : null}
                  {siteSettings?.footerApp.androidUrl ? (
                    <li>
                      <a
                        href={siteSettings.footerApp.androidUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={colLinkClass}
                      >
                        {t("app.android")}
                      </a>
                    </li>
                  ) : null}
                </ul>
              </div>
            ) : null}
          </div>
        </div>

        {/* Credits: spaced segments */}
        <div className="mt-8 border-t border-white/10 pt-6 md:mt-10 md:pt-8">
          <div
            className="flex flex-wrap items-center justify-center gap-y-2.5 text-center text-[17px] leading-relaxed text-white/50 sm:justify-start sm:text-left md:text-sm md:leading-relaxed"
            role="contentinfo"
          >
            <span className="whitespace-nowrap">
              © {year} {t("legal.brandName")}
            </span>

            {policyLinks.map((link) => (
              <span key={link._key ?? link.href} className="inline-flex items-center">
                <CreditsDivider />
                <Link href={link.href} className={creditsLinkClass}>
                  {link.label}
                </Link>
              </span>
            ))}

            {/*
              Image credits. Not decoration: the CC BY / CC BY-SA photography on
              this site is licensed on condition that the credit reaches the
              reader, and this link is how it does. Removing it puts those
              images in breach — see /image-credits.
            */}
            <CreditsDivider />
            <Link href={`/${locale}/image-credits`} className={creditsLinkClass}>
              {t("legal.imageCredits")}
            </Link>

            {analyticsEnabled ? (
              <>
                <CreditsDivider />
                <CookieSettingsLink />
              </>
            ) : null}

            <CreditsDivider />
            <span className="inline-flex flex-wrap items-center justify-center gap-x-2 gap-y-1 sm:justify-start">
              <span className="whitespace-nowrap text-white/50">
                {t("legal.createdBy")}
              </span>
              <a
                href={CODESITE_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 whitespace-nowrap font-medium uppercase tracking-wide text-white/60 transition-colors hover:text-primary"
              >
                CODE-SITE.ART
                <CodeSiteTagIcon className="mb-0.5 shrink-0" />
              </a>
            </span>
          </div>

          {/* Developer / ownership note + listings disclaimer */}
          {/* The developer's own contacts: not Domlivo leads. */}
          <div data-lead-ignore className="mt-4 max-w-3xl text-center text-[13px] leading-relaxed text-white/40 sm:text-left md:text-xs">
            <p>
              {t("developer.ownedBy")} {t("developer.disclaimer")}
            </p>
            <p className="mt-1.5">
              {t("developer.contact")}{" "}
              <a
                href="https://t.me/fedirdev"
                target="_blank"
                rel="noopener noreferrer"
                className="whitespace-nowrap text-white/55 underline-offset-[3px] transition-colors hover:text-primary hover:underline"
              >
                Telegram @fedirdev
              </a>{" "}
              ·{" "}
              <a
                href="https://wa.me/355689286136"
                target="_blank"
                rel="noopener noreferrer"
                className="whitespace-nowrap text-white/55 underline-offset-[3px] transition-colors hover:text-primary hover:underline"
              >
                WhatsApp +355 68 928 6136
              </a>
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
