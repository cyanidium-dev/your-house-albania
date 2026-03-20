"use client";

import { useEffect } from "react";
import Image from "next/image";
import { Icon } from "@iconify/react";

type Props = {
  url: string;
  alt?: string;
  isOpen: boolean;
  onClose: () => void;
  unoptimized?: boolean;
};

export function ImageLightbox({ url, alt = "", isOpen, onClose, unoptimized }: Props) {
  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "";
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90"
      role="dialog"
      aria-modal="true"
      aria-label="Image fullscreen view"
    >
      <button
        type="button"
        onClick={onClose}
        className="absolute inset-0 z-0"
        aria-label="Close"
      />
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onClose();
        }}
        className="absolute top-4 right-4 z-20 p-2 rounded-full text-white/90 hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white"
        aria-label="Close"
      >
        <Icon icon="ph:x" width={28} height={28} />
      </button>
      <div
        className="relative w-full h-full max-w-6xl max-h-[90vh] flex items-center justify-center p-14 z-10"
        onClick={(e) => e.stopPropagation()}
        role="presentation"
      >
        <Image
          src={url}
          alt={alt}
          fill
          className="object-contain object-center"
          sizes="100vw"
          unoptimized={unoptimized}
        />
      </div>
    </div>
  );
}
