import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { FavoritesContent } from "@/components/favorites/FavoritesContent";
import { FavoritesBreadcrumb } from "@/components/shared/FavoritesBreadcrumb";
import { buildHreflangAlternates } from "@/lib/seo/hreflang";
import { indexingDisabledRobots, isIndexingEnabled } from "@/lib/seo/envSeo";
import { getSiteBaseUrl } from "@/lib/siteUrl";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations("Favorites");
  const title = t("title");
  const description = t("description");

  if (!isIndexingEnabled()) {
    return {
      title,
      description,
      robots: indexingDisabledRobots,
    };
  }

  const baseUrl = getSiteBaseUrl();
  const path = "/favorites";
  const canonical = `${baseUrl}/${locale}${path}`;
  const href = buildHreflangAlternates(path);
  /** User-specific saved listings → always noindex; links to shared pages stay crawlable. */
  const robots = { index: false as const, follow: true as const };

  return {
    title,
    description,
    alternates: {
      canonical,
      ...(href?.languages ? { languages: href.languages } : {}),
    },
    robots,
  };
}

export default async function FavoritesPage({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations("Favorites");

  return (
    <div className="container max-w-8xl mx-auto px-5 2xl:px-0 pt-20 md:pt-32 pb-14 md:pb-28">
      <div className="mb-8">
        <FavoritesBreadcrumb locale={locale} />
      </div>
      <div className="mb-12">
        <h1 className="text-4xl sm:text-52 font-medium tracking-tighter text-dark dark:text-white mb-3">
          {t("title")}
        </h1>
        <p className="text-xm text-dark/50 dark:text-white/50">{t("description")}</p>
      </div>
      <FavoritesContent locale={locale} />
    </div>
  );
}
