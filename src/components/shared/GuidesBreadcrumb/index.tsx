import { Breadcrumb } from "../Breadcrumb";
import { BreadcrumbJsonLd } from "../BreadcrumbJsonLd";
import { getTranslations } from "next-intl/server";
import { getBaseUrl } from "@/lib/seo/baseUrl";
import {
  buildGuidesBreadcrumbItems,
  toBreadcrumbJsonLdItems,
} from "@/lib/routes/breadcrumbs";

type GuidesBreadcrumbProps = {
  locale: string;
  slug: string;
  guideTitle: string;
  /** When true, uses light text for overlay on dark hero imagery */
  overHero?: boolean;
};

export async function GuidesBreadcrumb({
  locale,
  slug,
  guideTitle,
  overHero,
}: GuidesBreadcrumbProps) {
  const t = await getTranslations("Breadcrumbs");
  const items = buildGuidesBreadcrumbItems({
    locale,
    homeLabel: t("home"),
    guidesLabel: t("guides"),
    guideTitle,
  });

  const baseUrl = await getBaseUrl();
  const currentPath = `/${locale}/guides/${encodeURIComponent(slug)}`;
  const jsonLdItems = toBreadcrumbJsonLdItems(items, currentPath);

  return (
    <>
      <BreadcrumbJsonLd items={jsonLdItems} baseUrl={baseUrl} />
      <Breadcrumb items={items} overHero={overHero} />
    </>
  );
}
