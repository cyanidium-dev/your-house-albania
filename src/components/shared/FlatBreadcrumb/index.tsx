import { Breadcrumb } from "../Breadcrumb";
import { BreadcrumbJsonLd } from "../BreadcrumbJsonLd";
import { getTranslations } from "next-intl/server";
import { getBaseUrl } from "@/lib/seo/baseUrl";
import { buildFlatCrumbs, toBreadcrumbJsonLdItems } from "@/lib/routes/breadcrumbs";

type FlatBreadcrumbProps = {
  locale: string;
  /** Key in the `Breadcrumbs` namespace, e.g. "contacts". */
  labelKey: string;
  /** Path after the locale, e.g. "contacts". */
  path: string;
  overHero?: boolean;
};

/**
 * `Home → Self` for pages with no parent — contacts, for-realtors,
 * how-to-publish, register, the investment landings.
 * Contract: docs/engineering/SPEC-breadcrumbs-2026-08-15.md §2.5
 */
export async function FlatBreadcrumb({ locale, labelKey, path, overHero }: FlatBreadcrumbProps) {
  const t = await getTranslations("Breadcrumbs");
  const items = buildFlatCrumbs({
    locale,
    homeLabel: t("home"),
    label: t(labelKey as never),
  });
  const baseUrl = await getBaseUrl();
  const jsonLdItems = toBreadcrumbJsonLdItems(items, `/${locale}/${path}`);

  return (
    <>
      <BreadcrumbJsonLd items={jsonLdItems} baseUrl={baseUrl} />
      <Breadcrumb items={items} overHero={overHero} />
    </>
  );
}
