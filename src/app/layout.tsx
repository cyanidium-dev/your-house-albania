import type { Metadata } from "next";
import { Bricolage_Grotesque } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "next-themes";
import NextTopLoader from "nextjs-toploader";
import { routing } from "@/i18n/routing";
import { getSiteBaseUrl } from "@/lib/siteUrl";

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
