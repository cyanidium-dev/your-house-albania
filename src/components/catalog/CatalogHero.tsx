import Image from "next/image";
import { PortableText, type PortableTextComponents } from "@portabletext/react";
import type { PortableTextBlock } from "@portabletext/types";
import { Icon } from "@iconify/react";
import { useTranslations } from "next-intl";
import type { ReactNode } from "react";
import { heroPhotoFor } from "@/lib/media/albaniaPhotos";
import { PhotoHeroFlag } from "@/components/shared/PhotoHeroFlag";

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
};

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
    <div className="mt-2 max-w-2xl mx-auto md:mt-3">
      <PortableText
        value={intro as PortableTextBlock[]}
        components={introComponents}
      />
    </div>
  ) : (
    <p className="text-lg text-white/85 font-normal mt-2 w-full mx-auto md:mt-3 whitespace-pre-line">
      {effectiveFallback}
    </p>
  );

  return (
    <section className="relative text-center pt-16 pb-10 md:pt-32 md:pb-16 min-h-[19rem] md:min-h-[26rem] flex flex-col justify-center overflow-x-hidden">
      <PhotoHeroFlag />
      <div className="absolute inset-0 z-0">
        <Image
          src={photo.src}
          alt={tPhoto(photo.key)}
          fill
          sizes="100vw"
          className="object-cover object-center"
          priority={false}
        />
      </div>
      {/* Same scrim recipe as the landing hero: a flat wash so the copy has a
          ground whatever the photo's brightness, then a fade into the page. */}
      <div className="pointer-events-none absolute inset-0 z-10 bg-dark/55" aria-hidden />
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-28 bg-gradient-to-t from-white to-transparent dark:from-black"
        aria-hidden
      />
      <div className="container max-w-8xl mx-auto px-5 2xl:px-0 relative z-20 text-white [text-shadow:0_1px_16px_rgba(0,0,0,0.35)]">
        <div className="text-left [&_*]:!text-white/85 [&_a:hover]:!text-white">{breadcrumb}</div>
        <div className="flex flex-wrap gap-2.5 items-center justify-center mt-3 md:mt-6 min-w-0">
          <span className="shrink-0">
            <Icon
              icon="ph:house-simple-fill"
              width={20}
              height={20}
              className="text-primary"
            />
          </span>
          <p className="text-base font-semibold text-white/90 min-w-0 truncate max-w-full">
            {badge}
          </p>
        </div>
        <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl relative font-bold mt-1.5 md:mt-2">
          {effectiveTitle}
        </h1>
        {subtitle}
      </div>
    </section>
  );
}
