"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { Icon } from "@iconify/react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";

export type LightboxImage = { url: string; alt?: string };

type Props = {
  /** One image — the blog's case. Ignored when `images` is given. */
  url?: string;
  alt?: string;
  /** Every photograph of the listing; the viewer pages through them. */
  images?: LightboxImage[];
  /** Which one to open on. Re-read each time the viewer opens. */
  initialIndex?: number;
  isOpen: boolean;
  onClose: () => void;
  unoptimized?: boolean;
  /**
   * A control that belongs to the subject, not to the viewer — on a listing
   * card, the enquiry button. Rendered in the bottom bar next to the counter.
   */
  action?: React.ReactNode;
};

/**
 * Full-screen viewer. Opened from a listing card it used to show one still:
 * no way to the next photograph, no thumbnails, no way to ask about the flat
 * without first leaving for the detail page. The detail page's gallery had
 * all three, so the two now behave the same — arrows, keys, swipe, a
 * thumbnail rail, and a slot for the enquiry button.
 */
export function ImageLightbox({
  url,
  alt = "",
  images,
  initialIndex = 0,
  isOpen,
  onClose,
  unoptimized,
  action,
}: Props) {
  const t = useTranslations("Shared.lightbox");
  const tCard = useTranslations("Shared.propertyCard");
  const tDetail = useTranslations("Shared.propertyDetail");

  const list: LightboxImage[] = images?.length ? images : url ? [{ url, alt }] : [];
  const count = list.length;
  const [index, setIndex] = useState(initialIndex);
  const [showThumbs, setShowThumbs] = useState(true);
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);

  const goPrev = useCallback(() => setIndex((i) => (count ? (i - 1 + count) % count : 0)), [count]);
  const goNext = useCallback(() => setIndex((i) => (count ? (i + 1) % count : 0)), [count]);

  // Start on the photograph the visitor clicked, every time the viewer opens.
  useEffect(() => {
    if (isOpen) setIndex(Math.min(Math.max(initialIndex, 0), Math.max(count - 1, 0)));
  }, [isOpen, initialIndex, count]);

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      else if (e.key === "ArrowLeft") goPrev();
      else if (e.key === "ArrowRight") goNext();
    };
    window.addEventListener("keydown", onKeyDown);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = prevOverflow;
    };
  }, [isOpen, onClose, goPrev, goNext]);

  if (!isOpen || count === 0) return null;

  const current = list[Math.min(index, count - 1)];
  const hasMany = count > 1;

  const onTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null || touchStartY.current === null) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    const dy = e.changedTouches[0].clientY - touchStartY.current;
    touchStartX.current = null;
    touchStartY.current = null;
    if (!hasMany || Math.abs(dx) < 40 || Math.abs(dx) < Math.abs(dy)) return;
    if (dx < 0) goNext();
    else goPrev();
  };

  const stop = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90"
      role="dialog"
      aria-modal="true"
      aria-label={t("imageFullscreenView")}
      onClick={stop}
    >
      <button type="button" onClick={onClose} className="absolute inset-0 z-0" aria-label={t("close")} />

      {/* Top bar: counter and close */}
      <div className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-4 py-3 bg-gradient-to-b from-black/60 to-transparent">
        {hasMany ? (
          <span className="px-3 py-1.5 rounded-full bg-black/50 text-white text-sm font-medium tabular-nums">
            {index + 1} / {count}
          </span>
        ) : (
          <span />
        )}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onClose();
          }}
          className="p-2 rounded-full text-white/90 hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white"
          aria-label={t("close")}
        >
          <Icon icon="ph:x" width={28} height={28} />
        </button>
      </div>

      {hasMany && (
        <>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              goPrev();
            }}
            className="absolute left-2 top-1/2 -translate-y-1/2 z-20 p-2 rounded-full text-white/90 hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white"
            aria-label={tCard("previousImage")}
          >
            <Icon icon="ph:caret-left" width={32} height={32} />
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              goNext();
            }}
            className="absolute right-2 top-1/2 -translate-y-1/2 z-20 p-2 rounded-full text-white/90 hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white"
            aria-label={tCard("nextImage")}
          >
            <Icon icon="ph:caret-right" width={32} height={32} />
          </button>
        </>
      )}

      <div
        className={cn(
          "absolute inset-x-0 top-0 z-10 flex items-center justify-center p-2 pt-14 sm:p-4 sm:pt-16",
          hasMany || action ? "bottom-[calc(7rem+env(safe-area-inset-bottom,0px))] lg:bottom-[calc(9.5rem+env(safe-area-inset-bottom,0px))]" : "bottom-0",
        )}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
        onClick={(e) => e.stopPropagation()}
        role="presentation"
      >
        <Image
          key={current.url}
          src={current.url}
          alt={current.alt ?? alt}
          fill
          className="object-contain object-center"
          sizes="100vw"
          unoptimized={unoptimized}
        />
      </div>

      {(hasMany || action) && (
        <div
          className="absolute bottom-0 left-0 right-0 z-20 bg-gradient-to-t from-black/85 to-transparent"
          style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
          onClick={(e) => e.stopPropagation()}
          role="presentation"
        >
          {/* Action row: the enquiry button, and the thumbnail toggle when there is a rail to fold */}
          <div className="flex items-center justify-between gap-3 px-4 pt-3 pb-2">
            <div className="min-w-0">{action}</div>
            {hasMany && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowThumbs((s) => !s);
                }}
                className="shrink-0 p-2 rounded-full bg-black/60 text-white/90 hover:bg-black/80 focus:outline-none focus:ring-2 focus:ring-white transition-colors duration-200"
                aria-label={showThumbs ? tDetail("hideThumbnails") : tDetail("showThumbnails")}
              >
                <Icon
                  icon="ph:caret-down"
                  width={20}
                  height={20}
                  className={cn("transition-transform duration-200 ease-out", !showThumbs && "rotate-180")}
                />
              </button>
            )}
          </div>
          {hasMany && (
            <div
              className={cn(
                "overflow-hidden transition-all duration-300 ease-out",
                showThumbs ? "max-h-[140px] opacity-100" : "max-h-0 opacity-0",
              )}
            >
              <div className="overflow-x-auto px-4 pb-4 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
                <div className="flex items-center gap-3 py-2 px-2 min-w-max">
                  {list.map((img, idx) => (
                    <button
                      key={`${img.url}-${idx}`}
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setIndex(idx);
                      }}
                      className={cn(
                        "shrink-0 w-14 h-14 lg:w-20 lg:h-20 rounded-lg overflow-hidden relative focus:outline-none focus:ring-2 focus:ring-white",
                        index === idx ? "ring-2 ring-white ring-offset-2 ring-offset-black/60" : "opacity-70 hover:opacity-100",
                      )}
                      aria-label={tDetail("goToImage", { n: idx + 1 })}
                    >
                      <Image
                        src={img.url}
                        alt={img.alt ?? tDetail("thumbnailAlt", { n: idx + 1 })}
                        fill
                        className="object-cover"
                        sizes="(max-width: 1023px) 56px, 80px"
                        unoptimized={unoptimized}
                      />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
