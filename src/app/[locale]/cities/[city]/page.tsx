import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LandingRenderer } from "@/components/landing/LandingRenderer";
import { CityLandingBreadcrumb } from "@/components/shared/CityLandingBreadcrumb";
import { asSections } from "@/components/landing/sectionRenderers/helpers";
import { fetchCityLandingByCitySlug, fetchSiteSettings } from "@/lib/sanity/client";
import { buildLandingMetadata } from "@/lib/sanity/landingSeoAdapter";

type Props = {
  params: Promise<{ locale: string; city: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, city } = await params;
  const citySlug = decodeURIComponent(city).toLowerCase();
  const [landing, siteSettings] = await Promise.all([
    fetchCityLandingByCitySlug(citySlug),
    fetchSiteSettings(),
  ]);
  const seo = (landing as { seo?: unknown } | null)?.seo ?? null;
  const siteDefaultSeo = (siteSettings as { defaultSeo?: unknown })?.defaultSeo ?? null;
  return buildLandingMetadata(seo as never, siteDefaultSeo as never, locale);
}

export default async function CityLandingPage({ params }: Props) {
  const { locale, city } = await params;
  const citySlug = decodeURIComponent(city).toLowerCase();
  const landing = await fetchCityLandingByCitySlug(citySlug);
  if (!landing) return notFound();

  const sections = asSections(landing as never);
  const hasDedicatedHero = sections[0]?._type === "heroSection";

  if (hasDedicatedHero) {
    return (
      <LandingRenderer
        locale={locale}
        landing={landing as never}
        citySlug={citySlug}
        breadcrumb={<CityLandingBreadcrumb locale={locale} city={citySlug} overHero />}
      />
    );
  }

  return (
    <>
      <section className="pt-44">
        <div className="container mx-auto max-w-8xl px-5 2xl:px-0">
          <CityLandingBreadcrumb locale={locale} city={citySlug} />
        </div>
      </section>
      <LandingRenderer locale={locale} landing={landing as never} citySlug={citySlug} />
    </>
  );
}
