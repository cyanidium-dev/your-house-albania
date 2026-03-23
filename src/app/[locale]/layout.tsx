import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { hasLocale } from "next-intl";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import Header from "@/components/Layout/Header";
import Footer from "@/components/Layout/Footer";
import { fetchSiteSettings } from "@/lib/sanity/client";
import { mapSiteSettingsToResolved } from "@/lib/sanity/siteSettingsAdapter";
import { Providers } from "./Providers";

type Props = {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
};

export default async function LocaleLayout({ children, params }: Props) {
  const { locale } = await params;

  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  const [messages, rawSiteSettings] = await Promise.all([
    getMessages(),
    fetchSiteSettings(),
  ]);

  const siteSettings = mapSiteSettingsToResolved(rawSiteSettings as never, locale);

  const raw = rawSiteSettings as Record<string, unknown> | null | undefined;
  const currencyRates = Array.isArray(raw?.currencyRates) ? raw.currencyRates : [];
  const displayCurrencies = Array.isArray(raw?.displayCurrencies)
    ? (raw.displayCurrencies as string[]).filter((c): c is string => typeof c === 'string' && c.trim() !== '')
    : [];

  if (process.env.NODE_ENV === "development") {
    console.log("[Layout] siteSettings:", rawSiteSettings ? "found" : "not found", {
      hasFooterQuickLinks: siteSettings.footerQuickLinks.length > 0,
      hasSocialLinks: siteSettings.socialLinks.length > 0,
      hasContactEmail: !!siteSettings.email,
      hasCopyright: !!siteSettings.copyrightText,
      hasPhone: !!siteSettings.phone,
    });
  }

  return (
    <NextIntlClientProvider messages={messages}>
      <Providers currencyRates={currencyRates} displayCurrencies={displayCurrencies}>
        <Header siteSettings={siteSettings} locale={locale} />
        {children}
        <Footer siteSettings={siteSettings} />
      </Providers>
    </NextIntlClientProvider>
  );
}
