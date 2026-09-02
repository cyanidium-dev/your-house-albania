import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { hasLocale } from "next-intl";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import Header from "@/components/Layout/Header";
import Footer from "@/components/Layout/Footer";
import {
  fetchCatalogCountryDocumentSlugs,
  fetchFooterCitiesByCountry,
  fetchSiteSettings,
} from "@/lib/sanity/client";
import { LEGACY_FALLBACK_CATALOG_COUNTRY_SLUG } from "@/lib/routes/catalogPathPrimitives";
import { mapSiteSettingsToResolved } from "@/lib/sanity/siteSettingsAdapter";
import { Providers } from "./Providers";
import { ConsentProvider } from "@/lib/cookie-consent";
import { analyticsEnabled } from "@/lib/analytics/config";
// Hidden 2026-09-02 together with its mount below.
// import { QuickContact } from "@/components/shared/QuickContact/QuickContact";

type Props = {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
};

export default async function LocaleLayout({ children, params }: Props) {
  const { locale } = await params;

  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  const [messages, rawSiteSettings, countrySlugs, footerCities] = await Promise.all([
    getMessages(),
    fetchSiteSettings(),
    fetchCatalogCountryDocumentSlugs(),
    // Seed footer cities server-side for the default country so the SSR HTML
    // never ships the "no cities" empty state (the client re-fetches only when
    // the visitor is on a different-country page).
    fetchFooterCitiesByCountry(locale, LEGACY_FALLBACK_CATALOG_COUNTRY_SLUG),
  ]);

  const siteSettings = mapSiteSettingsToResolved(rawSiteSettings as never, locale);

  const raw = rawSiteSettings as Record<string, unknown> | null | undefined;
  const currencyRates = Array.isArray(raw?.currencyRates) ? raw.currencyRates : [];
  const displayCurrencies = Array.isArray(raw?.displayCurrencies)
    ? (raw.displayCurrencies as string[]).filter((c): c is string => typeof c === 'string' && c.trim() !== '')
    : [];

  if (process.env.NODE_ENV === "development") {
    console.log("[Layout] siteSettings:", rawSiteSettings ? "found" : "not found", {
      countrySlugCount: countrySlugs.length,
      hasSocialLinks: siteSettings.socialLinks.length > 0,
      hasContactEmail: !!siteSettings.email,
      hasPhone: !!siteSettings.phone,
    });
  }

  // Privacy-policy link for the consent banner: prefer a CMS policy row whose
  // label suggests privacy, else the first configured policy link.
  const policyHref =
    siteSettings.policyLinks.find((p) => /privacy/i.test(p.label))?.href ??
    siteSettings.policyLinks[0]?.href;

  return (
    <NextIntlClientProvider messages={messages}>
      <Providers currencyRates={currencyRates} displayCurrencies={displayCurrencies}>
        <ConsentProvider locale={locale} policyHref={policyHref} active={analyticsEnabled}>
          <Header siteSettings={siteSettings} locale={locale} countrySlugs={countrySlugs} />
          {children}
          <Footer
            siteSettings={siteSettings}
            countrySlugs={countrySlugs}
            initialCities={footerCities}
            initialCountrySlug={LEGACY_FALLBACK_CATALOG_COUNTRY_SLUG}
          />
          {/*
            Floating contact widget hidden 2026-09-02: its channels are direct
            `tel:`/`mailto:`/messenger links, so every lead it produced left the
            site untracked. Restore this block once contact goes through the
            lead form. The component itself is untouched.
          */}
          {/* <QuickContact
            locale={locale}
            channels={{
              phone: siteSettings.phone,
              email: siteSettings.email,
              socialLinks: siteSettings.socialLinks,
            }}
          /> */}
        </ConsentProvider>
      </Providers>
    </NextIntlClientProvider>
  );
}
