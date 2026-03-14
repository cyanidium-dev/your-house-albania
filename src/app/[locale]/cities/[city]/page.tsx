import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { CityLandingBreadcrumb } from "@/components/shared/CityLandingBreadcrumb";

type Props = {
  params: Promise<{ locale: string; city: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { city } = await params;
  const cityTitle = decodeURIComponent(city).replace(/-/g, " ");
  const t = await getTranslations("Cities");
  return {
    title: `${cityTitle} | ${t("title")}`,
    description: t("cityDescription", { city: cityTitle }),
  };
}

export default async function CityLandingPage({ params }: Props) {
  const { locale, city } = await params;
  const citySlug = decodeURIComponent(city).toLowerCase();
  const cityTitle = decodeURIComponent(city).replace(/-/g, " ");
  return (
    <section className="pt-44 pb-20">
      <div className="container mx-auto max-w-8xl px-5 2xl:px-0">
        <CityLandingBreadcrumb locale={locale} city={citySlug} />
        <h1 className="text-4xl font-semibold text-dark dark:text-white mt-4">
          {cityTitle}
        </h1>
        <p className="mt-4 text-dark/70 dark:text-white/70">
          City landing page — Sanity content coming soon.
        </p>
      </div>
    </section>
  );
}
