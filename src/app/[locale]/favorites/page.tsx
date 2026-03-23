import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { FavoritesContent } from "@/components/favorites/FavoritesContent";
import { FavoritesBreadcrumb } from "@/components/shared/FavoritesBreadcrumb";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Favorites");
  return {
    title: t("title"),
    description: t("description"),
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
