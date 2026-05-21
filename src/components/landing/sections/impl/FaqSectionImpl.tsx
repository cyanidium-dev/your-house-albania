'use client';

import * as React from 'react';
import { useTranslations } from 'next-intl';
import { PortableText } from '@portabletext/react';
import type { PortableTextBlock } from '@portabletext/types';
import { Icon } from '@iconify/react';
import { resolveLocaleHref } from '@/lib/routes/resolveLocaleHref';

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
      className="inline-flex items-center justify-center gap-2 h-11 px-5 rounded-full text-sm font-semibold transition-colors
                 text-dark/70 hover:text-dark ring-1 ring-dark/15 hover:ring-dark/40
                 dark:text-white/80 dark:hover:text-white dark:ring-white/15 dark:hover:ring-white/40"
    >
      {icon ? <Icon icon={icon} width={14} height={14} /> : null}
      {label}
    </a>
  );
}

const FAQ: React.FC<Props> = ({ faqData, locale = 'en' }) => {
  const t = useTranslations('Home.faq');
  const title = faqData?.title?.trim() || t('title');
  const subtitle = faqData?.subtitle?.trim() || t('description');
  const eyebrow = t('badge');

  const items: FaqItem[] = faqData?.items?.length
    ? faqData.items
    : [
        { question: t('q1'), answer: t('answer') },
        { question: t('q2'), answer: t('answer') },
        { question: t('q3'), answer: t('answer') },
      ];

  // Open the first item with content by default.
  const [openIdx, setOpenIdx] = React.useState<number>(0);
  const callout = faqData?.callout;
  const hasCallout = Boolean(
    callout && (callout.title || callout.subtitle || callout.primary || callout.secondary),
  );

  return (
    <section id="faqs" className="relative overflow-hidden py-16 md:py-24">
      <div className="container max-w-8xl mx-auto px-5 2xl:px-0">
        <div className="grid lg:grid-cols-[minmax(0,420px)_1fr] gap-10 lg:gap-16 items-start">
          {/* Left — sticky brand card */}
          <div className="lg:sticky lg:top-8 min-w-0">
            <p className="text-dark/75 dark:text-white/75 text-base font-semibold flex items-center gap-2">
              <Icon
                icon="ph:house-simple-fill"
                className="text-2xl text-primary shrink-0"
                aria-hidden
              />
              {eyebrow}
            </p>
            <h2 className="mt-4 text-3xl sm:text-4xl lg:text-[44px] font-medium leading-[1.1] tracking-tight text-dark dark:text-white">
              {title}
            </h2>
            {subtitle ? (
              <p className="mt-4 text-base sm:text-lg leading-snug text-dark/65 dark:text-white/65">
                {subtitle}
              </p>
            ) : null}

            {hasCallout ? (
              <div className="mt-8 rounded-2xl p-6 ring-1 bg-[#f7f6f3] ring-dark/[0.06] dark:bg-white/[0.04] dark:ring-white/10">
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
                        className="inline-flex items-center justify-center gap-2 h-11 px-5 rounded-full text-sm font-semibold bg-primary text-white hover:bg-dark transition-colors"
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

          {/* Right — accordion */}
          <div className="flex flex-col gap-3 min-w-0">
            {items.map((item, i) => {
              const isOpen = openIdx === i;
              const panelId = `faq-panel-${i}`;
              return (
                <div
                  key={i}
                  className={
                    'rounded-2xl transition-all duration-300 ' +
                    (isOpen
                      ? 'bg-[#f4faf7] ring-1 ring-primary/25 dark:bg-white/[0.05] dark:ring-primary/30'
                      : 'bg-white ring-1 ring-dark/[0.08] hover:ring-dark/15 dark:bg-transparent dark:ring-white/[0.08] dark:hover:ring-white/15')
                  }
                >
                  <button
                    type="button"
                    onClick={() => setOpenIdx(isOpen ? -1 : i)}
                    aria-expanded={isOpen}
                    aria-controls={panelId}
                    className="w-full flex items-center gap-4 px-5 py-5 text-left cursor-pointer focus:outline-none focus-visible:rounded-2xl focus-visible:ring-2 focus-visible:ring-primary/40"
                  >
                    <span
                      className={
                        'flex-1 text-base lg:text-lg font-semibold leading-snug min-w-0 ' +
                        (isOpen ? 'text-primary' : 'text-dark dark:text-white')
                      }
                    >
                      {item.question}
                    </span>
                    <span
                      aria-hidden
                      className={
                        'inline-flex shrink-0 h-9 w-9 items-center justify-center rounded-full transition-all duration-300 ' +
                        (isOpen
                          ? 'bg-primary text-white rotate-45'
                          : 'bg-dark/[0.06] text-dark/70 dark:bg-white/10 dark:text-white/80')
                      }
                    >
                      <Icon icon="ph:plus" width={16} height={16} />
                    </span>
                  </button>
                  {isOpen ? (
                    <div id={panelId} className="px-5 pb-6 -mt-1">
                      <div className="text-[15px] leading-relaxed text-dark/70 dark:text-white/70">
                        {defaultAnswerNode(item.answer)}
                      </div>
                      {item.tag ? (
                        <div className="mt-4 flex items-center gap-2 text-xs">
                          <span className="inline-flex items-center gap-1 rounded-full bg-primary/12 text-primary px-2.5 py-1 font-medium">
                            {item.tag}
                          </span>
                        </div>
                      ) : null}
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};

export default FAQ;
