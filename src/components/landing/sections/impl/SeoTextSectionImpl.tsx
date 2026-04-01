import Link from 'next/link';
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
    'inline-flex items-center justify-center rounded-full border border-primary bg-primary px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-dark dark:hover:bg-white dark:hover:text-dark';
  const external = /^https?:\/\//i.test(href);
  if (external) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={`${className} mt-8`}>
        {label}
      </a>
    );
  }
  const path = href.startsWith('/') ? `/${locale}${href}` : `/${locale}/${href.replace(/^\//, '')}`;
  return (
    <Link href={path} className={`${className} mt-8`}>
      {label}
    </Link>
  );
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

  return (
    <section className="py-12 md:py-16">
      <div className="container max-w-8xl mx-auto px-5 2xl:px-0">
        <div className="max-w-3xl">
          {heading ? (
            <h2 className="text-dark dark:text-white text-xl sm:text-2xl lg:text-3xl font-medium leading-[1.3] mb-4">
              {heading}
            </h2>
          ) : null}
          {showVideo ? <SeoTextVideo url={videoUrl!} /> : null}
          {!hasContent ? (
            <p className="text-amber-600 dark:text-amber-400 text-sm font-medium bg-amber-50 dark:bg-amber-950/30 py-4 px-4 rounded-lg border border-amber-200 dark:border-amber-800">
              {fallbackMsg}
            </p>
          ) : isPlainText && typeof content === 'string' ? (
            <p className="text-dark/75 dark:text-white/75 text-base sm:text-lg leading-[1.7] whitespace-pre-line">
              {content}
            </p>
          ) : (
            <PortableText
              value={((content as unknown[]) ?? []) as PortableTextBlock[]}
              components={components}
            />
          )}
          {cta ? <SeoTextCta href={cta.href} label={cta.label} locale={locale} /> : null}
        </div>
      </div>
    </section>
  );
};

export default SeoText;
