import { Breadcrumb } from "../Breadcrumb";
import { BreadcrumbJsonLd } from "../BreadcrumbJsonLd";
import { getTranslations } from "next-intl/server";
import { getBaseUrl } from "@/lib/seo/baseUrl";
import {
  buildFavoritesBreadcrumbItems,
  toBreadcrumbJsonLdItems,
} from "@/lib/routes/breadcrumbs";

type Props = { locale: string };

export async function FavoritesBreadcrumb({ locale }: Props) {
  const t = await getTranslations("Breadcrumbs");
  const items = buildFavoritesBreadcrumbItems({
    locale,
    homeLabel: t("home"),
    favoritesLabel: t("favorites"),
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
