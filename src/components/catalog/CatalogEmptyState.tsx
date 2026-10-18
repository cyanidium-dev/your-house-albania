import Link from "@/components/shared/Link";
import { useTranslations } from "next-intl";
import { catalogPath } from "@/lib/routes/catalog";
import { brandButtonClass } from "@/components/shared/BrandButton";
import { CatalogSearchAlert } from "@/components/catalog/CatalogSearchAlert";

type Props = {
  locale: string;
  /** Bot deep link for this search: "we'll tell you when something appears". */
  searchAlertHref?: string | null;
};

export function CatalogEmptyState({ locale, searchAlertHref = null }: Props) {
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
        className={brandButtonClass("primary", undefined, "sm")}
      >
        {t("reset")}
      </Link>
      {searchAlertHref ? <CatalogSearchAlert href={searchAlertHref} variant="panel" className="mt-10 w-full" /> : null}
    </div>
  );
}
