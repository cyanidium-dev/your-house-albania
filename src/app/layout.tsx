import type { Metadata } from "next";
import { Bricolage_Grotesque } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "next-themes";
import NextTopLoader from "nextjs-toploader";
import Script from "next/script";
import { routing } from "@/i18n/routing";
import { getSiteBaseUrl } from "@/lib/siteUrl";
import { GTM_ID, CLARITY_ID, analyticsEnabled } from "@/lib/analytics/config";
import { ConsentBootstrap } from "@/lib/cookie-consent";

const font = Bricolage_Grotesque({ subsets: ["latin"] });

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
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    title: `${SITE_NAME} — Real estate in Albania`,
    description: DEFAULT_DESCRIPTION,
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE_NAME} — Real estate in Albania`,
    description: DEFAULT_DESCRIPTION,
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

export default async function RootLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params?: Promise<{ locale?: string }>;
}>) {
  const resolved = params ? await params : {};
  const locale =
    typeof resolved?.locale === "string" && (routing.locales as readonly string[]).includes(resolved.locale)
      ? resolved.locale
      : routing.defaultLocale;
  return (
    <html lang={locale}>
      <body
        className={`${font.className} bg-white dark:bg-black antialiased transition-colors duration-300 ease-out`}
      >
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
        <NextTopLoader color="#07be8a" />
        <ThemeProvider
          attribute="class"
          enableSystem={true}
          defaultTheme="light"
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
