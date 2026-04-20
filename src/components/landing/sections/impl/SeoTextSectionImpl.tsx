import Link from 'next/link';
import { PortableText, type PortableTextComponents } from '@portabletext/react';
import type { PortableTextBlock } from '@portabletext/types';
import { Icon } from '@iconify/react';
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

function safeHttpUrl(url: string): string | null {
  try {
    const u = new URL(url);
    if (u.protocol !== 'http:' && u.protocol !== 'https:') return null;
    return url;
  } catch {
    return null;
  }
}

/** YouTube embed URL, or null to fall back to link / video element */
function youtubeEmbedFromUrl(url: string): string | null {
  try {
    const u = new URL(url);
    if (u.hostname === 'youtu.be') {
      const id = u.pathname.replace(/^\//, '').split('/')[0];
      return id ? `https://www.youtube.com/embed/${id}` : null;
    }
    if (u.hostname.includes('youtube.com')) {
      const v = u.searchParams.get('v');
      if (v) return `https://www.youtube.com/embed/${v}`;
      if (u.pathname.startsWith('/embed/')) return url;
      if (u.pathname.startsWith('/shorts/')) {
        const id = u.pathname.replace(/^\/shorts\//, '').split('/')[0];
        return id ? `https://www.youtube.com/embed/${id}` : null;
      }
    }
  } catch {
    return null;
  }
  return null;
}

function SeoTextVideo({ url }: { url: string }) {
  const safe = safeHttpUrl(url);
  if (!safe) return null;

  const yt = youtubeEmbedFromUrl(safe);
  if (yt) {
    return (
      <div className="relative mt-6 w-full aspect-video overflow-hidden rounded-xl border border-dark/10 dark:border-white/20">
        <iframe
          src={yt}
          title="Video"
          className="absolute inset-0 h-full w-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
        />
      </div>
    );
  }

  if (/\.(mp4|webm|ogg)(\?.*)?$/i.test(safe)) {
    return (
      <div className="relative mt-6 w-full aspect-video overflow-hidden rounded-xl border border-dark/10 dark:border-white/20 bg-black/5 dark:bg-white/5">
        <video controls className="h-full w-full object-contain" src={safe} />
      </div>
    );
  }

  return (
    <p className="mt-6">
      <a
        href={safe}
        target="_blank"
        rel="noopener noreferrer"
        className="text-primary underline underline-offset-2 hover:text-dark dark:hover:text-white"
      >
        {safe}
      </a>
    </p>
  );
}

function SeoTextCta({
  href,
  label,
  locale,
}: {
  href: string;
  label: string;
  locale: string;
}) {
  const className =
    'inline-flex items-center gap-2 rounded-full bg-primary px-7 py-3.5 text-base font-semibold text-white transition-colors duration-300 hover:bg-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2';
  const external = /^https?:\/\//i.test(href);
  if (external) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={`${className} mt-8`}>
        <span>{label}</span>
        <Icon icon="ph:arrow-right" width={18} height={18} aria-hidden />
      </a>
    );
  }
  const path = href.startsWith('/') ? `/${locale}${href}` : `/${locale}/${href.replace(/^\//, '')}`;
  return (
    <Link href={path} className={`${className} mt-8`}>
      <span>{label}</span>
      <Icon icon="ph:arrow-right" width={18} height={18} aria-hidden />
    </Link>
  );
}

/** Estimate rendered text length across plain-text or portable-text content. */
function estimateTextLength(content: unknown[] | string | undefined, isPlainText: boolean): number {
  if (isPlainText && typeof content === 'string') return content.trim().length;
  if (!Array.isArray(content)) return 0;
  let n = 0;
  for (const block of content) {
    if (!block || typeof block !== 'object') continue;
    const b = block as { _type?: string; style?: string; children?: Array<{ text?: string }> };
    if (b._type !== 'block') continue;
    for (const child of b.children ?? []) {
      if (typeof child?.text === 'string') n += child.text.length;
    }
  }
  return n;
}

/** True when content is portable-text but composed entirely of `normal` paragraph blocks. */
function isFlowingProse(content: unknown[] | string | undefined, isPlainText: boolean): boolean {
  if (isPlainText) return true;
  if (!Array.isArray(content)) return false;
  for (const block of content) {
    if (!block || typeof block !== 'object') continue;
    const b = block as { _type?: string; style?: string; listItem?: string };
    if (b._type !== 'block') return false;
    if (b.listItem) return false;
    if (b.style && b.style !== 'normal') return false;
  }
  return true;
}

/** Heuristic: long flowing prose reads better as 2 columns on desktop. */
function useTwoColumns(content: unknown[] | string | undefined, isPlainText: boolean): boolean {
  if (!isFlowingProse(content, isPlainText)) return false;
  return estimateTextLength(content, isPlainText) > 400;
}

const SeoText: React.FC<{
  locale: string;
  seoTextData?: SeoTextData;
  heading?: string;
  videoUrl?: string;
  cta?: { href: string; label: string };
}> = async ({ locale, seoTextData, heading, videoUrl, cta }) => {
  const t = await getTranslations('Shared.seoText');
  const content = seoTextData?.content;
  const isPlainText = seoTextData?.isPlainText ?? false;

  const hasContent =
    content &&
    (isPlainText
      ? typeof content === 'string' && (content as string).trim()
      : Array.isArray(content) && content.length > 0);

  const fallbackMsg = t('contentMissing');
  const showVideo = videoUrl && safeHttpUrl(videoUrl);
  const twoCols = useTwoColumns(content, isPlainText);

  return (
    <section className="py-16 md:py-24">
      <div className="container max-w-8xl mx-auto px-5 2xl:px-0">
        <div className="relative overflow-hidden rounded-3xl border border-dark/5 dark:border-white/10 bg-gradient-to-br from-dark/[0.03] via-transparent to-primary/[0.04] dark:from-white/[0.04] dark:via-transparent dark:to-primary/10 p-6 sm:p-10 md:p-14 lg:p-16">
          {/* Decorative accent bar */}
          <div
            aria-hidden
            className="absolute inset-y-10 left-0 w-1 rounded-r-full bg-primary hidden md:block"
          />
          {/* Decorative corner icon */}
          <div
            aria-hidden
            className="pointer-events-none absolute -top-4 -right-4 text-primary/10 dark:text-primary/20"
          >
            <Icon icon="ph:buildings-fill" width={180} height={180} />
          </div>

          <div className="relative max-w-5xl lg:max-w-6xl">
            {heading ? (
              <>
                <span
                  aria-hidden
                  className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary"
                >
                  <Icon icon="ph:house-simple-fill" width={20} height={20} />
                </span>
                <h2 className="mt-4 text-dark dark:text-white text-2xl sm:text-3xl lg:text-4xl xl:text-[44px] font-medium leading-[1.2]">
                  {heading}
                </h2>
              </>
            ) : (
              <span
                aria-hidden
                className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary"
              >
                <Icon icon="ph:house-simple-fill" width={20} height={20} />
              </span>
            )}

            {showVideo ? <SeoTextVideo url={videoUrl!} /> : null}

            {!hasContent ? (
              <p className="mt-6 text-amber-600 dark:text-amber-400 text-sm font-medium bg-amber-50 dark:bg-amber-950/30 py-4 px-4 rounded-lg border border-amber-200 dark:border-amber-800">
                {fallbackMsg}
              </p>
            ) : isPlainText && typeof content === 'string' ? (
              <div
                className={
                  twoCols
                    ? 'mt-6 text-dark/75 dark:text-white/75 text-base sm:text-lg leading-[1.75] whitespace-pre-line lg:columns-2 lg:gap-12'
                    : 'mt-6 text-dark/75 dark:text-white/75 text-base sm:text-lg leading-[1.75] whitespace-pre-line'
                }
              >
                <p>{content}</p>
              </div>
            ) : (
              <div className={twoCols ? 'mt-6 lg:columns-2 lg:gap-12 [&_p]:first:mt-0' : 'mt-6'}>
                <PortableText
                  value={((content as unknown[]) ?? []) as PortableTextBlock[]}
                  components={components}
                />
              </div>
            )}

            {cta ? <SeoTextCta href={cta.href} label={cta.label} locale={locale} /> : null}
          </div>
        </div>
      </div>
    </section>
  );
};

export default SeoText;
