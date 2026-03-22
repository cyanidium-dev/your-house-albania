'use client';

import React, { useState, useCallback, useEffect, useRef } from 'react';
import Image from 'next/image';
import { Icon } from '@iconify/react';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';

export type GalleryImage = { url: string; alt?: string };

type Props = {
  images: GalleryImage[];
};

const PREVIEW_MAX = 5;

export function PropertyGallery({ images }: Props) {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [mobileSlideIndex, setMobileSlideIndex] = useState(0);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const mobileScrollerRef = useRef<HTMLDivElement>(null);
  const bigImages = [...images, ...images, ...images, ...images, ...images];
  const t = useTranslations('Shared.propertyDetail');
  const previewImages = bigImages.slice(0, PREVIEW_MAX);
  const count = previewImages.length;
  const hasMoreImages = bigImages.length > PREVIEW_MAX;
  const totalCount = bigImages.length;

  const openLightbox = useCallback((index: number) => {
    setCurrentIndex(index);
    setLightboxOpen(true);
  }, []);

  const closeLightbox = useCallback(() => setLightboxOpen(false), []);

  const goPrev = useCallback(() => {
    setCurrentIndex((i) => (i <= 0 ? bigImages.length - 1 : i - 1));
  }, [bigImages.length]);

  const goNext = useCallback(() => {
    setCurrentIndex((i) => (i >= bigImages.length - 1 ? 0 : i + 1));
  }, [bigImages.length]);

  useEffect(() => {
    if (!lightboxOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeLightbox();
      if (e.key === 'ArrowLeft') goPrev();
      if (e.key === 'ArrowRight') goNext();
    };
    window.addEventListener('keydown', onKeyDown);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = '';
    };
  }, [lightboxOpen, closeLightbox, goPrev, goNext]);

  const handleTouchStart = (e: React.TouchEvent) => setTouchStartX(e.touches[0].clientX);
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX == null) return;
    const dx = e.changedTouches[0].clientX - touchStartX;
    if (Math.abs(dx) > 50) {
      if (dx > 0) goPrev();
      else goNext();
    }
    setTouchStartX(null);
  };

  useEffect(() => {
    const el = mobileScrollerRef.current;
    if (!el || previewImages.length <= 1) return;
    const onScroll = () => {
      const w = el.clientWidth;
      if (w <= 0) return;
      const idx = Math.round(el.scrollLeft / w);
      setMobileSlideIndex(Math.min(idx, previewImages.length - 1));
    };
    el.addEventListener('scroll', onScroll);
    onScroll();
    return () => el.removeEventListener('scroll', onScroll);
  }, [previewImages.length]);

  if (bigImages.length === 0) return null;

  const unoptimized = bigImages[0]?.url?.startsWith('http') ?? false;
  const imgAlt = (img: GalleryImage, fallback: string) => img.alt ?? fallback;

  const imgBtn = (
    img: GalleryImage,
    index: number,
    className: string,
    ariaLabel: string
  ) => (
    <button
      key={index}
      type="button"
      onClick={() => openLightbox(index)}
      className={className}
      aria-label={ariaLabel}
    >
      <Image
        src={img.url}
        alt={imgAlt(img, ariaLabel)}
        fill
        className="object-cover object-center"
        sizes="(max-width: 1023px) 100vw, 33vw"
        unoptimized={unoptimized}
      />
    </button>
  );

  return (
    <>
      <div className="mt-8">
        {/* Mobile: slider (no arrows, counter bottom-right, tap opens gallery) */}
        <div className="lg:hidden relative">
          {previewImages.length === 1 ? (
            <button
              type="button"
              onClick={() => openLightbox(0)}
              className="block w-full text-left rounded-2xl overflow-hidden relative h-[280px] xs:h-[340px] mobile:h-[400px] bg-dark/5 dark:bg-white/5 focus:outline-none focus:ring-2 focus:ring-primary/50 cursor-pointer"
              aria-label="Open image"
            >
              <Image
                src={previewImages[0].url}
                alt={imgAlt(previewImages[0], 'Property image')}
                fill
                className="object-cover object-center"
                sizes="100vw"
                unoptimized={unoptimized}
              />
            </button>
          ) : (
            <div className="relative rounded-2xl overflow-hidden bg-dark/5 dark:bg-white/5">
              <div
                ref={mobileScrollerRef}
                className={cn(
                  'flex overflow-x-auto snap-x snap-mandatory',
                  '[scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden'
                )}
              >
                {previewImages.map((img, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => openLightbox(idx)}
                    className="snap-start shrink-0 w-full min-w-full h-[280px] xs:h-[340px] mobile:h-[400px] relative focus:outline-none focus:ring-2 focus:ring-primary/50 cursor-pointer"
                    aria-label={`Open image ${idx + 1}`}
                  >
                    <Image
                      src={img.url}
                      alt={imgAlt(img, `Property image ${idx + 1}`)}
                      fill
                      className="object-cover object-center"
                      sizes="100vw"
                      unoptimized={unoptimized}
                    />
                  </button>
                ))}
              </div>
              <div className="absolute bottom-3 right-3 px-2.5 py-1 rounded-full bg-black/60 text-white text-sm font-medium pointer-events-none">
                {mobileSlideIndex + 1}/{previewImages.length}
              </div>
            </div>
          )}
          {hasMoreImages && (
            <button
              type="button"
              onClick={() => openLightbox(0)}
              className="mt-3 w-full py-3 rounded-full font-semibold bg-dark/10 dark:bg-white/10 hover:bg-dark/20 dark:hover:bg-white/20 text-dark dark:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-primary/50 cursor-pointer lg:hidden"
            >
              {t('checkAllPhotos')} ({totalCount})
            </button>
          )}
        </div>

        {/* Desktop/tablet: deterministic grid layouts */}
        <div className={cn('hidden lg:grid grid-cols-12 gap-2 mt-0', count >= 2 && 'grid-rows-2')}>
          {count === 1 && (
            <div className="col-span-12 rounded-2xl overflow-hidden relative h-[400px] xl:h-[540px] bg-dark/5 dark:bg-white/5">
              {imgBtn(
                previewImages[0],
                0,
                'block w-full h-full text-left rounded-2xl overflow-hidden relative focus:outline-none focus:ring-2 focus:ring-primary/50 cursor-pointer',
                'Open image'
              )}
            </div>
          )}

          {count === 2 && (
            <>
              <div className="col-span-8 row-span-2 rounded-2xl overflow-hidden relative h-[400px] xl:h-[540px] bg-dark/5 dark:bg-white/5">
                {imgBtn(
                  previewImages[0],
                  0,
                  'block w-full h-full text-left rounded-2xl overflow-hidden relative focus:outline-none focus:ring-2 focus:ring-primary/50 cursor-pointer',
                  'Open image 1'
                )}
              </div>
              <div className="col-span-4 row-span-2 rounded-2xl overflow-hidden relative min-h-[250px] bg-dark/5 dark:bg-white/5">
                {imgBtn(
                  previewImages[1],
                  1,
                  'block w-full h-full text-left rounded-2xl overflow-hidden relative focus:outline-none focus:ring-2 focus:ring-primary/50 cursor-pointer',
                  'Open image 2'
                )}
              </div>
            </>
          )}

          {count === 3 && (
            <>
              <div className="col-span-8 row-span-2 rounded-2xl overflow-hidden relative h-[400px] xl:h-[540px] bg-dark/5 dark:bg-white/5">
                {imgBtn(
                  previewImages[0],
                  0,
                  'block w-full h-full text-left rounded-2xl overflow-hidden relative focus:outline-none focus:ring-2 focus:ring-primary/50 cursor-pointer',
                  'Open image 1'
                )}
              </div>
              <div className="col-span-4 row-span-2 flex flex-col gap-2">
                <div className="flex-1 min-h-0 rounded-2xl overflow-hidden relative bg-dark/5 dark:bg-white/5">
                  {imgBtn(
                    previewImages[1],
                    1,
                    'block w-full h-full text-left rounded-2xl overflow-hidden relative focus:outline-none focus:ring-2 focus:ring-primary/50 cursor-pointer',
                    'Open image 2'
                  )}
                </div>
                <div className="flex-1 min-h-0 rounded-2xl overflow-hidden relative bg-dark/5 dark:bg-white/5">
                  {imgBtn(
                    previewImages[2],
                    2,
                    'block w-full h-full text-left rounded-2xl overflow-hidden relative focus:outline-none focus:ring-2 focus:ring-primary/50 cursor-pointer',
                    'Open image 3'
                  )}
                </div>
              </div>
            </>
          )}

          {count === 4 && (
            <>
              <div className="col-span-8 row-span-2 rounded-2xl overflow-hidden relative h-[400px] xl:h-[540px] bg-dark/5 dark:bg-white/5">
                {imgBtn(
                  previewImages[0],
                  0,
                  'block w-full h-full text-left rounded-2xl overflow-hidden relative focus:outline-none focus:ring-2 focus:ring-primary/50 cursor-pointer',
                  'Open image 1'
                )}
              </div>
              <div className="col-span-4 row-span-2 grid grid-rows-[1fr_1fr] gap-2">
                <div className="min-h-0 rounded-2xl overflow-hidden relative bg-dark/5 dark:bg-white/5">
                  {imgBtn(
                    previewImages[1],
                    1,
                    'block w-full h-full text-left rounded-2xl overflow-hidden relative focus:outline-none focus:ring-2 focus:ring-primary/50 cursor-pointer',
                    'Open image 2'
                  )}
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="min-h-0 rounded-2xl overflow-hidden relative bg-dark/5 dark:bg-white/5">
                    {imgBtn(
                      previewImages[2],
                      2,
                      'block w-full h-full text-left rounded-2xl overflow-hidden relative focus:outline-none focus:ring-2 focus:ring-primary/50 cursor-pointer',
                      'Open image 3'
                    )}
                  </div>
                  <div className="min-h-0 rounded-2xl overflow-hidden relative bg-dark/5 dark:bg-white/5">
                    {imgBtn(
                      previewImages[3],
                      3,
                      'block w-full h-full text-left rounded-2xl overflow-hidden relative focus:outline-none focus:ring-2 focus:ring-primary/50 cursor-pointer',
                      'Open image 4'
                    )}
                  </div>
                </div>
              </div>
            </>
          )}

          {count >= 5 && (
            <>
              <div className="col-span-8 row-span-2 rounded-2xl overflow-hidden relative h-[400px] xl:h-[540px] bg-dark/5 dark:bg-white/5">
                {imgBtn(
                  previewImages[0],
                  0,
                  'block w-full h-full text-left rounded-2xl overflow-hidden relative focus:outline-none focus:ring-2 focus:ring-primary/50 cursor-pointer',
                  'Open image 1'
                )}
              </div>
              <div className="col-span-4 row-span-2 grid grid-cols-2 grid-rows-2 gap-2">
                {[1, 2, 3, 4].map((idx) => (
                  <div key={idx} className="min-h-0 rounded-2xl overflow-hidden relative bg-dark/5 dark:bg-white/5">
                    {imgBtn(
                      previewImages[idx],
                      idx,
                      'block w-full h-full text-left rounded-2xl overflow-hidden relative focus:outline-none focus:ring-2 focus:ring-primary/50 cursor-pointer',
                      `Open image ${idx + 1}`
                    )}
                  </div>
                ))}
              </div>
            </>
          )}

          {hasMoreImages && (
            <div className="col-span-12 mt-2 flex justify-center">
              <button
                type="button"
                onClick={() => openLightbox(0)}
                className="py-3 px-6 rounded-full font-semibold bg-dark/10 dark:bg-white/10 hover:bg-dark/20 dark:hover:bg-white/20 text-dark dark:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-primary/50 cursor-pointer"
              >
                {t('checkAllPhotos')} ({totalCount})
              </button>
            </div>
          )}
        </div>
      </div>

      {lightboxOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90"
          role="dialog"
          aria-modal="true"
          aria-label="Image gallery"
        >
          <button
            type="button"
            onClick={closeLightbox}
            className="absolute inset-0 z-0"
            aria-label="Close"
          />
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); closeLightbox(); }}
            className="absolute top-4 right-4 z-20 p-2 rounded-full text-white/90 hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white"
            aria-label="Close"
          >
            <Icon icon="ph:x" width={28} height={28} />
          </button>

          {bigImages.length > 1 && (
            <>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); goPrev(); }}
                className="absolute left-2 top-1/2 -translate-y-1/2 z-20 p-2 rounded-full text-white/90 hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white"
                aria-label="Previous image"
              >
                <Icon icon="ph:caret-left" width={32} height={32} />
              </button>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); goNext(); }}
                className="absolute right-2 top-1/2 -translate-y-1/2 z-20 p-2 rounded-full text-white/90 hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white"
                aria-label="Next image"
              >
                <Icon icon="ph:caret-right" width={32} height={32} />
              </button>
            </>
          )}

          <div
            className="relative w-full h-full max-w-6xl max-h-[90vh] flex items-center justify-center p-14 z-10"
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
            onClick={(e) => e.stopPropagation()}
            role="presentation"
          >
            <Image
              src={bigImages[currentIndex]?.url ?? bigImages[0].url}
              alt={imgAlt(bigImages[currentIndex] ?? bigImages[0], `Image ${currentIndex + 1}`)}
              fill
              className="object-contain object-center"
              sizes="100vw"
              unoptimized={unoptimized}
            />
          </div>

          {bigImages.length > 1 && (
            <p className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/70 text-sm z-20 pointer-events-none">
              {currentIndex + 1} / {bigImages.length}
            </p>
          )}
        </div>
      )}
    </>
  );
}
