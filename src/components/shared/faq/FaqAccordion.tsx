'use client';

import * as React from 'react';
import { Icon } from '@/components/shared/Icon';
import { cn } from '@/lib/utils';

export type FaqAccordionItem = {
  question: string;
  /** Rendered by the caller: plain text, Portable Text, links. */
  answer: React.ReactNode;
  tag?: string;
};

/**
 * The one FAQ list on the site. Every question is a card with a round
 * plus/cross, the open one tinted brand green; cards sit 12px apart so two
 * questions never run into each other.
 *
 * There were six FAQ renderings (this card list on landings, three default
 * Radix accordions on district, blog and tracker pages, a plain stack of
 * bold lines on listing pages, a question box on knowledge pages), and on the
 * listing pages question and answer ran together. This is the landing
 * version, which the audit of 2026-09-28 kept as the reference.
 *
 * Every answer is in the HTML, open or not: the page's FAQPage markup lists
 * all of them, and a closed panel that was not rendered at all left the
 * markup claiming text the page did not carry (audit 2026-09-25).
 */
export function FaqAccordion({
  items,
  defaultOpen = 0,
  idPrefix = 'faq',
  className,
}: {
  items: FaqAccordionItem[];
  /** Index open on load; -1 for none. */
  defaultOpen?: number;
  /** Unique per page when two lists share one. */
  idPrefix?: string;
  className?: string;
}) {
  const [openIdx, setOpenIdx] = React.useState<number>(defaultOpen);
  if (items.length === 0) return null;

  return (
    <div className={cn('flex flex-col gap-3 min-w-0', className)}>
      {items.map((item, i) => {
        const isOpen = openIdx === i;
        const panelId = `${idPrefix}-panel-${i}`;
        return (
          <div
            key={i}
            className={cn(
              'rounded-2xl transition-colors duration-300',
              isOpen
                ? 'bg-[#f4faf7] ring-1 ring-primary/25 dark:bg-white/[0.05] dark:ring-primary/30'
                : 'bg-white ring-1 ring-dark/[0.08] hover:ring-dark/15 dark:bg-transparent dark:ring-white/[0.08] dark:hover:ring-white/15',
            )}
          >
            <button
              type="button"
              onClick={() => setOpenIdx(isOpen ? -1 : i)}
              aria-expanded={isOpen}
              aria-controls={panelId}
              className="w-full flex items-center gap-4 px-5 py-5 text-left cursor-pointer focus:outline-none focus-visible:rounded-2xl focus-visible:ring-2 focus-visible:ring-primary/40"
            >
              <span
                className={cn(
                  'flex-1 min-w-0 text-base lg:text-lg font-semibold leading-snug',
                  isOpen ? 'text-primary' : 'text-dark dark:text-white',
                )}
              >
                {item.question}
              </span>
              <span
                aria-hidden
                className={cn(
                  'inline-flex shrink-0 h-9 w-9 items-center justify-center rounded-full transition-all duration-300',
                  isOpen
                    ? 'bg-primary text-white rotate-45'
                    : 'bg-dark/[0.06] text-dark/70 dark:bg-white/10 dark:text-white/80',
                )}
              >
                <Icon icon="ph:plus" width={16} height={16} />
              </span>
            </button>
            <div id={panelId} className="px-5 pb-6 -mt-1" hidden={!isOpen}>
              <div className="text-[15px] leading-relaxed text-dark/70 dark:text-white/70 [&_p+p]:mt-3 [&_a]:text-primary [&_a]:underline-offset-4 hover:[&_a]:underline">
                {item.answer}
              </div>
              {item.tag ? (
                <div className="mt-4 flex items-center gap-2 text-xs">
                  <span className="inline-flex items-center gap-1 rounded-full bg-primary/12 text-primary px-2.5 py-1 font-medium">
                    {item.tag}
                  </span>
                </div>
              ) : null}
            </div>
          </div>
        );
      })}
    </div>
  );
}
