import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { Breadcrumb } from "@/components/shared/Breadcrumb";
import { BreadcrumbJsonLd } from "@/components/shared/BreadcrumbJsonLd";
import { fetchGuideIndexEntries } from "@/lib/sanity/client";
import { isLandingInLocale } from "@/lib/landing/localeScope";
import { buildGuideCrumbs, toBreadcrumbJsonLdItems } from "@/lib/routes/breadcrumbs";
import { resolveLocalizedString } from "@/lib/sanity/localized";
import { getBaseUrl } from "@/lib/seo/baseUrl";
import { buildHreflangAlternates } from "@/lib/seo/hreflang";
import { indexingDisabledRobots, isIndexingEnabled } from "@/lib/seo/envSeo";

type Props = { params: Promise<{ locale: string }> };

export const revalidate = 3600;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations("Guides");
  const entries = (await fetchGuideIndexEntries()).filter((e) => isLandingInLocale(e, locale));
  // An index with nothing in it should not be advertised to search engines.
  const indexable = isIndexingEnabled() && entries.length > 0;
  return {
    title: t("title"),
    description: t("description"),
    alternates: await buildHreflangAlternates("guides"),
    robots: indexable ? undefined : indexingDisabledRobots,
  };
}

/**
 * `/guides` — the hub for custom landings. Required by the breadcrumb contract
 * (docs/engineering/SPEC-breadcrumbs-2026-08-15.md §2.3): guides are their own
 * section, and a section's middle crumb has to lead somewhere.
 */
export default async function GuidesIndexPage({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations("Guides");
  const entries = (await fetchGuideIndexEntries()).filter((e) => isLandingInLocale(e, locale));

  const items = buildGuideCrumbs({
    locale,
    labels: { home: t("breadcrumbHome"), guides: t("title") },
  });
  const baseUrl = await getBaseUrl();
  const jsonLdItems = toBreadcrumbJsonLdItems(items, `/${locale}/guides`);

  return (
    <main>
      <section className="pt-32 md:pt-44 pb-16 md:pb-24">
        <div className="container mx-auto max-w-8xl px-5 2xl:px-0">
          <BreadcrumbJsonLd items={jsonLdItems} baseUrl={baseUrl} />
          <Breadcrumb items={items} />

          <h1 className="mt-6 text-40 md:text-52 leading-[1.1] font-bold text-dark dark:text-white">
            {t("title")}
          </h1>
          <p className="mt-4 max-w-2xl text-lg text-dark/70 dark:text-white/70">
            {t("description")}
          </p>

          {entries.length === 0 ? (
            <p className="mt-12 text-dark/60 dark:text-white/60">{t("empty")}</p>
          ) : (
            <ul className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {entries.map((entry) => {
                const title = resolveLocalizedString(entry.title as never, locale) || entry.slug;
                const description = resolveLocalizedString(
                  entry.cardDescription as never,
                  locale,
                );
                const imageUrl = entry.cardImage?.asset?.url;
                return (
                  <li key={entry._id ?? entry.slug}>
                    <Link
                      href={`/${locale}/guides/${entry.slug}`}
                      className="group flex h-full flex-col overflow-hidden rounded-2xl border border-dark/10 dark:border-white/15 transition-colors hover:border-primary"
                    >
                      {imageUrl ? (
                        <span className="relative block aspect-[16/10] w-full overflow-hidden">
                          <Image
                            src={imageUrl}
                            alt={title ?? ""}
                            fill
                            className="object-cover transition-transform duration-300 group-hover:scale-105"
                            unoptimized={imageUrl.startsWith("http")}
                          />
                        </span>
                      ) : null}
                      <span className="flex flex-1 flex-col gap-2 p-5">
                        <span className="font-display text-xl font-semibold text-dark dark:text-white">
                          {title}
                        </span>
                        {description ? (
                          <span className="text-sm text-dark/65 dark:text-white/65">
                            {description}
                          </span>
                        ) : null}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </section>
    </main>
  );
}
