'use client';

import * as React from 'react';
import { useTranslations } from 'next-intl';
import { PortableText } from '@portabletext/react';
import type { PortableTextBlock } from '@portabletext/types';
import { Icon } from "@/components/shared/Icon";
import { resolveLocaleHref } from '@/lib/routes/resolveLocaleHref';
import { brandButtonClass } from '@/components/shared/BrandButton';
import { FaqAccordion } from '@/components/shared/faq/FaqAccordion';
import { cn } from '@/lib/utils';
import {
  CONTAINER,
  PANEL,
  SECTION_LEAD,
  SECTION_TITLE,
  SECTION_Y,
  SPLIT,
  SPLIT_ASIDE,
  SPLIT_MAIN,
} from '@/components/shared/layout';

export type FaqItem = {
  question: string;
  answer: string | PortableTextBlock[] | null | undefined;
  tag?: string;
};

export type FaqCallout = {
  title?: string;
  subtitle?: string;
  primary?: { label: string; href: string };
  secondary?: { label: string; href: string; icon?: string };
};

export type FaqData = {
  title?: string;
  subtitle?: string;
  items: FaqItem[];
  imageMode?: 'withImage' | 'withoutImage';
  callout?: FaqCallout;
} | null;

type Props = {
  faqData?: FaqData | null;
  locale?: string;
};

function defaultAnswerNode(answer: FaqItem['answer']): React.ReactNode {
  if (typeof answer === 'string') {
    return <span className="whitespace-pre-line">{answer}</span>;
  }
  if (Array.isArray(answer)) {
    return <PortableText value={answer} />;
  }
  return null;
}

function CalloutSecondaryLink({
  href,
  label,
  iconKey,
}: {
  href: string;
  label: string;
  iconKey?: string;
}) {
  const icon = iconKey ? `ph:${iconKey}` : null;
  return (
    <a
      href={href}
      target={href.startsWith('http') ? '_blank' : undefined}
      rel={href.startsWith('http') ? 'noopener noreferrer' : undefined}
      className={brandButtonClass('secondary', undefined, 'sm')}
    >
      {icon ? <Icon icon={icon} width={14} height={14} /> : null}
      {label}
    </a>
  );
}

const FAQ: React.FC<Props> = ({ faqData, locale = 'en' }) => {
  const t = useTranslations('Home.faq');
  const hasItems = Boolean(faqData?.items?.length);
  const title = faqData?.title?.trim() || t('title');
  // The stock subtitle ("We know that buying, selling, or investing…") only
  // goes with the stock placeholder questions. Under a page's real questions
  // it read as template filler on every guide and district.
  const subtitle = faqData?.subtitle?.trim() || (hasItems ? '' : t('description'));

  const items: FaqItem[] = hasItems
    ? faqData!.items
    : [
        { question: t('q1'), answer: t('answer') },
        { question: t('q2'), answer: t('answer') },
        { question: t('q3'), answer: t('answer') },
      ];

  const callout = faqData?.callout;
  const hasCallout = Boolean(
    callout && (callout.title || callout.subtitle || callout.primary || callout.secondary),
  );

  return (
    <section id="faqs" className={SECTION_Y}>
      <div className={CONTAINER}>
        <div className={SPLIT}>
          <div className={cn(SPLIT_ASIDE, 'lg:sticky lg:top-28 lg:self-start')}>
            <h2 className={SECTION_TITLE}>{title}</h2>
            {subtitle ? <p className={cn(SECTION_LEAD, 'mt-4')}>{subtitle}</p> : null}

            {hasCallout ? (
              <div className={cn(PANEL, 'mt-8 p-6')}>
                <div className="flex items-center gap-3">
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-primary/15 text-primary">
                    <Icon icon="ph:chat-circle-dots-fill" width={20} height={20} />
                  </span>
                  <div className="min-w-0">
                    {callout?.title ? (
                      <p className="text-sm font-semibold text-dark dark:text-white">
                        {callout.title}
                      </p>
                    ) : null}
                    {callout?.subtitle ? (
                      <p className="text-xs text-dark/55 dark:text-white/55">
                        {callout.subtitle}
                      </p>
                    ) : null}
                  </div>
                </div>
                {(callout?.primary || callout?.secondary) ? (
                  <div className="mt-5 flex flex-wrap gap-2">
                    {callout?.primary ? (
                      <a
                        href={resolveLocaleHref(callout.primary.href, locale)}
                        className={brandButtonClass('primary', undefined, 'md')}
                      >
                        {callout.primary.label}
                      </a>
                    ) : null}
                    {callout?.secondary ? (
                      <CalloutSecondaryLink
                        href={resolveLocaleHref(callout.secondary.href, locale)}
                        label={callout.secondary.label}
                        iconKey={callout.secondary.icon}
                      />
                    ) : null}
                  </div>
                ) : null}
              </div>
            ) : null}
          </div>

          <FaqAccordion
            className={SPLIT_MAIN}
            items={items.map((item) => ({
              question: item.question,
              answer: defaultAnswerNode(item.answer),
              tag: item.tag,
            }))}
          />
        </div>
      </div>
    </section>
  );
};

export default FAQ;
