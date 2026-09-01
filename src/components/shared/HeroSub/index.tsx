import React, { FC } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { Icon } from "@iconify/react/dist/iconify.js"
import { ALBANIA_PHOTOS, DEFAULT_ALBANIA_PHOTO, type AlbaniaPhotoKey } from "@/lib/media/albaniaPhotos";
import { PhotoHeroFlag } from "@/components/shared/PhotoHeroFlag";

interface HeroSubProps {
    title: string;
    description: string;
    badge: string;
    /** Which photograph of Albania backs the hero. Defaults to the coast. */
    photoKey?: AlbaniaPhotoKey;
}

const HeroSub: FC<HeroSubProps> = ({ title, description, badge, photoKey }) => {
    const tPhoto = useTranslations("AlbaniaPhotos");
    const photo = photoKey ? ALBANIA_PHOTOS[photoKey] : DEFAULT_ALBANIA_PHOTO;

    return (
        <>
            <section className="relative text-center !pt-40 pb-20 overflow-x-hidden">
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
                <div className="relative z-20 text-white [text-shadow:0_1px_16px_rgba(0,0,0,0.35)]">
                    <div className='flex gap-2.5 items-center justify-center'>
                        <span>
                            <Icon
                                icon={'ph:house-simple-fill'}
                                width={20}
                                height={20}
                                className='text-primary'
                            />
                        </span>
                        <p className='text-base font-semibold text-white/90'>
                            {badge}
                        </p>
                    </div>
                    <h2 className="text-52 relative font-bold" >{title}</h2>
                    <p className="text-lg text-white/85 font-normal w-full mx-auto whitespace-pre-line">
                        {description}
                    </p>
                </div>
            </section>
        </>
    );
};

export default HeroSub;
