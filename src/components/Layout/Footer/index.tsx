"use client";

import Image from "next/image";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Icon } from "@iconify/react";
import type { FooterCityNavItem } from "@/lib/sanity/client";
import type { ResolvedSiteSettings } from "@/lib/sanity/siteSettingsAdapter";
import { FOOTER_STABLE_NAV_ITEMS } from "@/data/footerNavConfig";
import { catalogFilterPath } from "@/lib/routes/catalog";
import { deriveFooterCountrySlugFromPathname } from "@/lib/routes/footerCountry";
import { CookieSettingsLink } from "@/lib/cookie-consent";
import { analyticsEnabled } from "@/lib/analytics/config";
import { contactLabelKey, partitionSocialLinks } from "@/lib/footer/socialChannels";
import { footerLgColsClass } from "@/lib/footer/columns";
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

const SOCIAL_ICONS: Record<string, string> = {
  twitter: "ph:x-logo-bold",
  x: "ph:x-logo-bold",
  facebook: "ph:facebook-logo-bold",
  instagram: "ph:instagram-logo-bold",
  linkedin: "ph:linkedin-logo-bold",
  youtube: "ph:youtube-logo-bold",
  tiktok: "ph:tiktok-logo-bold",
  // Contact-channel platforms (Contacts column) — same icons as before the
  // socialLinks consolidation.
  telegram: "ph:telegram-logo",
  whatsapp: "ph:whatsapp-logo",
};

function getSocialIcon(platform: string): string {
  return SOCIAL_ICONS[platform.toLowerCase()] ?? "ph:link";
}

/**
 * Contacts-column label. Only platforms with a known translation key go through
 * `t()` — next-intl throws on a missing message, so anything else falls back to
 * the platform name from the CMS.
 */
const CONTACT_LABEL_KEYS = new Set(["contacts.telegram", "contacts.whatsapp"]);

function contactRowLabel(
  platform: string,
  t: (key: string, values?: Record<string, string>) => string
): string {
  const key = contactLabelKey(platform);
  return CONTACT_LABEL_KEYS.has(key) ? t(key) : platform.trim();
}

/** Localized “Follow us on …” line from CMS `platform` string. */
function socialFollowLabel(
  platform: string,
  t: (key: string, values?: Record<string, string>) => string
): string {
  const raw = platform.trim();
  const p = raw.toLowerCase();
  if (p.includes("instagram")) return t("socials.followInstagram");
  if (p.includes("facebook")) return t("socials.followFacebook");
  if (p.includes("linkedin")) return t("socials.followLinkedin");
  if (p === "x" || /\bx\b/.test(p)) return t("socials.followX");
  if (p.includes("twitter")) return t("socials.followTwitter");
  if (p.includes("youtube")) return t("socials.followYoutube");
  if (p.includes("tiktok")) return t("socials.followTiktok");
  return t("socials.followGeneric", { platform: raw || "Social" });
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

/** Prefer a policy row whose label suggests privacy; else first CMS policy link. */
function pickPrivacyPolicyLink(
  policyLinks: { href: string; label: string }[] | undefined
): { href: string; label: string } | null {
  if (!policyLinks?.length) return null;
  const privacy = policyLinks.find((p) => /privacy/i.test(p.label));
  return privacy ?? policyLinks[0] ?? null;
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

  const privacyLink = pickPrivacyPolicyLink(siteSettings?.policyLinks);

  // Contacts and Social columns come from one source: socialLinks[].channel.
  const { contact: contactLinks, social: socialColumnLinks } = partitionSocialLinks(
    siteSettings?.socialLinks
  );

  // ТЗ-16 Guides column: 4 base columns + optional Guides + optional App.
  const guideLinks = siteSettings?.footerGuideLinks ?? [];
  const showGuidesColumn = guideLinks.length > 0;
  const lgColsClass = footerLgColsClass(showGuidesColumn, showAppColumn);

  return (
    <footer className="relative z-10 w-full bg-dark transition-[background-color,border-color,box-shadow,opacity] duration-[220ms] ease-out">
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
                unoptimized={siteSettings.logoUrl.startsWith("http")}
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
            className={`grid min-w-0 grid-cols-1 gap-6 sm:grid-cols-2 sm:gap-5 md:grid-cols-3 md:gap-5 lg:gap-4 ${lgColsClass} xl:gap-4 2xl:gap-5`}
          >
            <nav aria-label={t("columns.navigation")}>
              <h3 className={colHeadingClass}>{t("columns.navigation")}</h3>
              <ul className="flex flex-col gap-2 md:gap-2.5">
                {FOOTER_STABLE_NAV_ITEMS.map((item) => (
                  <li key={item.key}>
                    <Link
                      href={resolveStableHref(item.href, locale)}
                      className={colLinkClass}
                    >
                      {navT(item.key)}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>

            {showGuidesColumn ? (
              <nav aria-label={t("columns.guides")}>
                <h3 className={colHeadingClass}>{t("columns.guides")}</h3>
                <ul className="flex flex-col gap-2 md:gap-2.5">
                  {guideLinks.map((link) => (
                    <li key={link._key ?? link.href}>
                      <Link href={link.href} className={colLinkClass}>
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </nav>
            ) : null}

            <nav aria-label={t("columns.cities")}>
              <h3 className={colHeadingClass}>{t("columns.cities")}</h3>
              {cities.length === 0 ? (
                <p className={colBodyClass}>{t("cities.empty")}</p>
              ) : (
                <ul className="flex flex-col gap-2 md:gap-2.5">
                  {cities.map((city) => (
                    <li key={city.slug}>
                      <Link
                        href={cityCatalogHref(locale, city)}
                        className={colLinkClass}
                      >
                        {city.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </nav>

            <div>
              <h3 className={colHeadingClass}>{t("columns.contacts")}</h3>
              <ul className="flex flex-col gap-2 md:gap-2.5">
                {siteSettings?.email ? (
                  <li>
                    <a
                      href={`mailto:${siteSettings.email}`}
                      className={`inline-flex items-center gap-2 ${colLinkClass}`}
                    >
                      <Icon
                        icon="ph:envelope-simple"
                        width={20}
                        height={20}
                        className="shrink-0 opacity-80"
                        aria-hidden
                      />
                      <span>{siteSettings.email}</span>
                    </a>
                  </li>
                ) : null}
                {contactLinks.map((c) => (
                  <li key={`${c.platform}-${c.url}`}>
                    <a
                      href={c.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`inline-flex items-center gap-2 ${colLinkClass}`}
                    >
                      <Icon
                        icon={getSocialIcon(c.platform)}
                        width={20}
                        height={20}
                        className="shrink-0 opacity-80"
                        aria-hidden
                      />
                      <span>{contactRowLabel(c.platform, t)}</span>
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className={colHeadingClass}>{t("columns.socials")}</h3>
              {socialColumnLinks.length > 0 ? (
                <ul className="flex flex-col gap-2 md:gap-2.5">
                  {socialColumnLinks.map((s, i) => (
                    <li key={`${s.platform}-${i}`}>
                      <a
                        href={s.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`inline-flex items-start gap-2.5 ${colLinkClass}`}
                      >
                        <Icon
                          icon={getSocialIcon(s.platform)}
                          width={20}
                          height={20}
                          className="mt-0.5 shrink-0 text-white/70"
                          aria-hidden
                        />
                        <span className="min-w-0 break-words">
                          {socialFollowLabel(s.platform, t)}
                        </span>
                      </a>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className={colBodyClass}>{t("socials.empty")}</p>
              )}
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

            {privacyLink ? (
              <>
                <CreditsDivider />
                <Link
                  href={privacyLink.href}
                  className="min-w-0 whitespace-nowrap text-white/50 underline-offset-[3px] transition-colors hover:text-primary hover:underline"
                >
                  {privacyLink.label}
                </Link>
              </>
            ) : null}

            {/*
              Image credits. Not decoration: the CC BY / CC BY-SA photography on
              this site is licensed on condition that the credit reaches the
              reader, and this link is how it does. Removing it puts those
              images in breach — see /image-credits.
            */}
            <CreditsDivider />
            <Link
              href={`/${locale}/image-credits`}
              className="min-w-0 whitespace-nowrap text-white/50 underline-offset-[3px] transition-colors hover:text-primary hover:underline"
            >
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
          <div className="mt-4 max-w-3xl text-center text-[13px] leading-relaxed text-white/40 sm:text-left md:text-xs">
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
