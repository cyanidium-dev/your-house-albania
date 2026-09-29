import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
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
import { NoPhotoPlate } from "@/components/shared/NoPhotoPlate";
import { heroPhotoFor } from "@/lib/media/albaniaPhotos";
import { balancedGridClass, Section, SectionHeading } from "@/components/shared/layout";

type Props = { params: Promise<{ locale: string }> };

export const revalidate = 3600;

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

  // Twenty "X or Y" comparisons used to be interleaved with the handful of
  // core guides; they are a set of their own.
  const isComparison = (slug?: string | null) => typeof slug === "string" && slug.includes("-vs-");
  const groups = [
    { key: "guides", title: t("sectionGuides"), entries: entries.filter((e) => !isComparison(e.slug)) },
    { key: "comparisons", title: t("sectionComparisons"), entries: entries.filter((e) => isComparison(e.slug)) },
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
      {entries.length === 0 ? (
        <Section>
          <p className="text-dark/60 dark:text-white/60">{t("empty")}</p>
        </Section>
      ) : (
        groups.map((group) =>
          group.entries.length > 0 ? (
            <Section key={group.key}>
              <SectionHeading title={group.title} />
              <ul className={balancedGridClass(group.entries.length)}>
                {group.entries.map((entry) => {
                  const title = resolveLocalizedString(entry.title as never, locale) || entry.slug || "";
                  const description = resolveLocalizedString(entry.cardDescription as never, locale);
                  // A guide without a cover gets the photo its own page hero
                  // falls back to; a comparison gets the two place names.
                  const imageUrl =
                    entry.cardImage?.asset?.url ||
                    (group.key === "guides" ? heroPhotoFor({ slug: entry.slug }).src : undefined);
                  return (
                    <li key={entry._id ?? entry.slug}>
                      <Link
                        href={`/${locale}/guides/${entry.slug}`}
                        className="group flex h-full flex-col overflow-hidden rounded-2xl border border-dark/10 dark:border-white/15 transition-colors hover:border-primary"
                      >
                        {/* Every card has the picture slot, photographed or
                            not: text-only cards next to photo cards made rows
                            of three different heights. */}
                        <span className="relative block aspect-[16/10] w-full overflow-hidden bg-dark/5 dark:bg-white/5">
                          {imageUrl ? (
                            <Image
                              src={imageUrl}
                              alt={title}
                              fill
                              sizes="(max-width: 639px) 100vw, (max-width: 1023px) 50vw, 33vw"
                              className="object-cover will-change-transform transition-transform duration-300 ease-out group-hover:scale-105"
                            />
                          ) : (
                            <NoPhotoPlate label={title.split(":")[0]} />
                          )}
                        </span>
                        <span className="flex flex-1 flex-col gap-2 p-5">
                          <span className="font-display text-xl font-semibold tracking-tight text-dark dark:text-white">
                            {title}
                          </span>
                          {description ? (
                            <span className="text-sm leading-relaxed text-dark/65 dark:text-white/65 line-clamp-3">
                              {description}
                            </span>
                          ) : null}
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </Section>
          ) : null,
        )
      )}
    </main>
  );
}
