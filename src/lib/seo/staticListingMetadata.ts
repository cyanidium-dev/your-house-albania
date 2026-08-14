import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { getSiteBaseUrl } from "@/lib/siteUrl";
import { indexingDisabledRobots } from "./envSeo";

/**
 * Shared metadata builder for static "Listing" pages (apartments, villas,
 * offices, residential). All copy comes from the existing
 * `Listing.{namespace}.title` / `.description` i18n keys; the helper just
 * wraps them in a complete Next.js `Metadata` object with canonical,
 * OpenGraph and Twitter cards, and robots rules.
 *
 * These four routes are template leftovers with mock content, so they are
 * always `noindex, nofollow` (no hreflang signals either) — regardless of the
 * `NEXT_PUBLIC_ENABLE_INDEXING` env switch.
 */
export async function buildStaticListingMetadata(opts: {
  locale: string;
  /** Path under the locale segment, e.g. "/appartment" or "/luxury-villa". */
  pathnameAfterLocale: string;
  /** i18n namespace, e.g. "Listing.appartment". */
  i18nNamespace: string;
  /** Brand suffix appended to title. Defaults to "Domlivo". */
  brand?: string;
}): Promise<Metadata> {
  const {
    locale,
    pathnameAfterLocale,
    i18nNamespace,
    brand = "Domlivo",
  } = opts;

  const t = await getTranslations(i18nNamespace);
  const rawTitle = (t("title") || "").replace(/\.$/, "").trim();
  const description = t("description") || "";
  // The root layout already applies the "%s — Brand" template, so emit just
  // the raw title and let the template add the suffix.
  const titleText = rawTitle || brand;
  const ogFullTitle = rawTitle ? `${rawTitle} — ${brand}` : brand;

  const base = getSiteBaseUrl();
  const cleanPath = pathnameAfterLocale.startsWith("/")
    ? pathnameAfterLocale
    : `/${pathnameAfterLocale}`;
  const canonical = `${base}/${locale}${cleanPath}`;

  // Mock template pages must never be indexed.
  const robots: NonNullable<Metadata["robots"]> = indexingDisabledRobots;

  return {
    title: titleText,
    description,
    alternates: {
      canonical,
    },
    openGraph: {
      title: ogFullTitle,
      description,
      url: canonical,
      siteName: brand,
      locale,
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: ogFullTitle,
      description,
    },
    robots,
  };
}
