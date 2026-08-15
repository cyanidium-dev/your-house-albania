import { Breadcrumb } from "../Breadcrumb";
import { BreadcrumbJsonLd } from "../BreadcrumbJsonLd";
import { getTranslations } from "next-intl/server";
import { getBaseUrl } from "@/lib/seo/baseUrl";
import {
  buildPlaceCrumbs,
  toBreadcrumbJsonLdItems,
} from "@/lib/routes/breadcrumbs";

type CitiesBreadcrumbProps = {
  locale: string;
  /** When true, uses light text for overlay on dark hero imagery */
  overHero?: boolean;
};

export async function CitiesBreadcrumb({ locale, overHero }: CitiesBreadcrumbProps) {
  const t = await getTranslations("Breadcrumbs");
  const items = buildPlaceCrumbs({
    locale,
    labels: {home: t("home"), cities: t("cities"), districts: t("districts")},
  });

  const baseUrl = await getBaseUrl();
  const currentPath = `/${locale}/cities`;
  const jsonLdItems = toBreadcrumbJsonLdItems(items, currentPath);

  return (
    <>
      <BreadcrumbJsonLd items={jsonLdItems} baseUrl={baseUrl} />
      <Breadcrumb items={items} overHero={overHero} />
    </>
  );
}
