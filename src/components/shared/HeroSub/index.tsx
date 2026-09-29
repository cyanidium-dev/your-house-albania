import React, { FC, ReactNode } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { ALBANIA_PHOTOS, DEFAULT_ALBANIA_PHOTO, type AlbaniaPhotoKey } from "@/lib/media/albaniaPhotos";
import { PhotoHeroFlag } from "@/components/shared/PhotoHeroFlag";
import { HERO_LABEL, HERO_LEAD, HERO_TITLE } from "@/components/shared/layout";

interface HeroSubProps {
    title: string;
    description: string;
    /** Small label above the title. Optional since 2026-09-27. */
    badge?: string;
    /** Which photograph of Albania backs the hero. Defaults to the coast. */
    photoKey?: AlbaniaPhotoKey;
    /**
     * Breadcrumb rendered inside the hero, above the title, in the same place
     * the CMS landings put theirs (HeroSectionImpl). Pass it with `overHero`
     * so it reads white on the photo. Before this slot existed the blog put
     * its breadcrumb under the hero while the guides put theirs above the
     * heading, so the two content hubs read as two different sites.
     */
    breadcrumb?: ReactNode;
}

const HeroSub: FC<HeroSubProps> = ({ title, description, badge, photoKey, breadcrumb }) => {
    const tPhoto = useTranslations("AlbaniaPhotos");
    const photo = photoKey ? ALBANIA_PHOTOS[photoKey] : DEFAULT_ALBANIA_PHOTO;

    return (
        <>
            <section className="relative text-left !pt-32 md:!pt-40 pb-20 overflow-x-hidden">
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
                {/* Scrim, so the copy reads whatever the photograph's brightness. */}
                <div className="pointer-events-none absolute inset-0 z-10 bg-dark/55" aria-hidden />
                <div
                    className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-28 bg-gradient-to-t from-white to-transparent dark:from-black"
                    aria-hidden
                />
                <div className="container relative z-20 mx-auto max-w-8xl px-5 2xl:px-0 text-white [text-shadow:0_1px_16px_rgba(0,0,0,0.35)]">
                    {breadcrumb ? (
                        <div className="mb-6 text-left [&_nav]:mb-0">{breadcrumb}</div>
                    ) : null}
                    {badge ? <p className={`${HERO_LABEL} mb-3 md:mb-4`}>{badge}</p> : null}
                    {/*
                      The page's main heading, so h1 — it was an h2, which left
                      /blog with no h1 at all in any locale, plus every
                      ?category= and ?page= variant of it (78 URLs in the Ahrefs
                      crawl of 2026-09-10). The other caller is the home page's
                      no-landing fallback, where this is also the only heading.
                    */}
                    <h1 className={`${HERO_TITLE} relative md:max-w-[75%]`}>{title}</h1>
                    <p className={`${HERO_LEAD} mt-4 max-w-2xl text-pretty`}>{description}</p>
                </div>
            </section>
        </>
    );
};

export default HeroSub;
