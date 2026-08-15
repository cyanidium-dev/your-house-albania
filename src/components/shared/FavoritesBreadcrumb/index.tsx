import { Breadcrumb } from "../Breadcrumb";
import { BreadcrumbJsonLd } from "../BreadcrumbJsonLd";
import { getTranslations } from "next-intl/server";
import { getBaseUrl } from "@/lib/seo/baseUrl";
import {
  buildCatalogCrumbs,
  toBreadcrumbJsonLdItems,
} from "@/lib/routes/breadcrumbs";

type Props = { locale: string };

export async function FavoritesBreadcrumb({ locale }: Props) {
  const t = await getTranslations("Breadcrumbs");
  // Favorites is a saved subset of the catalog, so it hangs off Properties.
  const items = buildCatalogCrumbs({
    locale,
    labels: {home: t("home"), properties: t("catalog"), agents: t("agents")},
    leaf: t("favorites"),
  });

  const baseUrl = await getBaseUrl();
  const currentPath = `/${locale}/favorites`;
  const jsonLdItems = toBreadcrumbJsonLdItems(items, currentPath);

  return (
    <>
      <BreadcrumbJsonLd items={jsonLdItems} baseUrl={baseUrl} />
      <Breadcrumb items={items} />
    </>
  );
}
