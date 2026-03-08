'use client';

import React, { useState, useCallback, useEffect } from 'react';
import Image from 'next/image';
import { Icon } from '@iconify/react';

export type GalleryImage = { url: string; alt?: string };

type Props = {
  images: GalleryImage[];
};

export function PropertyGallery({ images }: Props) {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);

  const openLightbox = useCallback((index: number) => {
    setCurrentIndex(index);
    setLightboxOpen(true);
  }, []);

  const closeLightbox = useCallback(() => setLightboxOpen(false), []);

  const goPrev = useCallback(() => {
    setCurrentIndex((i) => (i <= 0 ? images.length - 1 : i - 1));
  }, [images.length]);

  const goNext = useCallback(() => {
    setCurrentIndex((i) => (i >= images.length - 1 ? 0 : i + 1));
  }, [images.length]);

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
    if (Math.abs(dx) > 50) dx > 0 ? goPrev() : goNext();
    setTouchStartX(null);
  };

  if (images.length === 0) return null;

  const unoptimized = images[0]?.url?.startsWith('http') ?? false;

  return (
    <>
      <div className="grid grid-cols-12 mt-8 gap-8">
        <div className="lg:col-span-8 col-span-12 row-span-2">
          <button
            type="button"
            onClick={() => openLightbox(0)}
            className="block w-full text-left rounded-2xl overflow-hidden relative h-[280px] xs:h-[340px] mobile:h-[400px] lg:h-[540px] bg-dark/5 dark:bg-white/5 focus:outline-none focus:ring-2 focus:ring-primary/50 cursor-pointer"
            aria-label="Open main image"
          >
            <Image
              src={images[0].url}
              alt={images[0].alt ?? 'Main Property Image'}
              fill
              className="object-cover object-center"
              sizes="(max-width: 1023px) 100vw, 66vw"
              unoptimized={unoptimized}
            />
          </button>
        </div>
        <div className="lg:col-span-4 lg:block hidden">
          {images[1] && (
            <button
              type="button"
              onClick={() => openLightbox(1)}
              className="block w-full h-full min-h-[200px] lg:min-h-0 rounded-2xl overflow-hidden relative focus:outline-none focus:ring-2 focus:ring-primary/50 cursor-pointer"
              aria-label="Open image 2"
            >
              <Image
                src={images[1].url}
                alt={images[1].alt ?? 'Property Image 2'}
                fill
                className="object-cover object-center"
                sizes="33vw"
                unoptimized={unoptimized}
              />
            </button>
          )}
        </div>
        <div className="lg:col-span-2 col-span-6">
          {images[2] && (
            <button
              type="button"
              onClick={() => openLightbox(2)}
              className="block w-full rounded-2xl overflow-hidden relative aspect-[4/3] min-h-[140px] lg:aspect-auto lg:min-h-0 lg:h-full focus:outline-none focus:ring-2 focus:ring-primary/50 cursor-pointer"
              aria-label="Open image 3"
            >
              <Image
                src={images[2].url}
                alt={images[2].alt ?? 'Property Image 3'}
                fill
                className="object-cover object-center"
                sizes="(max-width: 1023px) 50vw, 16vw"
                unoptimized={unoptimized}
              />
            </button>
          )}
        </div>
        <div className="lg:col-span-2 col-span-6">
          {images[3] && (
            <button
              type="button"
              onClick={() => openLightbox(3)}
              className="block w-full rounded-2xl overflow-hidden relative aspect-[4/3] min-h-[140px] lg:aspect-auto lg:min-h-0 lg:h-full focus:outline-none focus:ring-2 focus:ring-primary/50 cursor-pointer"
              aria-label="Open image 4"
            >
              <Image
                src={images[3].url}
                alt={images[3].alt ?? 'Property Image 4'}
                fill
                className="object-cover object-center"
                sizes="(max-width: 1023px) 50vw, 16vw"
                unoptimized={unoptimized}
              />
            </button>
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

          {images.length > 1 && (
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
              src={images[currentIndex]?.url ?? images[0].url}
              alt={images[currentIndex]?.alt ?? `Image ${currentIndex + 1}`}
              fill
              className="object-contain object-center"
              sizes="100vw"
              unoptimized={unoptimized}
            />
          </div>

          {images.length > 1 && (
            <p className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/70 text-sm z-20 pointer-events-none">
              {currentIndex + 1} / {images.length}
            </p>
          )}
        </div>
      )}
    </>
  );
}
