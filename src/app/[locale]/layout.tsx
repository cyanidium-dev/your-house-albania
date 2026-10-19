import { indexableRobots, isIndexingEnabled } from "@/lib/seo/envSeo";
import { TRANSLATOR_DOM_GUARD_SCRIPT } from "@/lib/dom/translatorGuard";
import { preconnect, preload } from "react-dom";
import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque, Inter } from "next/font/google";
import "../globals.css";
import { ThemeProvider } from "next-themes";
import NextTopLoader from "nextjs-toploader";
import Script from "next/script";
import { NextIntlClientProvider } from "next-intl";
import { pickClientMessages } from "@/lib/i18n/clientMessages";
import { SPRITE_URL } from "@/lib/icons/spriteViewBoxes";
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
import { LeadTracker } from "@/components/analytics/LeadTracker";
import { SiteJsonLd } from "@/components/shared/SiteJsonLd";
import { TEAM_MEMBERS, teamMemberId } from "@/lib/about/team";
import { BUSINESS_TELEGRAM_URL, BUSINESS_WHATSAPP_URL } from "@/lib/contacts/businessContacts";
import PwaRoot from "@/components/pwa/PwaRoot";
import { PWA_EARLY_CAPTURE_SCRIPT } from "@/lib/pwa/earlyCapture";
import { isAiSearchEnabled } from "@/lib/ai/config";
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
// `subsets` only picks the files next/font preloads; every subset keeps its
// @font-face, and the browser fetches the Cyrillic one when a page has Cyrillic
// text. Preloaded, it was 19 KB on every English page too, downloaded with the
// stylesheet the first frame waits for (PSI 19.10).
const sans = Inter({
  subsets: ["latin"],
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
  // The default for every page that does not decide its own robots. Pages that
  // are noindex set `robots` themselves, which replaces this whole object.
  ...(isIndexingEnabled() ? { robots: indexableRobots } : {}),
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
  // Home-screen app on iOS (the manifest covers everything else). The
  // `default` status bar keeps the page below the clock: the header is white
  // on most pages and a translucent bar would put the logo under the notch.
  appleWebApp: {
    capable: true,
    title: SITE_NAME,
    statusBarStyle: "default",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  // The header's white, not the brand green: this also colours Chrome's
  // address bar on the ordinary mobile site, and in the installed app the
  // status bar runs into the white header. The manifest keeps the green for
  // the splash screen and the task switcher.
  themeColor: "#ffffff",
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
  // Every photo on the site comes from the Sanity CDN; opening the connection
  // with the document saves the LCP image a DNS + TLS round trip on phones.
  preconnect("https://cdn.sanity.io", { crossOrigin: "anonymous" });
  // The icon sprite every page's <use> elements point at (see SpriteIcon):
  // fetched with the document rather than when the first icon is laid out.
  preload(SPRITE_URL, { as: "image", type: "image/svg+xml" });
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

  // Organization + WebSite, once per page and the same on every page. It used
  // to be emitted by the home page alone, so an Article's publisher, a
  // founder's `worksFor` or an assistant reading a listing had no entity to
  // resolve: the node they point at by `@id` now travels with every URL.
  const siteBaseUrl = getSiteBaseUrl().replace(/\/$/, "");
  const orgSettings = rawSiteSettings as {
    contactEmail?: string;
    contactPhone?: string;
    logo?: { asset?: { url?: string } };
    socialLinks?: { url?: string }[];
  } | null;
  const orgSameAs = (orgSettings?.socialLinks ?? [])
    .map((s) => s?.url?.trim())
    .filter((u): u is string => Boolean(u));

  // Privacy-policy link for the consent banner: prefer a CMS policy row whose
  // label suggests privacy, else the first configured policy link.
  const policyHref =
    siteSettings.policyLinks.find((p) => /privacy/i.test(p.label))?.href ??
    siteSettings.policyLinks[0]?.href;

  return (
    // next-themes sets the theme class and color-scheme on <html> before React
    // hydrates (that pre-paint script is what prevents the white flash); the
    // attribute difference is expected, as the next-themes docs say.
    <html lang={locale} className={`${display.variable} ${sans.variable}`} suppressHydrationWarning>
      <body className="font-sans bg-white antialiased transition-colors duration-300 ease-out overflow-x-clip">
        {/* Holds Chromium's install event for the engagement-gated invitation;
            see lib/pwa/earlyCapture. Must run before the event can fire. */}
        <script dangerouslySetInnerHTML={{ __html: PWA_EARLY_CAPTURE_SCRIPT }} />
        {/* Keeps a translated page working: see lib/dom/translatorGuard. */}
        <script dangerouslySetInnerHTML={{ __html: TRANSLATOR_DOM_GUARD_SCRIPT }} />
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
            {/* Google Tag Manager + Microsoft Clarity, one loader.
                Both wait for the visitor's first move (pointer, scroll, key,
                touch) or 5 s after the page has loaded, whichever comes
                first. GTM + gtag are 300 KB and Clarity 30 KB; executed
                during the load they cost 0.3–0.8 s of main thread on a phone
                and most of the TBT behind Lighthouse mobile 44–53 (18.10).
                A session is still recorded: the Clarity queue (`clarity("…")`
                calls from the consent bootstrap and the tracker) replays once
                the tag arrives, and nobody buys a flat in the first five
                seconds. The dataLayer is created up front so pushes before
                GTM arrives are kept. */}
            <Script id="third-parties" strategy="afterInteractive">
              {`(function(w,d){
w.dataLayer=w.dataLayer||[];
var done=false,ev=['pointerdown','pointermove','wheel','scroll','keydown','touchstart'];
function load(){if(done)return;done=true;ev.forEach(function(e){w.removeEventListener(e,load)});
w.dataLayer.push({'gtm.start':new Date().getTime(),event:'gtm.js'});
var f=d.getElementsByTagName('script')[0];
var g=d.createElement('script');g.async=true;g.src='https://www.googletagmanager.com/gtm.js?id=${GTM_ID}';f.parentNode.insertBefore(g,f);
w.clarity=w.clarity||function(){(w.clarity.q=w.clarity.q||[]).push(arguments)};
var c=d.createElement('script');c.async=true;c.src='https://www.clarity.ms/tag/${CLARITY_ID}';f.parentNode.insertBefore(c,f);}
ev.forEach(function(e){w.addEventListener(e,load,{passive:true,once:true})});
function arm(){setTimeout(load,5000)}
if(d.readyState==='complete')arm();else w.addEventListener('load',arm,{once:true});
})(window,document);`}
            </Script>
          </>
        )}
        <SiteJsonLd
          baseUrl={siteBaseUrl}
          brandName={SITE_NAME}
          logoUrl={orgSettings?.logo?.asset?.url || undefined}
          sameAs={orgSameAs}
          email={orgSettings?.contactEmail}
          telephone={orgSettings?.contactPhone}
          messengers={[
            { name: "WhatsApp", url: BUSINESS_WHATSAPP_URL },
            { name: "Telegram", url: BUSINESS_TELEGRAM_URL },
          ]}
          languages={routing.locales}
          founders={TEAM_MEMBERS.map((m) => ({
            id: teamMemberId(siteBaseUrl, m.slug),
            name: m.name,
          }))}
          searchUrlTemplate={`/${locale}/catalog?q={search_term_string}`}
        />
        <NextTopLoader color="#078660" />
        {/* `value` is not optional in practice: next-themes 0.4.5's pre-paint
            script calls classList.add(value[theme] || theme) and, with the map
            left null, throws inside its own try/catch — the class arrived only
            at hydration and dark-mode visitors saw the light page flash for
            1-2.5 s on every load (QA 2026-10-11). */}
        <ThemeProvider attribute="class" enableSystem={true} defaultTheme="light" value={{ light: "light", dark: "dark" }}>
          <NextIntlClientProvider messages={pickClientMessages(messages)}>
            <Providers currencyRates={currencyRates} displayCurrencies={displayCurrencies}>
        <ConsentProvider locale={locale} policyHref={policyHref} active={analyticsEnabled}>
          {/* Visit journey + contact-link leads. Not gated on analytics: it
              stays in the browser until the visitor submits a form or clicks
              a contact link, and then goes only to our own API. */}
          <LeadTracker />
          <Header siteSettings={siteSettings} locale={locale} countrySlugs={countrySlugs} />
          {children}
          <Footer
            siteSettings={siteSettings}
            countrySlugs={countrySlugs}
            initialCities={footerCities}
            initialCountrySlug={LEGACY_FALLBACK_CATALOG_COUNTRY_SLUG}
          />
          {/* Installed-app layer: service worker, install invitation, and the
              bottom tab bar shown only in a standalone window. */}
          <PwaRoot locale={locale} aiSearchEnabled={isAiSearchEnabled()} />
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
