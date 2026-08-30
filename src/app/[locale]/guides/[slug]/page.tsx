import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import { LandingRenderer } from "@/components/landing/LandingRenderer";
import { asSections } from "@/components/landing/sectionRenderers/helpers";
import { GuidesBreadcrumb } from "@/components/shared/GuidesBreadcrumb";
import { fetchGuideLandingBySlug, fetchSiteSettings } from "@/lib/sanity/client";
import { buildLandingMetadata } from "@/lib/sanity/landingSeoAdapter";
import { resolveLocalizedString } from "@/lib/sanity/localized";

type Props = { params: Promise<{ locale: string; slug: string }> };

/**
 * Reserved slugs whose canonical URL is a dedicated route, not `/guides/{slug}`.
 * The guides URL 301s to the canonical one so the same document (or a CMS doc
 * created with a colliding slug) never answers 200 on two paths. Every value
 * must be a routable path segment under `/[locale]/`. Extend when another
 * custom landing gets a hardcoded route.
 */
const GUIDES_CANONICAL_SLUG_REDIRECTS: Record<string, string> = {
  "for-realtors": "for-realtors",
  contacts: "contacts",
  contactus: "contactus",
  register: "register",
  "how-to-publish": "how-to-publish",
  favorites: "favorites",
  cities: "cities",
  blog: "blog",
  catalog: "catalog",
  agent: "agent",
  sale: "sale",
  rent: "rent",
  "short-term-rent": "short-term-rent",
  // ТЗ-17: the four legacy mock slugs 308 straight to their type×city guides
  // (via their retired static routes would add a needless second hop).
  appartment: "guides/apartment-tirana",
  "luxury-villa": "guides/villa-sarande",
  "office-spaces": "sale",
  "residential-homes": "guides/house-durres",
};

function normalizeSlug(value?: string): string {
  if (typeof value !== "string") return "";
  return decodeURIComponent(value).trim().toLowerCase();
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params;
  const guideSlug = normalizeSlug(slug);
  if (!guideSlug) return {};
  const [landing, siteSettings] = await Promise.all([
    fetchGuideLandingBySlug(guideSlug),
    fetchSiteSettings(),
  ]);
  if (!landing) {
    return {};
  }
  const landingSeo = (landing as { seo?: unknown }).seo ?? null;
  const siteDefaultSeo = (siteSettings as { defaultSeo?: unknown })?.defaultSeo ?? null;
  const itemTitle = resolveLocalizedString(landing.title as never, locale) || undefined;
  const itemDescription =
    resolveLocalizedString(landing.cardDescription as never, locale) || undefined;
  return buildLandingMetadata(landingSeo as never, siteDefaultSeo as never, locale, {
    itemTitle,
    itemDescription,
    itemOgImageUrl: landing.cardImage?.asset?.url,
    pathnameForAlternates: `guides/${guideSlug}`,
    contentUpdatedAt: (landing as { contentUpdatedAt?: string }).contentUpdatedAt,
  });
}

export default async function GuideLandingPage({ params }: Props) {
  const { locale, slug } = await params;
  const guideSlug = normalizeSlug(slug);
  if (!guideSlug) notFound();

  const canonicalPathSegment = GUIDES_CANONICAL_SLUG_REDIRECTS[guideSlug];
  if (canonicalPathSegment) {
    permanentRedirect(`/${locale}/${canonicalPathSegment}`);
  }

  const landing = await fetchGuideLandingBySlug(guideSlug);
  if (!landing) notFound();

  const guideTitle = resolveLocalizedString(landing.title as never, locale) || guideSlug;
  const sections = asSections(landing as never);
  const hasDedicatedHero = sections[0]?._type === "heroSection";

  if (hasDedicatedHero) {
    return (
      <LandingRenderer
        locale={locale}
        landing={landing as never}
        breadcrumb={
          <GuidesBreadcrumb locale={locale} slug={guideSlug} guideTitle={guideTitle} overHero />
        }
      />
    );
  }

  return (
    <>
      <section className="pt-20 md:pt-32">
        <div className="container mx-auto max-w-8xl px-5 2xl:px-0">
          <GuidesBreadcrumb locale={locale} slug={guideSlug} guideTitle={guideTitle} />
        </div>
      </section>
      <LandingRenderer locale={locale} landing={landing as never} />
    </>
  );
}
