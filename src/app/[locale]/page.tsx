import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LandingRenderer } from "@/components/landing/LandingRenderer";
import {
  fetchHomeLanding,
  fetchSiteSettings,
} from "@/lib/sanity/client";
import { buildLandingMetadata } from "@/lib/sanity/landingSeoAdapter";

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
  return buildLandingMetadata(landingSeo as never, siteDefaultSeo as never, locale);
}

export default async function Home({ params }: Props) {
  const { locale } = await params;
  if (process.env.NODE_ENV === "development") {
    console.log("[HOMEPAGE CANONICAL ROUTE ACTIVE][page]", { locale });
  }

  const landing = await fetchHomeLanding();
  if (!landing) return notFound();
  return <LandingRenderer locale={locale} landing={landing as never} />;
}
