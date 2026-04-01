import { PortableText, type PortableTextComponents } from '@portabletext/react';
import type { PortableTextBlock } from '@portabletext/types';
import { getTranslations } from 'next-intl/server';

export type SeoTextData =
  | { content: unknown[] | string; isPlainText: boolean }
  | null;

const components: PortableTextComponents = {
  block: {
    h1: ({ children }) => (
      <h1 className="text-dark dark:text-white text-2xl sm:text-3xl lg:text-4xl font-medium leading-[1.25] mt-8 first:mt-0 mb-2">
        {children}
      </h1>
    ),
    h2: ({ children }) => (
      <h2 className="text-dark dark:text-white text-xl sm:text-2xl lg:text-3xl font-medium leading-[1.3] mt-6 first:mt-0 mb-1">
        {children}
      </h2>
    ),
    h3: ({ children }) => (
      <h3 className="text-dark dark:text-white text-lg sm:text-xl font-medium leading-tight mt-5 first:mt-0 mb-1">
        {children}
      </h3>
    ),
    normal: ({ children }) => (
      <p className="text-dark/75 dark:text-white/75 text-base sm:text-lg leading-[1.7] mt-4 first:mt-0">
        {children}
      </p>
    ),
  },
  list: {
    bullet: ({ children }) => (
      <ul className="mt-4 flex flex-col gap-2 list-none pl-0">{children}</ul>
    ),
  },
  listItem: {
    bullet: ({ children }) => (
      <li className="flex items-start gap-2.5 text-dark/75 dark:text-white/75 text-base sm:text-lg leading-[1.6]">
        <span className="w-2 h-2 rounded-full bg-primary shrink-0 mt-1.5" />
        {children}
      </li>
    ),
  },
};

const SeoText: React.FC<{ seoTextData?: SeoTextData }> = async ({ seoTextData }) => {
  const t = await getTranslations('Shared.seoText');
  const content = seoTextData?.content;
  const isPlainText = seoTextData?.isPlainText ?? false;

  const hasContent =
    content &&
    (isPlainText
      ? typeof content === "string" && (content as string).trim()
      : Array.isArray(content) && content.length > 0);

  const fallbackMsg = t('contentMissing');

  return (
    <section className="py-12 md:py-16">
      <div className="container max-w-8xl mx-auto px-5 2xl:px-0">
        <div className="max-w-3xl">
            {!hasContent ? (
              <p className="text-amber-600 dark:text-amber-400 text-sm font-medium bg-amber-50 dark:bg-amber-950/30 py-4 px-4 rounded-lg border border-amber-200 dark:border-amber-800">
                {fallbackMsg}
              </p>
            ) : isPlainText && typeof content === "string" ? (
              <p className="text-dark/75 dark:text-white/75 text-base sm:text-lg leading-[1.7] whitespace-pre-line">
                {content}
              </p>
            ) : (
              <PortableText
                value={((content as unknown[]) ?? []) as PortableTextBlock[]}
                components={components}
              />
            )}
        </div>
      </div>
    </section>
  );
};

export default SeoText;

