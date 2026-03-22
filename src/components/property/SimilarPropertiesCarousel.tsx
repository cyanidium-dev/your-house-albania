'use client';

import * as React from 'react';
import { Icon } from '@iconify/react';
import PropertyCard from '@/components/shared/property/PropertyCard';
import type { PropertyHomes } from '@/types/propertyHomes';
import { useTranslations } from 'next-intl';

type Props = {
  items: PropertyHomes[];
  locale: string;
};

export function SimilarPropertiesCarousel({ items, locale }: Props) {
  const scrollerRef = React.useRef<HTMLDivElement>(null);
  const [isMobile, setIsMobile] = React.useState(false);

  React.useEffect(() => {
    const mq = window.matchMedia('(max-width: 639px)');
    const update = () => setIsMobile(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);

  const view = isMobile ? 'small' : 'large';
  const cardWidth = isMobile ? 240 : 360;

  const scrollByCards = (dir: -1 | 1) => {
    const el = scrollerRef.current;
    if (!el) return;
    el.scrollBy({ left: dir * cardWidth, behavior: 'smooth' });
  };

  const t = useTranslations('Home.topOffers');

  if (items.length === 0) return null;

  return (
    <div className="min-w-0">
      <div className="flex items-center justify-end gap-2 mb-4">
        <button
          type="button"
          onClick={() => scrollByCards(-1)}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-dark/10 dark:border-white/10 bg-white/70 dark:bg-dark/60 backdrop-blur-md shadow-sm hover:bg-white dark:hover:bg-dark transition-colors cursor-pointer"
          aria-label={t('prev')}
        >
          <Icon icon="solar:alt-arrow-left-linear" width={18} height={18} />
        </button>
        <button
          type="button"
          onClick={() => scrollByCards(1)}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-dark/10 dark:border-white/10 bg-white/70 dark:bg-dark/60 backdrop-blur-md shadow-sm hover:bg-white dark:hover:bg-dark transition-colors cursor-pointer"
          aria-label={t('next')}
        >
          <Icon icon="solar:alt-arrow-right-linear" width={18} height={18} />
        </button>
      </div>
      <div
        ref={scrollerRef}
        className={[
          'flex items-stretch gap-4 overflow-x-auto min-w-0 pb-3 pt-1',
          '-mx-2 sm:-mx-4 px-2 sm:px-4',
          'snap-x snap-mandatory scroll-px-2 sm:scroll-px-4',
          '[scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden',
        ].join(' ')}
      >
        {items.map((item, idx) => (
          <div
            key={item.slug ?? idx}
            className="snap-start shrink-0 min-w-0 w-[240px] sm:w-[300px] md:w-[360px] flex flex-col"
          >
            <PropertyCard
              item={item}
              locale={locale}
              view={view}
              fullClickable
              compactShowTitle={isMobile}
              singleImage={isMobile}
              fillHeight
            />
          </div>
        ))}
      </div>
    </div>
  );
}
