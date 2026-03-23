import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { CitiesBreadcrumb } from "@/components/shared/CitiesBreadcrumb";
import { LandingRenderer } from "@/components/landing/LandingRenderer";
import { asSections } from "@/components/landing/sectionRenderers/helpers";
import {
  fetchCitiesIndexLanding,
  fetchSiteSettings,
} from "@/lib/sanity/client";
import { buildLandingMetadata } from "@/lib/sanity/landingSeoAdapter";

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
    return buildLandingMetadata(seo as never, siteDefaultSeo as never, locale);
  }
  const t = await getTranslations("Cities");
  return {
    title: t("title"),
    description: t("description"),
  };
}

export default async function CitiesIndexPage({ params }: Props) {
  const { locale } = await params;
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
