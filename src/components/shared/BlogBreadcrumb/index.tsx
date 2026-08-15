import { Breadcrumb } from "../Breadcrumb";
import { BreadcrumbJsonLd } from "../BreadcrumbJsonLd";
import { getTranslations } from "next-intl/server";
import { getBaseUrl } from "@/lib/seo/baseUrl";
import {
  buildBlogCrumbs,
  buildBlogBreadcrumbCurrentPath,
  toBreadcrumbJsonLdItems,
} from "@/lib/routes/breadcrumbs";

type BlogBreadcrumbProps = {
  locale: string;
  categorySlug?: string;
  categoryLabel?: string;
  postTitle?: string;
  postSlug?: string;
};

export async function BlogBreadcrumb({
  locale,
  categorySlug,
  categoryLabel,
  postTitle,
  postSlug,
}: BlogBreadcrumbProps) {
  const t = await getTranslations("Breadcrumbs");

  const items = buildBlogCrumbs({
    locale,
    labels: {home: t("home"), blog: t("blog")},
    categorySlug,
    categoryLabel,
    postTitle,
  });

  const baseUrl = await getBaseUrl();
  const currentPath = buildBlogBreadcrumbCurrentPath({
    locale,
    postSlug,
    categorySlug,
  });
  const jsonLdItems = toBreadcrumbJsonLdItems(items, currentPath);

  return (
    <>
      <BreadcrumbJsonLd items={jsonLdItems} baseUrl={baseUrl} />
      <Breadcrumb items={items} />
    </>
  );
}
