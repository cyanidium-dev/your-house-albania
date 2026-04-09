"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { catalogPath } from "@/lib/routes/catalog";

type Props = {
  locale: string;
};

export function CatalogEmptyState({ locale }: Props) {
  const t = useTranslations("Catalog.empty");

  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
      <h3 className="text-lg font-medium text-dark dark:text-white mb-2">
        {t("title")}
      </h3>
      <p className="text-sm text-dark/70 dark:text-white/70 mb-6 max-w-md">
        {t("description")}
      </p>
      <Link
        href={catalogPath(locale)}
        className="px-6 py-2.5 rounded-full bg-primary text-white text-sm font-medium hover:bg-primary/90 transition-colors"
      >
        {t("reset")}
      </Link>
    </div>
  );
}
