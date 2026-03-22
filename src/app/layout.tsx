import type { Metadata } from "next";
import { Bricolage_Grotesque } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "next-themes";
import NextTopLoader from "nextjs-toploader";
import { routing } from "@/i18n/routing";

const font = Bricolage_Grotesque({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Your House Albania",
  description: "Real estate in Albania. Buy, rent, and invest in properties across Albania.",
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
