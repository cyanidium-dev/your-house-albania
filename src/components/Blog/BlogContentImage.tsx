"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";
import { ZoomableImage } from "@/components/shared/ZoomableImage";

type ImageValue = {
  asset?: { url?: string };
  alt?: string;
  caption?: string;
};

type Props = {
  value: ImageValue;
};

export function BlogContentImage({ value }: Props) {
  const t = useTranslations("Shared.lightbox");
  const url = value?.asset?.url;
  const alt = value?.alt ?? "";
  const caption = value?.caption;

  if (!url || typeof url !== "string") return null;

  return (
    <figure className="my-8">
      <ZoomableImage url={url} alt={alt} label={t("viewImageFullscreen")} className="overflow-hidden rounded-2xl">
        <Image
          src={url}
          alt={alt}
          width={1170}
          height={600}
          className="w-full h-auto object-cover"
        />
      </ZoomableImage>
      {caption && (
        <figcaption className="mt-2 text-sm text-dark/60 dark:text-white/60 text-center">
          {caption}
        </figcaption>
      )}
    </figure>
  );
}
