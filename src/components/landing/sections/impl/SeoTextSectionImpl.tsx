import Link from 'next/link';
import Image from 'next/image';
import { PortableText, type PortableTextComponents } from '@portabletext/react';
import type { PortableTextBlock } from '@portabletext/types';
import { Icon } from '@iconify/react';
import { getTranslations } from 'next-intl/server';

export type SeoTextData =
  | { content: unknown[] | string; isPlainText: boolean }
  | null;

export type SeoStat = { value: string; label: string };
export type SeoAuthor = {
  name?: string;
  role?: string;
  initials?: string;
  avatarUrl?: string;
};
export type SeoPullQuote = { text: string; author?: string };

const READ_LABEL_BY_LOCALE: Record<string, string> = {
  en: 'min read',
  uk: 'хв читання',
  ru: 'мин чтения',
  sq: 'min lexim',
  it: 'min di lettura',
  pl: 'min czytania',
};

const portableComponents: PortableTextComponents = {
  block: {
    h1: ({ children }) => (
      <h1 className="text-dark dark:text-white text-3xl sm:text-4xl font-medium leading-[1.2] mt-10 first:mt-0 mb-3">
        {children}
      </h1>
    ),
    h2: ({ children }) => (
      <h2 className="text-dark dark:text-white text-2xl lg:text-[28px] font-semibold tracking-tight leading-[1.25] mt-10 first:mt-0 mb-2">
        {children}
      </h2>
    ),
    h3: ({ children }) => (
      <h3 className="text-dark dark:text-white text-xl lg:text-2xl font-semibold leading-tight mt-8 first:mt-0 mb-1">
        {children}
      </h3>
    ),
    normal: ({ children }) => (
      <p className="text-dark/72 dark:text-white/72 text-[17px] leading-relaxed mt-5 first:mt-0">
        {children}
      </p>
    ),
  },
  list: {
    bullet: ({ children }) => (
      <ul className="mt-5 flex flex-col gap-2.5 list-none pl-0">{children}</ul>
    ),
  },
  listItem: {
    bullet: ({ children }) => (
      <li className="flex items-start gap-3 text-dark/72 dark:text-white/72 text-[17px] leading-relaxed">
        <span className="mt-2 inline-block h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
        <span>{children}</span>
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

function SeoTextVideo({ url, title }: { url: string; title: string }) {
  const safe = safeHttpUrl(url);
  if (!safe) return null;
  const yt = youtubeEmbedFromUrl(safe);
  if (yt) {
    return (
      <div className="relative my-10 w-full aspect-video overflow-hidden rounded-2xl border border-dark/10 dark:border-white/15">
        <iframe
          src={yt}
          title={title}
          className="absolute inset-0 h-full w-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
        />
      </div>
    );
  }
  if (/\.(mp4|webm|ogg)(\?.*)?$/i.test(safe)) {
    return (
      <div className="relative my-10 w-full aspect-video overflow-hidden rounded-2xl border border-dark/10 dark:border-white/15 bg-black/5 dark:bg-white/5">
        <video controls className="h-full w-full object-contain" src={safe} />
      </div>
    );
  }
  return (
    <p className="my-6">
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

function SeoTextCta({ href, label, locale }: { href: string; label: string; locale: string }) {
  const className =
    'inline-flex items-center gap-2 rounded-full bg-primary px-7 py-3 text-base font-semibold text-white transition-colors duration-300 hover:bg-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2';
  const external = /^https?:\/\//i.test(href);
  if (external) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={className}>
        <span>{label}</span>
        <Icon icon="ph:arrow-right" width={18} height={18} aria-hidden />
      </a>
    );
  }
  const path = href.startsWith('/') ? `/${locale}${href}` : `/${locale}/${href.replace(/^\//, '')}`;
  return (
    <Link href={path} className={className}>
      <span>{label}</span>
      <Icon icon="ph:arrow-right" width={18} height={18} aria-hidden />
    </Link>
  );
}

function estimateTextLength(content: unknown[] | string | undefined, isPlainText: boolean): number {
  if (isPlainText && typeof content === 'string') return content.trim().length;
  if (!Array.isArray(content)) return 0;
  let n = 0;
  for (const block of content) {
    if (!block || typeof block !== 'object') continue;
    const b = block as { _type?: string; children?: Array<{ text?: string }> };
    if (b._type !== 'block') continue;
    for (const child of b.children ?? []) {
      if (typeof child?.text === 'string') n += child.text.length;
    }
  }
  return n;
}

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

function shouldUseTwoColumns(content: unknown[] | string | undefined, isPlainText: boolean): boolean {
  if (!isFlowingProse(content, isPlainText)) return false;
  return estimateTextLength(content, isPlainText) > 600;
}

/**
 * Pull every text fragment out of a portable-text block array into one string.
 * Blocks are joined with double newline so existing block boundaries survive
 * downstream paragraph splitting.
 */
function extractPlainTextFromBlocks(content: unknown[] | string | undefined): string {
  if (!Array.isArray(content)) return '';
  const out: string[] = [];
  for (const block of content) {
    if (!block || typeof block !== 'object') continue;
    const b = block as { _type?: string; children?: Array<{ text?: string }> };
    if (b._type !== 'block') continue;
    const text = (b.children ?? [])
      .map((c) => (typeof c?.text === 'string' ? c.text : ''))
      .join('');
    if (text.trim()) out.push(text);
  }
  return out.join('\n\n');
}

/**
 * Split a plain-text body into readable paragraphs.
 * - If it already has blank-line separators, use them.
 * - Otherwise group sentences (~3 per paragraph) by splitting on ". " /
 *   ".  " boundaries while keeping the trailing period.
 */
function splitPlainTextParagraphs(text: string): string[] {
  const trimmed = text.trim();
  if (!trimmed) return [];
  const byBlankLines = trimmed.split(/\n{2,}/).map((s) => s.trim()).filter(Boolean);
  if (byBlankLines.length > 1) return byBlankLines;

  // Split into sentences. Keep period via lookbehind.
  const sentences = trimmed
    .split(/(?<=[.!?])\s+(?=[A-ZА-ЯІЇЄҐ«"„])/u)
    .map((s) => s.trim())
    .filter(Boolean);
  if (sentences.length <= 3) return [trimmed];

  const GROUP_SIZE = 3;
  const out: string[] = [];
  for (let i = 0; i < sentences.length; i += GROUP_SIZE) {
    out.push(sentences.slice(i, i + GROUP_SIZE).join(' '));
  }
  return out;
}

const SeoText: React.FC<{
  locale: string;
  seoTextData?: SeoTextData;
  heading?: string;
  videoUrl?: string;
  cta?: { href: string; label: string };
  category?: string;
  readingTimeMinutes?: number;
  author?: SeoAuthor;
  stats?: SeoStat[];
  pullQuote?: SeoPullQuote;
}> = async ({
  locale,
  seoTextData,
  heading,
  videoUrl,
  cta,
  category,
  readingTimeMinutes,
  author,
  stats,
  pullQuote,
}) => {
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
  const twoCols = shouldUseTwoColumns(content, isPlainText);
  // Flowing prose (only `normal` paragraphs, no headings/lists) — render as
  // plain text so we control paragraph splitting and lead-paragraph styling.
  const flowing = isFlowingProse(content, isPlainText);
  const plainBody: string | null = isPlainText && typeof content === 'string'
    ? content
    : flowing
      ? extractPlainTextFromBlocks(content)
      : null;
  const renderAsPlain = Boolean(plainBody && plainBody.trim());

  const showAuthor = Boolean(
    author && (author.name || author.role || author.initials || author.avatarUrl),
  );
  const showStats = Array.isArray(stats) && stats.length > 0;
  const showHeader = Boolean(category || readingTimeMinutes);
  const readLabel = READ_LABEL_BY_LOCALE[locale] ?? READ_LABEL_BY_LOCALE.en;

  return (
    <section className="py-16 md:py-24">
      <div className="container mx-auto max-w-4xl px-5 2xl:px-0">
        {/* Header chip strip */}
        {showHeader ? (
          <div className="flex items-center gap-3 text-xs">
            {category ? (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/12 text-primary px-3 py-1 font-semibold tracking-wide">
                <Icon icon="ph:house-simple-fill" width={12} height={12} aria-hidden />
                {category}
              </span>
            ) : null}
            {readingTimeMinutes ? (
              <span className="text-dark/45 dark:text-white/45">
                {category ? '· ' : ''}
                {readingTimeMinutes} {readLabel}
              </span>
            ) : null}
          </div>
        ) : null}

        {heading ? (
          <h2 className="mt-5 text-3xl sm:text-4xl lg:text-[44px] xl:text-[56px] font-medium leading-[1.04] tracking-tight text-dark dark:text-white">
            {heading}
          </h2>
        ) : null}

        {/* Author byline */}
        {showAuthor ? (
          <div className="mt-7 mb-10 flex items-center gap-3 pb-7 border-b border-dark/10 dark:border-white/10">
            {author?.avatarUrl ? (
              <Image
                src={author.avatarUrl}
                alt={author.name || 'Author'}
                width={40}
                height={40}
                className="h-10 w-10 rounded-full ring-1 ring-primary/40 object-cover"
                unoptimized={author.avatarUrl.startsWith('http')}
              />
            ) : author?.initials ? (
              <div className="h-10 w-10 rounded-full bg-primary/20 ring-1 ring-primary/40 flex items-center justify-center">
                <span className="text-primary font-semibold text-sm">{author.initials}</span>
              </div>
            ) : null}
            {author?.name || author?.role ? (
              <div className="min-w-0">
                {author?.name ? (
                  <p className="text-sm font-semibold text-dark dark:text-white truncate">{author.name}</p>
                ) : null}
                {author?.role ? (
                  <p className="text-xs text-dark/55 dark:text-white/55 truncate">{author.role}</p>
                ) : null}
              </div>
            ) : null}
          </div>
        ) : null}

        {/* Stat strip */}
        {showStats ? (
          <div
            className={
              'grid gap-4 mb-10 rounded-2xl p-5 bg-[#f7f6f3] ring-1 ring-dark/[0.05] dark:bg-white/[0.04] dark:ring-white/[0.06] ' +
              (stats!.length === 1 ? 'grid-cols-1' : stats!.length === 2 ? 'grid-cols-2' : 'grid-cols-3')
            }
          >
            {stats!.map((s, i) => (
              <div
                key={i}
                className={
                  i > 0 ? 'border-l border-dark/10 dark:border-white/10 pl-4' : ''
                }
              >
                <p className="text-primary text-2xl lg:text-3xl font-semibold">{s.value}</p>
                <p className="mt-1 text-xs text-dark/55 dark:text-white/55">{s.label}</p>
              </div>
            ))}
          </div>
        ) : null}

        {/* Video (when set) */}
        {showVideo ? <SeoTextVideo url={videoUrl!} title={t('videoTitle')} /> : null}

        {/* Body */}
        <article
          className={
            // When nothing else (no header / heading / author / stats / video) sits above
            // the body, wrap the prose in a soft branded card so it doesn't read as a
            // raw wall of text.
            !showHeader && !heading && !showAuthor && !showStats && !showVideo
              ? 'relative overflow-hidden rounded-3xl border border-dark/5 dark:border-white/10 bg-gradient-to-br from-dark/[0.02] via-transparent to-primary/[0.04] dark:from-white/[0.03] dark:via-transparent dark:to-primary/10 p-6 sm:p-10 lg:p-12'
              : ''
          }
        >
          {!showHeader && !heading && !showAuthor && !showStats && !showVideo ? (
            <>
              <div
                aria-hidden
                className="absolute inset-y-10 left-0 w-1 rounded-r-full bg-primary hidden md:block"
              />
              <div
                aria-hidden
                className="pointer-events-none absolute -top-6 -right-6 text-primary/10 dark:text-primary/20"
              >
                <Icon icon="ph:buildings-fill" width={140} height={140} />
              </div>
              <span
                aria-hidden
                className="relative inline-flex h-10 w-10 items-center justify-center rounded-full bg-primary/15 text-primary mb-5"
              >
                <Icon icon="ph:house-simple-fill" width={20} height={20} />
              </span>
            </>
          ) : null}

          {!hasContent ? (
            <p className="text-amber-600 dark:text-amber-400 text-sm font-medium bg-amber-50 dark:bg-amber-950/30 py-4 px-4 rounded-lg border border-amber-200 dark:border-amber-800">
              {fallbackMsg}
            </p>
          ) : renderAsPlain ? (
            (() => {
              const paragraphs = splitPlainTextParagraphs(plainBody!);
              if (paragraphs.length === 0) return null;
              return (
                <div className="relative">
                  {/* Lead paragraph — larger, dark-toned, sets the editorial rhythm */}
                  <p className="text-dark dark:text-white text-lg sm:text-xl leading-[1.55] font-medium first-letter:text-primary first-letter:text-[2.4em] first-letter:font-semibold first-letter:float-left first-letter:mr-2 first-letter:leading-none first-letter:mt-1">
                    {paragraphs[0]}
                  </p>
                  {paragraphs.length > 1 ? (
                    <div
                      className={
                        'relative mt-6 ' +
                        (twoCols
                          ? 'lg:columns-2 lg:gap-12 [&>p]:break-inside-avoid'
                          : '')
                      }
                    >
                      {paragraphs.slice(1).map((para, i) => (
                        <p
                          key={i}
                          className="text-dark/72 dark:text-white/72 text-[17px] leading-relaxed mt-5 first:mt-0"
                        >
                          {para}
                        </p>
                      ))}
                    </div>
                  ) : null}
                </div>
              );
            })()
          ) : (
            <div className={twoCols ? 'lg:columns-2 lg:gap-12 [&_p]:break-inside-avoid' : ''}>
              <PortableText
                value={((content as unknown[]) ?? []) as PortableTextBlock[]}
                components={portableComponents}
              />
            </div>
          )}
        </article>

        {/* Pull quote */}
        {pullQuote ? (
          <blockquote className="my-10 relative pl-6 border-l-2 border-primary">
            <p className="text-2xl lg:text-[26px] font-medium leading-snug text-dark dark:text-white">
              «{pullQuote.text}»
            </p>
            {pullQuote.author ? (
              <footer className="mt-3 text-sm text-dark/55 dark:text-white/55">— {pullQuote.author}</footer>
            ) : null}
          </blockquote>
        ) : null}

        {/* Footer CTA */}
        {cta ? (
          <div className="mt-10 flex flex-col sm:flex-row items-start sm:items-center gap-4 pt-8 border-t border-dark/10 dark:border-white/10">
            <SeoTextCta href={cta.href} label={cta.label} locale={locale} />
          </div>
        ) : null}
      </div>
    </section>
  );
};

export default SeoText;
