import Link from "@/components/shared/Link";
import Image from 'next/image';
import { PortableText, type PortableTextComponents } from '@portabletext/react';
import type { PortableTextBlock } from '@portabletext/types';
import { Icon } from "@/components/shared/Icon";
import { getTranslations } from 'next-intl/server';
import { resolveLocaleHref } from '@/lib/routes/resolveLocaleHref';
import { brandButtonClass } from '@/components/shared/BrandButton';
import { cn } from '@/lib/utils';
import {
  BODY_TEXT,
  CONTAINER,
  MEASURE,
  PANEL,
  SECTION_TITLE,
  SECTION_Y,
  SPLIT,
  SPLIT_ASIDE,
  SPLIT_MAIN,
} from '@/components/shared/layout';

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
  de: 'Min. Lesezeit',
};

/**
 * Portable Text renderers for the SEO block.
 *
 * Built per locale because of `marks.link`: this component had no link handler
 * at all, so `@portabletext/react` fell back to emitting the stored href
 * verbatim. Editors store internal links without a locale — `/sale`,
 * `/guides/ile-kosztuje-dom-w-albanii` — and the middleware then 307s every
 * one of them to the default locale, which is both a wasted hop and the wrong
 * language: 33 links in the Ahrefs crawl of 2026-09-10, all of them inside the
 * Polish guides, all landing on `sq`. `resolveLocaleHref` is the same resolver
 * the blog article renderer uses, and it also strips a locale an editor pasted
 * in so a Russian page never links to `/ru/en/...`.
 */
function portableComponentsFor(locale: string): PortableTextComponents {
  return {
    ...portableBlockComponents,
    marks: {
      link: ({ children, value }) => {
        const raw = typeof (value as { href?: unknown })?.href === 'string'
          ? ((value as { href: string }).href)
          : '';
        const href = resolveLocaleHref(raw, locale);
        const isExternal = href.startsWith('http://') || href.startsWith('https://');
        return (
          <Link
            href={href}
            className="text-primary underline underline-offset-2 hover:text-dark dark:hover:text-white"
            target={isExternal ? '_blank' : undefined}
            rel={isExternal ? 'noopener noreferrer' : undefined}
          >
            {children}
          </Link>
        );
      },
    },
  };
}

const portableBlockComponents: PortableTextComponents = {
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
  const className = brandButtonClass('primary', undefined, 'md');
  const external = /^https?:\/\//i.test(href);
  if (external) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={className}>
        <span>{label}</span>
        <Icon icon="ph:arrow-right" width={18} height={18} aria-hidden />
      </a>
    );
  }
  // Same resolver as the body links: prefixing blindly turned an href an
  // editor pasted from the live site (`/en/catalog`) into `/ru/en/catalog`.
  const path = resolveLocaleHref(href, locale);
  return (
    <Link href={path} className={className}>
      <span>{label}</span>
      <Icon icon="ph:arrow-right" width={18} height={18} aria-hidden />
    </Link>
  );
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
  /**
   * `h1` on pages that open with this section and have no hero — the legal
   * pages, which otherwise rendered no `<h1>` at all. Default `h2`.
   */
  headingAs?: 'h1' | 'h2';
  videoUrl?: string;
  cta?: { href: string; label: string };
  category?: string;
  readingTimeMinutes?: number;
  author?: SeoAuthor;
  stats?: SeoStat[];
  pullQuote?: SeoPullQuote;
  /** Optional photograph of the place the copy is about. */
  imageUrl?: string;
  imageAlt?: string;
}> = async ({
  locale,
  seoTextData,
  heading,
  headingAs,
  videoUrl,
  cta,
  category,
  readingTimeMinutes,
  author,
  stats,
  pullQuote,
  imageUrl,
  imageAlt,
}) => {
  const t = await getTranslations('Shared.seoText');
  const HeadingTag = headingAs === 'h1' ? 'h1' : 'h2';
  const content = seoTextData?.content;
  const isPlainText = seoTextData?.isPlainText ?? false;

  const hasContent =
    content &&
    (isPlainText
      ? typeof content === 'string' && (content as string).trim()
      : Array.isArray(content) && content.length > 0);

  const fallbackMsg = t('contentMissing');
  const showVideo = videoUrl && safeHttpUrl(videoUrl);
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
  const photo = imageUrl?.trim() ? imageUrl.trim() : null;

  // Editorial split: the heading (and the photograph or figures that belong
  // to it) on the narrow side, the text on the wide side at a reading measure.
  // The block used to sit in a centred 896px box of its own, so it started
  // 250px to the right of every section around it, and long plain text broke
  // into two CSS columns that never balanced — one sentence alone at the top
  // of the second column on /durres/info.
  const hasAside = Boolean(heading || showHeader || showAuthor || photo || showStats);

  const aside = hasAside ? (
    <div className={cn(SPLIT_ASIDE, 'lg:sticky lg:top-28 lg:self-start')}>
      {showHeader ? (
        <div className="mb-4 flex items-center gap-3 text-xs">
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

      {heading ? <HeadingTag className={SECTION_TITLE}>{heading}</HeadingTag> : null}

      {showAuthor ? (
        <div className="mt-6 flex items-center gap-3">
          {author?.avatarUrl ? (
            <Image
              src={author.avatarUrl}
              alt={author.name || 'Author'}
              width={40}
              height={40}
              className="h-10 w-10 rounded-full ring-1 ring-primary/40 object-cover"
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

      {photo ? (
        <figure
          className={cn(
            'relative aspect-[16/10] lg:aspect-[4/3] overflow-hidden rounded-3xl bg-dark/5 dark:bg-white/5',
            heading || showAuthor || showHeader ? 'mt-8' : '',
          )}
        >
          <Image
            src={photo}
            alt={imageAlt || heading || ''}
            fill
            sizes="(max-width: 1023px) 100vw, 560px"
            className="object-cover object-center"
          />
        </figure>
      ) : null}

      {showStats ? (
        <dl
          className={cn(
            PANEL,
            'mt-8 grid gap-5 p-6',
            stats!.length === 1 ? 'grid-cols-1' : stats!.length === 2 ? 'grid-cols-2' : 'grid-cols-3',
          )}
        >
          {stats!.map((s, i) => (
            <div key={i} className={i > 0 ? 'border-l border-dark/10 dark:border-white/10 pl-5' : ''}>
              <dd className="text-primary text-2xl lg:text-3xl font-semibold tabular-nums">{s.value}</dd>
              <dt className="mt-1 text-xs text-dark/55 dark:text-white/55">{s.label}</dt>
            </div>
          ))}
        </dl>
      ) : null}
    </div>
  ) : null;

  const body = !hasContent ? (
    <p className="text-amber-600 dark:text-amber-400 text-sm font-medium bg-amber-50 dark:bg-amber-950/30 py-4 px-4 rounded-lg border border-amber-200 dark:border-amber-800">
      {fallbackMsg}
    </p>
  ) : renderAsPlain ? (
    (() => {
      const paragraphs = splitPlainTextParagraphs(plainBody!);
      if (paragraphs.length === 0) return null;
      return (
        <>
          {/* Lead paragraph: larger and full-contrast, sets the rhythm. */}
          <p className="text-dark dark:text-white text-[17px] leading-[1.65] sm:text-xl sm:leading-[1.55] sm:font-medium">
            {paragraphs[0]}
          </p>
          {paragraphs.slice(1).map((para, i) => (
            <p key={i} className={cn(BODY_TEXT, 'mt-5')}>
              {para}
            </p>
          ))}
        </>
      );
    })()
  ) : (
    <PortableText
      value={((content as unknown[]) ?? []) as PortableTextBlock[]}
      components={portableComponentsFor(locale)}
    />
  );

  return (
    <section className={SECTION_Y}>
      <div className={CONTAINER}>
        <div className={hasAside ? SPLIT : undefined}>
          {aside}
          <div className={hasAside ? SPLIT_MAIN : MEASURE}>
            {showVideo ? <SeoTextVideo url={videoUrl!} title={t('videoTitle')} /> : null}
            <article className={showVideo ? 'mt-8' : undefined}>{body}</article>

            {pullQuote ? (
              <blockquote className="mt-10 relative pl-6 border-l-2 border-primary">
                <p className="text-2xl lg:text-[26px] font-medium leading-snug text-dark dark:text-white">
                  «{pullQuote.text}»
                </p>
                {pullQuote.author ? (
                  <footer className="mt-3 text-sm text-dark/55 dark:text-white/55">— {pullQuote.author}</footer>
                ) : null}
              </blockquote>
            ) : null}

            {cta ? (
              <div className="mt-10 flex flex-col sm:flex-row items-start sm:items-center gap-4 pt-8 border-t border-dark/10 dark:border-white/10">
                <SeoTextCta href={cta.href} label={cta.label} locale={locale} />
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
};

export default SeoText;
