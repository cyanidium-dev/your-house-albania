import Link from "@/components/shared/Link";
import { useTranslations } from "next-intl";
import { catalogPath } from "@/lib/routes/catalog";
import { brandButtonClass } from "@/components/shared/BrandButton";
import { CatalogSearchAlert } from "@/components/catalog/CatalogSearchAlert";
import { CatalogAiPrompt } from "@/components/catalog/CatalogAiPrompt";

type Props = {
  locale: string;
  /** Bot deep link for this search: "we'll tell you when something appears". */
  searchAlertHref?: string | null;
  /** Offer the assistant: it can widen a search the filters made too narrow. */
  aiSearch?: boolean;
};

export function CatalogEmptyState({ locale, searchAlertHref = null, aiSearch = false }: Props) {
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
      {aiSearch ? <CatalogAiPrompt locale={locale} empty /> : null}
      {searchAlertHref ? <CatalogSearchAlert href={searchAlertHref} variant="panel" className="mt-10 w-full" /> : null}
    </div>
  );
}
