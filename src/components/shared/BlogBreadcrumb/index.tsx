import { Breadcrumb } from "../Breadcrumb";
import { BreadcrumbJsonLd } from "../BreadcrumbJsonLd";
import { getTranslations } from "next-intl/server";
import { getBaseUrl } from "@/lib/seo/baseUrl";
import type { BreadcrumbItem } from "../Breadcrumb";
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
  const homeLabel = t("home");
  const blogLabel = t("blog");

  const items: BreadcrumbItem[] = [
    { label: homeLabel, href: `/${locale}` },
    { label: blogLabel, href: postTitle ? `/${locale}/blog` : undefined },
  ];

  if (categorySlug && categoryLabel) {
    const categoryHref = postTitle
      ? `/${locale}/blog?category=${encodeURIComponent(categorySlug)}`
      : undefined;
    items.push({ label: categoryLabel, href: categoryHref });
  }

  if (postTitle) {
    items.push({ label: postTitle });
  }

  const baseUrl = await getBaseUrl();
  const currentPath = postSlug
    ? `/${locale}/blog/${encodeURIComponent(postSlug)}`
    : categorySlug
      ? `/${locale}/blog?category=${encodeURIComponent(categorySlug)}`
      : `/${locale}/blog`;
  const jsonLdItems = items.map((it, i) => ({
    name: it.label,
    url: it.href ?? (i === items.length - 1 ? currentPath : undefined),
  }));

  return (
    <>
      <BreadcrumbJsonLd items={jsonLdItems} baseUrl={baseUrl} />
      <Breadcrumb items={items} />
    </>
  );
}
