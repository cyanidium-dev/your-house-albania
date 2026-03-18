import { PortableText, type PortableTextComponents } from '@portabletext/react';
import type { PortableTextBlock } from '@portabletext/types';

export type SeoTextData =
  | { content: unknown[] | string; isPlainText: boolean }
  | null;

const components: PortableTextComponents = {
  block: {
    h1: ({ children }) => (
      <h1 className="text-dark dark:text-white lg:text-52 text-40 font-medium leading-[1.2] mt-10 first:mt-0">
        {children}
      </h1>
    ),
    h2: ({ children }) => (
      <h2 className="text-dark dark:text-white lg:text-40 text-3xl font-medium leading-[1.2] mt-10 first:mt-0">
        {children}
      </h2>
    ),
    h3: ({ children }) => (
      <h3 className="text-dark dark:text-white text-2xl font-medium leading-tight mt-8 first:mt-0">
        {children}
      </h3>
    ),
    normal: ({ children }) => (
      <p className="text-dark/75 dark:text-white/75 text-base leading-relaxed mt-4 first:mt-0">
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
      <li className="flex items-start gap-2 text-dark/75 dark:text-white/75 text-base">
        <span className="w-2 h-2 rounded-full bg-primary shrink-0 mt-1.5" />
        {children}
      </li>
    ),
  },
};

const FALLBACK_MSG = "SEO текст не пришел";

const SeoText: React.FC<{ seoTextData?: SeoTextData }> = ({ seoTextData }) => {
  const content = seoTextData?.content;
  const isPlainText = seoTextData?.isPlainText ?? false;

  const hasContent =
    content &&
    (isPlainText
      ? typeof content === "string" && (content as string).trim()
      : Array.isArray(content) && content.length > 0);

  return (
    <section className="py-16 md:py-24">
      <div className="container max-w-8xl mx-auto px-5 2xl:px-0">
        <div className="flex justify-center">
          <div className="max-w-3xl w-full py-12 md:py-16">
            {!hasContent ? (
              <p className="text-amber-600 dark:text-amber-400 text-sm font-medium bg-amber-50 dark:bg-amber-950/30 py-4 px-4 rounded-lg border border-amber-200 dark:border-amber-800">
                {FALLBACK_MSG}
              </p>
            ) : isPlainText && typeof content === "string" ? (
              <div className="space-y-4">
                {content
                  .split(/\n\n+/)
                  .map((p) => p.trim())
                  .filter(Boolean)
                  .map((para, i) => (
                    <p
                      key={i}
                      className="text-dark/75 dark:text-white/75 text-base leading-relaxed"
                    >
                      {para}
                    </p>
                  ))}
              </div>
            ) : (
              <PortableText
                value={((content as unknown[]) ?? []) as PortableTextBlock[]}
                components={components}
              />
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export default SeoText;

