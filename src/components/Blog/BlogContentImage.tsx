"use client";

import { useState } from "react";
import Image from "next/image";
import { ImageLightbox } from "@/components/shared/ImageLightbox";

type ImageValue = {
  asset?: { url?: string };
  alt?: string;
  caption?: string;
};

type Props = {
  value: ImageValue;
};

export function BlogContentImage({ value }: Props) {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const url = value?.asset?.url;
  const alt = value?.alt ?? "";
  const caption = value?.caption;

  if (!url || typeof url !== "string") return null;

  const unoptimized = url.startsWith("http");

  return (
    <figure className="my-8">
      <button
        type="button"
        onClick={() => setLightboxOpen(true)}
        className="block w-full text-left overflow-hidden rounded-2xl cursor-zoom-in focus:outline-none focus:ring-2 focus:ring-primary/50"
        aria-label="View image fullscreen"
      >
        <Image
          src={url}
          alt={alt}
          width={1170}
          height={600}
          className="w-full h-auto object-cover"
          unoptimized={unoptimized}
        />
      </button>
      {caption && (
        <figcaption className="mt-2 text-sm text-dark/60 dark:text-white/60 text-center">
          {caption}
        </figcaption>
      )}
      <ImageLightbox
        url={url}
        alt={alt}
        isOpen={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
        unoptimized={unoptimized}
      />
    </figure>
  );
}
