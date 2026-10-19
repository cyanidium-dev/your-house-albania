import Image from "next/image";
import type { ReactNode } from "react";
import { PhotoHeroFlag } from "@/components/shared/PhotoHeroFlag";
import { CONTAINER, HERO_LABEL, HERO_LEAD, HERO_TITLE } from "@/components/shared/layout";
import { NoPhotoPlate } from "@/components/shared/NoPhotoPlate";

type Props = {
  breadcrumb: ReactNode;
  label: string;
  title: string;
  lead: string;
  /** A listing's own photograph on the Sanity CDN; the place's name plate without one. */
  image: { src: string; alt: string } | null;
  /** Shown under the lead: the link to the agency's full catalogue. */
  footer?: ReactNode;
};

/**
 * The landing's photo hero: the same scrim, scale and start alignment as the
 * catalogue hero (`CatalogHero`), but the picture is one of the partner's own
 * listings rather than the city's stock photograph, so the page opens on the
 * building it is about.
 */
export function PartnerLandingHero({ breadcrumb, label, title, lead, image, footer }: Props) {
  return (
    <section className="relative text-left pt-16 pb-10 md:pt-32 md:pb-16 min-h-[19rem] md:min-h-[26rem] flex flex-col justify-center overflow-x-hidden">
      <PhotoHeroFlag />
      <div className="absolute inset-0 z-0">
        {image ? (
          <Image
            src={image.src}
            alt={image.alt}
            fill
            sizes="100vw"
            className="object-cover object-center"
            priority
            fetchPriority="high"
          />
        ) : (
          <NoPhotoPlate className="opacity-80" />
        )}
      </div>
      <div className="pointer-events-none absolute inset-0 z-10 bg-dark/55" aria-hidden />
      <div
        className="pointer-events-none absolute inset-0 z-10 bg-gradient-to-r from-dark/45 via-dark/25 to-transparent"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-10 bg-gradient-to-t from-white to-transparent md:h-16 dark:from-black"
        aria-hidden
      />
      <div className={`${CONTAINER} relative z-20 text-white [text-shadow:0_1px_16px_rgba(0,0,0,0.35)]`}>
        <div className="text-left [&_*]:!text-white/85 [&_a:hover]:!text-white">{breadcrumb}</div>
        <p className={`${HERO_LABEL} mt-4 md:mt-6 truncate`}>{label}</p>
        <h1 className={`${HERO_TITLE} relative mt-3 md:mt-4 md:max-w-[75%]`}>{title}</h1>
        <p className={`${HERO_LEAD} mt-3 max-w-2xl md:mt-4`}>{lead}</p>
        {footer ? <div className="mt-4 md:mt-5">{footer}</div> : null}
      </div>
    </section>
  );
}
