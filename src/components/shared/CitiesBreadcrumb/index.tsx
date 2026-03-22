import { Breadcrumb } from "../Breadcrumb";
import { BreadcrumbJsonLd } from "../BreadcrumbJsonLd";
import { getTranslations } from "next-intl/server";
import { getBaseUrl } from "@/lib/seo/baseUrl";
import type { BreadcrumbItem } from "../Breadcrumb";

type CitiesBreadcrumbProps = {
  locale: string;
  /** When true, uses light text for overlay on dark hero imagery */
  overHero?: boolean;
};

export async function CitiesBreadcrumb({ locale, overHero }: CitiesBreadcrumbProps) {
  const t = await getTranslations("Breadcrumbs");
  const items: BreadcrumbItem[] = [
    { label: t("home"), href: `/${locale}` },
    { label: t("cities") },
  ];

  const baseUrl = await getBaseUrl();
  const currentPath = `/${locale}/cities`;
  const jsonLdItems = items.map((it, i) => ({
    name: it.label,
    url: it.href ?? (i === items.length - 1 ? currentPath : undefined),
  }));

  return (
    <>
      <BreadcrumbJsonLd items={jsonLdItems} baseUrl={baseUrl} />
      <Breadcrumb items={items} overHero={overHero} />
    </>
  );
}
