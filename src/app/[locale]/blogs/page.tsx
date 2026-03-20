import BlogList from "@/components/Blog/BlogList";
import HeroSub from "@/components/shared/HeroSub";
import { BlogBreadcrumb } from "@/components/shared/BlogBreadcrumb";
import { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import {
  fetchBlogPostsPaginated,
  fetchBlogCategories,
  fetchBlogSettings,
  fetchSiteSettings,
} from "@/lib/sanity/client";
import { mapSanityBlogPostToList } from "@/lib/sanity/blogAdapter";
import { buildBlogMetadata } from "@/lib/sanity/blogSeoAdapter";
import { resolveLocalizedString } from "@/lib/sanity/localized";

const PAGE_SIZE = 12;

type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const [blogSettings, siteSettings] = await Promise.all([
    fetchBlogSettings(),
    fetchSiteSettings(),
  ]);
  const blogSeo = (blogSettings as { seo?: unknown })?.seo;
  const siteDefaultSeo = (siteSettings as { defaultSeo?: unknown })?.defaultSeo;
  const t = await getTranslations("Listing.blogs");
  return buildBlogMetadata(
    blogSeo as never,
    siteDefaultSeo as never,
    locale,
    t("title"),
    t("description")
  );
}

export default async function Blog({ params, searchParams }: Props) {
  const [{ locale }, search] = await Promise.all([params, searchParams]);

  const categoryParam = typeof search.category === "string" ? search.category.trim() : undefined;
  const pageParam = typeof search.page === "string" ? search.page : undefined;

  const categoriesRaw = await fetchBlogCategories();

  const categories = Array.isArray(categoriesRaw)
    ? categoriesRaw
        .filter((c) => c && typeof (c as { slug?: string }).slug === "string")
        .map((c) => {
          const cat = c as { slug: string; title?: unknown };
          return {
            slug: cat.slug,
            label: resolveLocalizedString(cat.title as never, locale) || cat.slug,
          };
        })
    : [];

  const validCategory =
    categoryParam && categories.some((c) => c.slug === categoryParam)
      ? categoryParam
      : undefined;

  const pageNum = (() => {
    const n = parseInt(pageParam ?? "1", 10);
    return Number.isFinite(n) && n > 0 ? n : 1;
  })();

  const { items, totalCount } = await fetchBlogPostsPaginated({
    category: validCategory,
    page: pageNum,
    pageSize: PAGE_SIZE,
  });

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
  const safePage = Math.min(Math.max(pageNum, 1), totalPages);

  const finalItems =
    safePage === pageNum ? items : await fetchBlogPostsPaginated({
      category: validCategory,
      page: safePage,
      pageSize: PAGE_SIZE,
    }).then((r) => r.items);

  const posts = (safePage === pageNum ? items : finalItems).map((p) =>
    mapSanityBlogPostToList(p, locale)
  );

  const t = await getTranslations("Listing.blogs");
  const currentCategoryLabel = validCategory
    ? categories.find((c) => c.slug === validCategory)?.label
    : undefined;

  return (
    <>
      <HeroSub
        title={t("title")}
        description={t("description")}
        badge={t("badge")}
      />
      <div className="container max-w-8xl mx-auto px-5 2xl:px-0 mb-4">
        <BlogBreadcrumb
          locale={locale}
          categorySlug={validCategory}
          categoryLabel={currentCategoryLabel}
        />
      </div>
      <BlogList
        locale={locale}
        posts={posts}
        categories={categories}
        currentCategory={validCategory}
        currentPage={safePage}
        totalPages={totalPages}
      />
    </>
  );
}
