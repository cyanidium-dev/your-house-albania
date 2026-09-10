import type { Metadata } from "next";
import { Bricolage_Grotesque, Inter } from "next/font/google";
import "../globals.css";
import { ThemeProvider } from "next-themes";
import NextTopLoader from "nextjs-toploader";
import Script from "next/script";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, setRequestLocale } from "next-intl/server";
import { hasLocale } from "next-intl";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import { getSiteBaseUrl } from "@/lib/siteUrl";
import { GTM_ID, CLARITY_ID, analyticsEnabled } from "@/lib/analytics/config";
import { ConsentBootstrap } from "@/lib/cookie-consent";
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
// Hidden 2026-09-02 together with its mount below.
// import { QuickContact } from "@/components/shared/QuickContact/QuickContact";

type Props = {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
};

// Display face for headings, text face for everything else. The research pages
// carry real paragraphs now, and Bricolage set as body copy is tiring to read.
const display = Bricolage_Grotesque({
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
  variable: "--font-bricolage",
  display: "swap",
});
const sans = Inter({
  subsets: ["latin", "cyrillic"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-inter",
  display: "swap",
});

const SITE_NAME = "Domlivo";
const DEFAULT_DESCRIPTION =
  "Apartments, villas, and commercial property in Albania — verified listings, current prices, no commission. Buy, rent, or invest in Tirana, Durrës, Vlorë, Sarandë and along the Adriatic coast.";

export const metadata: Metadata = {
  metadataBase: new URL(getSiteBaseUrl()),
  title: {
    default: `${SITE_NAME} — Real estate in Albania`,
    template: `%s — ${SITE_NAME}`,
  },
  description: DEFAULT_DESCRIPTION,
  applicationName: SITE_NAME,
  // No default og/twitter title or description: Next.js merges these into
  // every page that does not set its own `openGraph`, which put this English
  // text on 52 non-English URLs (sweep 2026-09-05, F5). Pages that build their
  // Open Graph (landings, listings, posts) still set both; the rest fall back
  // to their localized <meta name="description">, which scrapers read.
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
  },
  twitter: {
    card: "summary_large_image",
  },
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover" as const,
};

/** The six locales are the whole route space, so prerender all of them. */
export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

/**
 * Root layout for the public site.
 *
 * It declares `<html>`/`<body>` and takes the locale from its own params. The
 * previous arrangement had a second layout above this one, at `app/layout.tsx`,
 * which needed the locale for `<html lang>` but sat above the `[locale]`
 * segment and so could only read it from `headers()`. Reading `headers()` in a
 * layout opts its whole subtree into dynamic rendering, and that subtree was
 * the entire site: every page was rendered per request and returned
 * `Cache-Control: no-store` with `x-vercel-cache: MISS`, on all 1,644 URLs.
 *
 * `/editor` keeps its own root layout, which is what makes two roots possible.
 */
export default async function LocaleLayout({ children, params }: Props) {
  const { locale } = await params;

  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  // Without this, next-intl's server APIs (`getMessages`, `getTranslations`)
  // read the locale from `headers()`, which opts the whole render into dynamic
  // rendering. `generateStaticParams` above then produces params for pages that
  // are never actually prerendered — the build table says otherwise, but
  // `prerender-manifest.json` listed only the sitemaps and icons, and
  // production answered `no-store` with `x-vercel-cache: MISS` on all 1,644
  // URLs.
  setRequestLocale(locale);

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
    <html lang={locale} className={`${display.variable} ${sans.variable}`}>
      <body className="font-sans bg-white antialiased transition-colors duration-300 ease-out overflow-x-clip">
        {analyticsEnabled && (
          <>
            {/* Consent Mode v2 + Clarity bootstrap: default denied, then
                synchronously re-applies a returning visitor's stored choice.
                Must run before GTM and Clarity. */}
            <ConsentBootstrap />
            {/* Google Tag Manager (noscript) */}
            <noscript>
              <iframe
                src={`https://www.googletagmanager.com/ns.html?id=${GTM_ID}`}
                height="0"
                width="0"
                style={{ display: "none", visibility: "hidden" }}
              />
            </noscript>
            {/* End Google Tag Manager (noscript) */}
            {/* Google Tag Manager */}
            <Script id="gtm-base" strategy="afterInteractive">
              {`(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','${GTM_ID}');`}
            </Script>
            {/* End Google Tag Manager */}
            {/* Microsoft Clarity */}
            <Script id="ms-clarity" strategy="afterInteractive">
              {`(function(c,l,a,r,i,t,y){
c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
})(window, document, "clarity", "script", "${CLARITY_ID}");`}
            </Script>
            {/* End Microsoft Clarity */}
          </>
        )}
        <NextTopLoader color="#078660" />
        <ThemeProvider attribute="class" enableSystem={true} defaultTheme="light">
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
        </ThemeProvider>
      </body>
    </html>
  );
}
