import type { Metadata } from "next";
import { LandingRenderer } from "@/components/landing/LandingRenderer";
import HeroSub from "@/components/shared/HeroSub";
import BlogSmall from "@/components/shared/Blog";
import {
  fetchHomeLanding,
  fetchSiteSettings,
} from "@/lib/sanity/client";
import { buildLandingMetadata } from "@/lib/sanity/landingSeoAdapter";
import {getTranslations, setRequestLocale} from "next-intl/server";

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  if (process.env.NODE_ENV === "development") {
    console.log("[HOMEPAGE CANONICAL ROUTE ACTIVE][generateMetadata]", { locale });
  }
  const [landing, siteSettings] = await Promise.all([fetchHomeLanding(), fetchSiteSettings()]);

  const landingSeo = (landing as { seo?: unknown } | null)?.seo ?? null;
  const siteDefaultSeo = (siteSettings as { defaultSeo?: unknown })?.defaultSeo ?? null;
  return buildLandingMetadata(landingSeo as never, siteDefaultSeo as never, locale, {
    pathnameForAlternates: "",
    contentUpdatedAt: (landing as { contentUpdatedAt?: string } | null)?.contentUpdatedAt,
  });
}

export default async function Home({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  if (process.env.NODE_ENV === "development") {
    console.log("[HOMEPAGE CANONICAL ROUTE ACTIVE][page]", { locale });
  }

  const landing = await fetchHomeLanding();
  // Organization + WebSite JSON-LD used to be built here. The locale layout
  // emits it now, on every page including this one, so emitting it again would
  // give the home page two copies of the same `@id`.

  if (!landing) {
    const t = await getTranslations("Home.blog");
    return (
      <main>
        <HeroSub
          title={t("title")}
          description={t("description")}
          badge={t("badge")}
        />
        <BlogSmall locale={locale} />
      </main>
    );
  }
  return (
    <>
      <LandingRenderer locale={locale} landing={landing as never} />
    </>
  );
}
