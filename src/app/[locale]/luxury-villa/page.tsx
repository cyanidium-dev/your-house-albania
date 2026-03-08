import HeroSub from "@/components/shared/HeroSub";
import LuxuryVillas from "@/components/Properties/LuxuryVilla";
import React from "react";
import { Metadata } from "next";
import { getTranslations } from "next-intl/server";

export const metadata: Metadata = {
    title: "Property List | Homely",
};

type Props = { params: Promise<{ locale: string }> };

export default async function page({ params }: Props) {
    const { locale } = await params;
    const t = await getTranslations('Listing.luxuryVilla');
    return (
        <>
            <HeroSub
                title={t('title')}
                description={t('description')}
                badge={t('badge')}
            />
            <LuxuryVillas locale={locale} />
        </>
    );
}