import { Breadcrumb } from "../Breadcrumb";
import { BreadcrumbJsonLd } from "../BreadcrumbJsonLd";
import { getTranslations } from "next-intl/server";
import { getBaseUrl } from "@/lib/seo/baseUrl";
import { buildFlatCrumbs, toBreadcrumbJsonLdItems } from "@/lib/routes/breadcrumbs";

type Props = {
  locale: string;
  /** The landing's own title in this locale. */
  title: string;
  /** Path after the locale, e.g. the unique landing's slug. */
  path: string;
  overHero?: boolean;
};

/**
 * `Home → Landing` for a unique landing at `/{locale}/{slug}`: the visible
 * trail and its BreadcrumbList. Same contract as `FlatBreadcrumb`, with the
 * label taken from the CMS instead of the dictionary.
 */
export async function LandingBreadcrumb({ locale, title, path, overHero }: Props) {
  const t = await getTranslations({ locale, namespace: "Breadcrumbs" });
  const items = buildFlatCrumbs({ locale, homeLabel: t("home"), label: title });
  const baseUrl = await getBaseUrl();
  const jsonLdItems = toBreadcrumbJsonLdItems(
    items,
    `/${locale}/${path.split("/").filter(Boolean).map(encodeURIComponent).join("/")}`,
  );
  return (
    <>
      <BreadcrumbJsonLd items={jsonLdItems} baseUrl={baseUrl} />
      <Breadcrumb items={items} overHero={overHero} />
    </>
  );
}
