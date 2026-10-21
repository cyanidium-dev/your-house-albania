import Image from "next/image";
import { PortableText, type PortableTextComponents } from "@portabletext/react";
import type { PortableTextBlock } from "@portabletext/types";
import { useTranslations } from "next-intl";
import type { ReactNode } from "react";
import { heroPhotoFor } from "@/lib/media/albaniaPhotos";
import { PhotoHeroFlag } from "@/components/shared/PhotoHeroFlag";
import { HERO_LABEL, HERO_LEAD, HERO_TITLE } from "@/components/shared/layout";
import { cn } from "@/lib/utils";

const introComponents: PortableTextComponents = {
  block: {
    normal: ({ children }) => (
      <p className="text-lg text-white/85 font-normal mt-2 first:mt-0 md:mt-3 md:first:mt-0">
        {children}
      </p>
    ),
    h1: ({ children }) => (
      <p className="text-lg text-white/85 font-normal mt-2 first:mt-0 md:mt-3 md:first:mt-0">
        {children}
      </p>
    ),
    h2: ({ children }) => (
      <p className="text-lg text-white/85 font-normal mt-2 first:mt-0 md:mt-3 md:first:mt-0">
        {children}
      </p>
    ),
  },
};

type Props = {
  title: string;
  badge: string;
  intro: unknown[] | null;
  introFallback: string;
  breadcrumb: ReactNode;
  agentName?: string;
  /** City this listing is filtered to, when the route has one. */
  citySlug?: string;
  /** Property-type facet in the route, e.g. `villa`. */
  propertyType?: string;
  /** Deal route segment, e.g. `short-term-rent`. */
  deal?: string;
  /** Rendered under the intro, e.g. the link to the place's prices page. */
  footer?: ReactNode;
  /**
   * Experiment E002 (docs/experiments/002): in the `compact` variant phones
   * skip the intro and the hero's minimum height, so the first listing card
   * reaches the first screen. Only the city/district/facet route opts in.
   */
  compactExperiment?: boolean;
};

/** E002 `compact` on phones; inert without the attribute bootFlags sets on <html>. */
const E002_HIDE = "max-md:[[data-x-catalog-mobile-compact-head=compact]_&]:hidden";

export function CatalogHero({
  title,
  badge,
  intro,
  introFallback,
  breadcrumb,
  agentName,
  citySlug,
  propertyType,
  deal,
  footer,
  compactExperiment = false,
}: Props) {
  const t = useTranslations("Catalog");
  const tPhoto = useTranslations("AlbaniaPhotos");
  const effectiveTitle = agentName ? t("agentTitle", { name: agentName }) : title;
  const effectiveFallback = agentName
    ? t("agentIntroFallback")
    : introFallback;
  // Listing pages used to open on bare text. Give each one a photograph of the
  // place it is actually about — the city when the route names one, otherwise
  // the type or the deal.
  const photo = heroPhotoFor({ citySlug, propertyType, deal });
  const hasIntro = Array.isArray(intro) && intro.length > 0;
  const subtitle = hasIntro ? (
    <div className={cn("mt-3 max-w-2xl md:mt-4", compactExperiment && E002_HIDE)}>
      <PortableText
        value={intro as PortableTextBlock[]}
        components={introComponents}
      />
    </div>
  ) : (
    <p className={cn(`${HERO_LEAD} mt-3 max-w-2xl md:mt-4`, compactExperiment && E002_HIDE)}>
      {effectiveFallback}
    </p>
  );

  return (
    <section
      className={cn(
        "relative text-left pt-16 pb-10 md:pt-32 md:pb-16 min-h-[19rem] md:min-h-[26rem] flex flex-col justify-center overflow-x-hidden",
        compactExperiment && "max-md:[[data-x-catalog-mobile-compact-head=compact]_&]:min-h-0 max-md:[[data-x-catalog-mobile-compact-head=compact]_&]:pb-6",
      )}
    >
      <PhotoHeroFlag />
      <div className="absolute inset-0 z-0">
        <Image
          src={photo.src}
          alt={tPhoto(photo.key)}
          fill
          sizes="100vw"
          className="object-cover object-center"
          // This photograph is the LCP element on every city and listing page.
          // It used to be explicitly deprioritised, so it was lazy-loaded and
          // only started downloading after the rest of the page.
          priority
          fetchPriority="high"
        />
      </div>
      {/* Same scrim recipe as the landing hero: a flat wash so the copy has a
          ground whatever the photo's brightness, then a fade into the page. */}
      <div className="pointer-events-none absolute inset-0 z-10 bg-dark/55" aria-hidden />
      {/* The copy is start-aligned, so the left side gets more ground: bright
          facades behind the breadcrumb and label read at 1.5:1 in places, and
          the lead under 4.5:1 (audit 2026-10-18 M4). */}
      <div
        className="pointer-events-none absolute inset-0 z-10 bg-gradient-to-r from-dark/45 via-dark/25 to-transparent"
        aria-hidden
      />
      {/* The fade into the page stays inside the bottom padding: taller, it
          washed the lead and the footer link with white. */}
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-10 bg-gradient-to-t from-white to-transparent md:h-16 dark:from-black"
        aria-hidden
      />
      <div className="container max-w-8xl mx-auto px-5 2xl:px-0 relative z-20 text-white [text-shadow:0_1px_16px_rgba(0,0,0,0.35)]">
        <div className="text-left [&_*]:!text-white/85 [&_a:hover]:!text-white">{breadcrumb}</div>
        <p className={`${HERO_LABEL} mt-4 md:mt-6 truncate`}>{badge}</p>
        {/* Wider than the landing hero's title: listing titles are the long
            SEO ones ("Property for Sale in Albania — Apartments, …"). */}
        <h1 className={`${HERO_TITLE} relative mt-3 md:mt-4 md:max-w-[75%]`}>{effectiveTitle}</h1>
        {subtitle}
        {footer ? <div className="mt-4 md:mt-5">{footer}</div> : null}
      </div>
    </section>
  );
}
