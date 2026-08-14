import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { hasLocale } from "next-intl";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import Header from "@/components/Layout/Header";
import Footer from "@/components/Layout/Footer";
import { fetchCatalogCountryDocumentSlugs, fetchSiteSettings } from "@/lib/sanity/client";
import { mapSiteSettingsToResolved } from "@/lib/sanity/siteSettingsAdapter";
import { Providers } from "./Providers";
import { ConsentProvider } from "@/lib/cookie-consent";
import { analyticsEnabled } from "@/lib/analytics/config";

type Props = {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
};

export default async function LocaleLayout({ children, params }: Props) {
  const { locale } = await params;

  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  const [messages, rawSiteSettings, countrySlugs] = await Promise.all([
    getMessages(),
    fetchSiteSettings(),
    fetchCatalogCountryDocumentSlugs(),
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
      hasCopyright: !!siteSettings.copyrightText,
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
          <Footer siteSettings={siteSettings} countrySlugs={countrySlugs} />
        </ConsentProvider>
      </Providers>
    </NextIntlClientProvider>
  );
}
