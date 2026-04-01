'use client';

import * as React from 'react';
import { Icon } from '@iconify/react';
import Image from 'next/image';
import { resolvePropertyIconKey } from '@/lib/sanity/propertyAdapter';
import type { PropertyAmenityItem } from '@/lib/sanity/propertyAdapter';
import { cn } from '@/lib/utils';

function AmenityRow({
  item,
  className,
}: {
  item: PropertyAmenityItem;
  className?: string;
}) {
  return (
    <div
      key={item.key}
      className={cn('flex items-center gap-6', className)}
    >
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
      <div>
        <h3 className="text-dark dark:text-white text-xm">{item.title}</h3>
        {item.description && (
          <p className="text-base text-dark/50 dark:text-white/50">{item.description}</p>
        )}
      </div>
    </div>
  );
}

type Props = {
  amenities: PropertyAmenityItem[];
  sectionTitle: string;
  checkAllLabel: string;
};

export function PropertyAmenitiesSection({ amenities, sectionTitle, checkAllLabel }: Props) {
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
      <div className="py-8 my-8 border-y border-dark/10 dark:border-white/20 flex flex-col gap-8">
        {/* Desktop/tablet: full list */}
        <div className="hidden lg:flex flex-col gap-8">
          {amenities.map((item) => (
            <AmenityRow key={item.key} item={item} />
          ))}
        </div>
        {/* Mobile: first 3 + optional button */}
        <div className="flex flex-col gap-8 lg:hidden">
          {mobileItems.map((item) => (
            <AmenityRow key={item.key} item={item} />
          ))}
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
                aria-label="Close"
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
            <div className="flex-1 overflow-y-auto px-5 py-6 flex flex-col gap-6">
              {amenities.map((item) => (
                <AmenityRow key={item.key} item={item} />
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
