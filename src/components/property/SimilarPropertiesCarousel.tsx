'use client';

import * as React from 'react';
import { CarouselArrowButton } from '@/components/shared/CarouselArrow';
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
        <CarouselArrowButton direction="prev" onClick={() => scrollByCards(-1)} label={t('prev')} />
        <CarouselArrowButton direction="next" onClick={() => scrollByCards(1)} label={t('next')} />
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
              singleImage={isMobile}
              fillHeight
            />
          </div>
        ))}
      </div>
    </div>
  );
}
