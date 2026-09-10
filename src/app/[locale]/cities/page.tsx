import type { Metadata } from "next";
import {getTranslations, setRequestLocale} from "next-intl/server";
import { CitiesBreadcrumb } from "@/components/shared/CitiesBreadcrumb";
import { LandingRenderer } from "@/components/landing/LandingRenderer";
import { asSections } from "@/components/landing/sectionRenderers/helpers";
import {
  fetchCitiesIndexLanding,
  fetchSiteSettings,
} from "@/lib/sanity/client";
import { buildLandingMetadata } from "@/lib/sanity/landingSeoAdapter";
import { buildHreflangAlternates } from "@/lib/seo/hreflang";
import { indexingDisabledRobots, isIndexingEnabled } from "@/lib/seo/envSeo";
import { getSiteBaseUrl } from "@/lib/siteUrl";

/**
 * ISR. Two exports, and the route needs both.
 *
 * `generateStaticParams` is empty on purpose: nothing is prerendered at build
 * time, but declaring it is what puts the route on the incremental path.
 * Without it Next has no params to generate, treats the route as fully
 * dynamic and ignores `revalidate` — which is what left the site's ~1,470
 * content URLs answering `no-store` even after the root layout and the
 * request-locale fixes had made the 86 parameterless pages cacheable.
 *
 * The hour is a backstop, not the publishing delay: the Sanity webhook
 * (`/api/revalidate/sanity`) purges the tags a mutated document touches, so an
 * edit reaches the page as soon as the webhook fires.
 */
export const revalidate = 3600;

export function generateStaticParams() {
  return [];
}

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const [landing, siteSettings] = await Promise.all([
    fetchCitiesIndexLanding(),
    fetchSiteSettings(),
  ]);
  if (landing) {
    const seo = (landing as { seo?: unknown }).seo ?? null;
    const siteDefaultSeo = (siteSettings as { defaultSeo?: unknown })?.defaultSeo ?? null;
    return buildLandingMetadata(seo as never, siteDefaultSeo as never, locale, {
      pathnameForAlternates: "cities",
      contentUpdatedAt: (landing as { contentUpdatedAt?: string }).contentUpdatedAt,
    });
  }
  const t = await getTranslations("Cities");
  if (!isIndexingEnabled()) {
    return {
      title: t("title"),
      description: t("description"),
      robots: indexingDisabledRobots,
    };
  }
  const baseUrl = getSiteBaseUrl();
  const path = "/cities";
  const canonical = `${baseUrl}/${locale}${path}`;
  const href = buildHreflangAlternates(path);
  return {
    title: t("title"),
    description: t("description"),
    alternates: {
      canonical,
      ...(href?.languages ? { languages: href.languages } : {}),
    },
  };
}

export default async function CitiesIndexPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const landing = await fetchCitiesIndexLanding();

  if (landing) {
    const sections = asSections(landing as never);
    const hasDedicatedHero = sections[0]?._type === "heroSection";

    if (hasDedicatedHero) {
      return (
        <LandingRenderer
          locale={locale}
          landing={landing as never}
          breadcrumb={<CitiesBreadcrumb locale={locale} overHero />}
        />
      );
    }

    return (
      <>
        <section className="pt-20 md:pt-32">
          <div className="container mx-auto max-w-8xl px-5 2xl:px-0">
            <CitiesBreadcrumb locale={locale} />
          </div>
        </section>
        <LandingRenderer locale={locale} landing={landing as never} />
      </>
    );
  }

  const t = await getTranslations("Cities");
  return (
    <section className="pt-20 md:pt-32 pb-20">
      <div className="container mx-auto max-w-8xl px-5 2xl:px-0">
        <CitiesBreadcrumb locale={locale} />
        <h1 className="text-4xl font-semibold text-dark dark:text-white mt-4">
          {t("title")}
        </h1>
        <p className="mt-4 text-dark/70 dark:text-white/70">{t("description")}</p>
      </div>
    </section>
  );
}
