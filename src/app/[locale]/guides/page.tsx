import type { Metadata } from "next";
import {getTranslations, setRequestLocale} from "next-intl/server";
import { Breadcrumb } from "@/components/shared/Breadcrumb";
import HeroSub from "@/components/shared/HeroSub";
import { BreadcrumbJsonLd } from "@/components/shared/BreadcrumbJsonLd";
import { fetchGuideIndexEntries } from "@/lib/sanity/client";
import { isLandingInLocale } from "@/lib/landing/localeScope";
import { buildGuideCrumbs, toBreadcrumbJsonLdItems } from "@/lib/routes/breadcrumbs";
import { resolveLocalizedString } from "@/lib/sanity/localized";
import { getBaseUrl } from "@/lib/seo/baseUrl";
import { buildSimplePageMetadata } from "@/lib/seo/simplePageMetadata";
import { indexingDisabledRobots, isIndexingEnabled, indexableRobots } from "@/lib/seo/envSeo";
import { ALBANIA_PHOTOS, heroPhotoFor } from "@/lib/media/albaniaPhotos";

/** One photograph per guide topic (all from the credited set in albaniaPhotos). */
function topicPhoto(topic: string, slug: string): string {
  const byTopic: Record<string, keyof typeof ALBANIA_PHOTOS> = {
    investing: "durres",
    buying: "tirana",
    market: "vlore",
    living: "himare",
  };
  const key = byTopic[topic];
  return key ? ALBANIA_PHOTOS[key].src : heroPhotoFor({ slug }).src;
}
import { Section } from "@/components/shared/layout";
import { COMPARISONS_TOPIC, GUIDE_TOPICS, guideLandingTopic, isComparisonGuideSlug, postInTopic } from "@/data/guideTopics";
import { fetchNavGuidePosts } from "@/lib/sanity/queries/navMenu";
import { resolveLocalizedStringStrict } from "@/lib/sanity/localized";
import { GuidesLibrary, type LibraryItem, type LibraryTopic } from "@/components/guides/GuidesLibrary";

type Props = { params: Promise<{ locale: string }> };

export const revalidate = 86400;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations("Guides");
  const entries = (await fetchGuideIndexEntries()).filter((e) => isLandingInLocale(e, locale));
  // An index with nothing in it should not be advertised to search engines.
  const indexable = isIndexingEnabled() && entries.length > 0;
  return buildSimplePageMetadata({
    locale,
    title: t("title"),
    description: t("description"),
    pathAfterLocale: "guides",
    robots: indexable ? indexableRobots : indexingDisabledRobots,
  });
}

/**
 * `/guides` — the hub for custom landings. Required by the breadcrumb contract
 * (docs/engineering/SPEC-breadcrumbs-2026-08-15.md §2.3): guides are their own
 * section, and a section's middle crumb has to lead somewhere.
 */
export default async function GuidesIndexPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("Guides");
  const entries = (await fetchGuideIndexEntries()).filter((e) => isLandingInLocale(e, locale));

  const items = buildGuideCrumbs({
    locale,
    labels: { home: t("breadcrumbHome"), guides: t("title") },
  });
  const baseUrl = await getBaseUrl();
  const jsonLdItems = toBreadcrumbJsonLdItems(items, `/${locale}/guides`);

  const [posts, tTopics] = await Promise.all([fetchNavGuidePosts(), getTranslations("Header.guideTopics")]);

  // One list for the library: guide pages, comparisons and the blog's
  // articles, each in one topic (see GuidesLibrary).
  const libraryItems: LibraryItem[] = [];
  for (const entry of entries) {
    const title = resolveLocalizedString(entry.title as never, locale) || entry.slug || "";
    if (!entry.slug || !title) continue;
    const comparison = isComparisonGuideSlug(entry.slug);
    libraryItems.push({
      key: `g:${entry.slug}`,
      href: `/${locale}/guides/${entry.slug}`,
      title,
      description: resolveLocalizedString(entry.cardDescription as never, locale) || undefined,
      topic: comparison ? "comparisons" : guideLandingTopic(entry.slug),
      kind: comparison ? "comparison" : "guide",
      ...(comparison
        ? {}
        : {
            // Until each guide has its own cover, a topic photo: the shared
            // fallback put one beach on every card.
            image: entry.cardImage?.asset?.url || topicPhoto(guideLandingTopic(entry.slug), entry.slug),
          }),
    });
  }
  for (const post of posts) {
    const title = resolveLocalizedStringStrict(post.title as never, locale);
    if (!post.slug || !title) continue;
    const topic = GUIDE_TOPICS.find((tp) => postInTopic(post.categories, tp));
    libraryItems.push({
      key: `a:${post.slug}`,
      href: `/${locale}/blog/${post.slug}`,
      title,
      topic: topic?.key ?? "buying",
      kind: "article",
      ...(post.publishedAt ? { date: post.publishedAt } : {}),
    });
  }
  const libraryTopics: LibraryTopic[] = [
    ...GUIDE_TOPICS.map((tp) => ({ key: tp.key, label: tTopics(tp.key), icon: tp.icon })),
    { key: "comparisons", label: tTopics("comparisons"), icon: COMPARISONS_TOPIC.icon },
  ];

  return (
    <main>
      <BreadcrumbJsonLd items={jsonLdItems} baseUrl={baseUrl} />
      {/* The same photo hero as the blog index, breadcrumb inside it: the two
          content hubs used to open on different templates. */}
      <HeroSub
        title={t("title")}
        description={t("description")}
        photoKey="durres"
        breadcrumb={<Breadcrumb items={items} overHero />}
      />
      {libraryItems.length === 0 ? (
        <Section>
          <p className="text-dark/60 dark:text-white/60">{t("empty")}</p>
        </Section>
      ) : (
        <GuidesLibrary
          items={libraryItems}
          topics={libraryTopics}
          locale={locale}
          labels={{
            searchLabel: t("searchLabel"),
            searchPlaceholder: t("searchPlaceholder"),
            all: t("all"),
            noResults: t("noResults"),
            // Raw: the "{count}" placeholder is filled in per topic by the library.
            showAll: t.raw("showAll") as string,
            guide: t("kindGuide"),
            article: t("kindArticle"),
            clear: t("clearSearch"),
          }}
        />
      )}
    </main>
  );
}
