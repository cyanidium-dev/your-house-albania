'use client';

import * as React from 'react';
import { Icon } from "@/components/shared/Icon";
import Image from 'next/image';
import { resolvePropertyIconKey } from '@/lib/sanity/propertyAdapter';
import type { PropertyAmenityItem } from '@/lib/sanity/propertyAdapter';
import { cn } from '@/lib/utils';

/**
 * One amenity: icon and name.
 *
 * The one-line descriptions came from the shared amenity documents, so every
 * listing with air conditioning printed the same "Climate control for
 * year-round comfort." Across 2,600 property URLs that was the same dozen
 * sentences on each, and on a short listing it outweighed the text written
 * for that flat (audit 2026-09-20). The name says all the sentence said. It
 * is a list item rather than a heading for the same reason: nineteen H3s
 * reading "Balcony" tell nobody anything about the page's structure.
 */
function AmenityRow({
  item,
  className,
}: {
  item: PropertyAmenityItem;
  className?: string;
}) {
  return (
    <li className={cn('flex items-center gap-4', className)}>
      <div className="w-8 h-8 shrink-0 flex items-center justify-center">
        {item.customIconUrl ? (
          <Image
            src={item.customIconUrl}
            width={32}
            height={32}
            alt={item.customIconAlt ?? ''}
            className="w-8 h-8 object-contain dark:invert"
            unoptimized
          />
        ) : (
          <Icon
            icon={resolvePropertyIconKey(item.iconKey)}
            width={24}
            height={24}
            className="text-dark dark:text-white"
          />
        )}
      </div>
      <span className="text-dark dark:text-white text-xm">{item.title}</span>
    </li>
  );
}

type Props = {
  amenities: PropertyAmenityItem[];
  sectionTitle: string;
  checkAllLabel: string;
  closeLabel: string;
};

export function PropertyAmenitiesSection({ amenities, sectionTitle, checkAllLabel, closeLabel }: Props) {
  const [modalOpen, setModalOpen] = React.useState(false);
  const displayCount = 3;
  const hasMore = amenities.length > displayCount;
  const mobileItems = hasMore ? amenities.slice(0, displayCount) : amenities;

  React.useEffect(() => {
    if (modalOpen) {
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [modalOpen]);

  React.useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && modalOpen) setModalOpen(false);
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [modalOpen]);

  return (
    <>
      <h3 className="text-xl font-medium">{sectionTitle}</h3>
      <div className="py-5 my-5 lg:py-8 lg:my-8 border-y border-dark/10 dark:border-white/20 flex flex-col gap-5 lg:gap-8">
        {/* Desktop/tablet: full list */}
        <ul className="hidden lg:grid grid-cols-2 gap-x-10 gap-y-5">
          {amenities.map((item) => (
            <AmenityRow key={item.key} item={item} />
          ))}
        </ul>
        {/* Mobile: first 3 + optional button */}
        <div className="flex flex-col gap-4 lg:hidden">
          <ul className="flex flex-col gap-4">
            {mobileItems.map((item) => (
              <AmenityRow key={item.key} item={item} />
            ))}
          </ul>
          {hasMore && (
            <button
              type="button"
              onClick={() => setModalOpen(true)}
              className="self-start py-2 px-4 text-base font-medium text-primary hover:text-dark dark:hover:text-white transition-colors duration-200"
            >
              {checkAllLabel}
            </button>
          )}
        </div>
      </div>

      {/* Mobile modal: full amenities list */}
      {modalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={sectionTitle}
          className="fixed inset-0 z-[9999] lg:hidden"
        >
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setModalOpen(false)}
            aria-hidden
          />
          <div className="absolute inset-x-0 bottom-0 top-0 z-10 max-h-full flex flex-col bg-white dark:bg-dark rounded-t-2xl overflow-hidden">
            <div className="flex items-center gap-3 shrink-0 px-5 py-4 border-b border-dark/10 dark:border-white/20">
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="flex items-center justify-center w-10 h-10 rounded-full hover:bg-dark/5 dark:hover:bg-white/10 transition-colors"
                aria-label={closeLabel}
              >
                <Icon
                  icon="ph:arrow-left"
                  width={24}
                  height={24}
                  className="text-dark dark:text-white"
                />
              </button>
              <h2 className="text-xl font-medium text-dark dark:text-white">{sectionTitle}</h2>
            </div>
            <ul className="flex-1 overflow-y-auto px-5 py-6 flex flex-col gap-6">
              {amenities.map((item) => (
                <AmenityRow key={item.key} item={item} />
              ))}
            </ul>
          </div>
        </div>
      )}
    </>
  );
}
