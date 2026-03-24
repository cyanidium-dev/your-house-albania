import type { PropertyHomes } from '@/types/propertyHomes';
import { resolveLocalizedString, resolveLocalizedContent } from './localized';
import { computeReadingTime } from '@/lib/blog/readingTime';

/** Shape for blog listing card (BlogCard). */
export type BlogListItem = {
  slug: string;
  title: string;
  excerpt: string;
  coverImageUrl: string;
  publishedAt: string;
  categoryLabel: string;
  categorySlug: string;
  readingTimeMinutes?: number;
  featured?: boolean;
};

/** Shape for related post card. */
export type BlogRelatedPost = {
  slug: string;
  title: string;
  excerpt: string;
  coverImageUrl: string;
  publishedAt: string;
  categoryLabel: string;
  categorySlug: string;
};

/** Shape for blog detail page. */
export type BlogDetailData = {
  slug: string;
  title: string;
  subtitle: string;
  excerpt: string;
  coverImageUrl: string;
  coverImageAlt?: string;
  publishedAt: string;
  authorName: string;
  authorImageUrl: string;
  categoryLabel: string;
  categories: { slug: string; title: string }[];
  contentBlocks: unknown[];
  relatedPosts: BlogRelatedPost[];
  properties: PropertyHomes[];
};

/** Raw Sanity blog post shape for listing. */
export type SanityListingPost = {
  slug?: string;
  title?: unknown;
  subtitle?: unknown;
  excerpt?: unknown;
  publishedAt?: string;
  coverImage?: { alt?: string; caption?: string; asset?: { url?: string } };
  category?: { slug?: string; title?: unknown };
  categories?: Array<{ slug?: string; title?: unknown }>;
  author?: { name?: string; photo?: { asset?: { url?: string } } };
  authorName?: string;
  authorImage?: { asset?: { url?: string } };
  contentForReadingTime?: unknown[];
  featured?: boolean;
};

type SanityDetailPost = SanityListingPost & {
  content?: Record<string, unknown[]>;
  relatedPosts?: SanityListingPost[];
  properties?: Array<{
    slug?: string;
    title?: unknown;
    shortDescription?: unknown;
    price?: number;
    currency?: string;
    area?: number;
    bedrooms?: number;
    bathrooms?: number;
    status?: string;
    mainImageUrl?: string;
    galleryUrls?: string[];
    city?: { title?: unknown; slug?: string };
    district?: { title?: unknown; slug?: string; citySlug?: string };
    type?: { title?: unknown; slug?: string };
    propertyType?: { title?: unknown; slug?: string };
  }>;
};

function getCoverImageUrl(coverImage: SanityListingPost['coverImage']): string {
  const url = coverImage?.asset?.url;
  return typeof url === 'string' ? url : '';
}

function getAuthorName(post: SanityListingPost): string {
  if (post.author?.name) return post.author.name;
  if (typeof post.authorName === 'string' && post.authorName) return post.authorName;
  return '';
}

function getAuthorImageUrl(post: SanityListingPost): string {
  const fromAuthor = post.author?.photo?.asset?.url;
  if (typeof fromAuthor === 'string') return fromAuthor;
  const fromLegacy = post.authorImage?.asset?.url;
  return typeof fromLegacy === 'string' ? fromLegacy : '';
}

function getCategoryLabel(post: SanityListingPost, locale: string): string {
  const cat = post.category ?? post.categories?.[0];
  if (!cat) return '';
  const title = cat.title;
  return resolveLocalizedString(title as never, locale) || (typeof title === 'string' ? title : '') || '';
}

function getCategorySlug(post: SanityListingPost): string {
  const cat = post.category ?? post.categories?.[0];
  return typeof cat?.slug === 'string' ? cat.slug : '';
}

/**
 * Drops empty slugs, excludes the current article, dedupes by slug (first wins).
 */
export function sanitizeBlogRelatedPosts(
  posts: BlogRelatedPost[],
  currentSlug: string
): BlogRelatedPost[] {
  const seen = new Set<string>();
  const out: BlogRelatedPost[] = [];
  const current = currentSlug.trim();
  for (const p of posts) {
    const slug = (p.slug ?? '').trim();
    if (!slug || slug === current || seen.has(slug)) continue;
    seen.add(slug);
    out.push({ ...p, slug });
  }
  return out;
}

/** Maps Sanity blog post to listing item shape for BlogCard. */
export function mapSanityBlogPostToList(
  post: SanityListingPost | null | undefined,
  locale: string
): BlogListItem {
  if (!post) {
    return {
      slug: '',
      title: '',
      excerpt: '',
      coverImageUrl: '',
      publishedAt: '',
      categoryLabel: '',
      categorySlug: '',
      featured: false,
    };
  }
  const contentBlocks = Array.isArray(post.contentForReadingTime) ? post.contentForReadingTime : [];
  const readingTimeMinutes = contentBlocks.length > 0 ? computeReadingTime(contentBlocks) : undefined;
  return {
    slug: post.slug ?? '',
    title: resolveLocalizedString(post.title as never, locale) || (typeof post.title === 'string' ? post.title : '') || '',
    excerpt: resolveLocalizedString(post.excerpt as never, locale) || (typeof post.excerpt === 'string' ? post.excerpt : '') || '',
    coverImageUrl: getCoverImageUrl(post.coverImage),
    publishedAt: post.publishedAt ?? '',
    categoryLabel: getCategoryLabel(post, locale),
    categorySlug: getCategorySlug(post),
    featured: post.featured ?? false,
    ...(readingTimeMinutes !== undefined && readingTimeMinutes > 0 && { readingTimeMinutes }),
  };
}

/** Maps Sanity blog property embed to PropertyHomes for PropertyCard. */
export function mapBlogPropertyEmbedToCard(
  p: NonNullable<SanityDetailPost['properties']>[number] | null | undefined,
  locale: string
): PropertyHomes | null {
  if (!p || !p.slug) return null;
  const cityTitle = resolveLocalizedString(p.city?.title as never, locale);
  const districtTitle = resolveLocalizedString(p.district?.title as never, locale);
  const location = [districtTitle, cityTitle].filter(Boolean).join(', ') || '—';
  const imageUrls = Array.isArray(p.galleryUrls) && p.galleryUrls.length > 0
    ? p.galleryUrls
    : p.mainImageUrl ? [p.mainImageUrl] : [];
  const images = imageUrls
    .filter((url): url is string => typeof url === 'string' && url.length > 0)
    .map((src) => ({ src }));

  return {
    name: resolveLocalizedString(p.title as never, locale) || (typeof p.title === 'string' ? p.title : '') || '—',
    slug: p.slug,
    location,
    rate: p.price != null ? String(p.price) : '',
    beds: p.bedrooms ?? 0,
    baths: p.bathrooms ?? 0,
    area: p.area ?? 0,
    images,
    price: p.price,
    currency: p.currency,
    status: p.status,
    propertyType: (p.propertyType ?? p.type)?.title
      ? (resolveLocalizedString((p.propertyType ?? p.type)!.title as never, locale) || String((p.propertyType ?? p.type)!.title))
      : undefined,
    city: cityTitle || undefined,
    district: districtTitle || undefined,
    teaser: resolveLocalizedString(p.shortDescription as never, locale) || undefined,
  };
}

/** Maps Sanity blog post to detail page shape. */
export function mapSanityBlogPostToDetail(
  post: SanityDetailPost | null | undefined,
  locale: string
): BlogDetailData | null {
  if (!post || !post.slug) return null;

  const content = post.content as Record<string, unknown[]> | null | undefined;
  const contentBlocks = resolveLocalizedContent(content, locale);

  const relatedPosts: BlogRelatedPost[] = (post.relatedPosts ?? [])
    .filter((p): p is SanityListingPost => p != null)
    .map((p) => ({
      slug: p.slug ?? '',
      title: resolveLocalizedString(p.title as never, locale) || (typeof p.title === 'string' ? p.title : '') || '',
      excerpt: resolveLocalizedString(p.excerpt as never, locale) || (typeof p.excerpt === 'string' ? p.excerpt : '') || '',
      coverImageUrl: getCoverImageUrl(p.coverImage),
      publishedAt: p.publishedAt ?? '',
      categoryLabel: getCategoryLabel(p, locale),
      categorySlug: getCategorySlug(p),
    }));

  const properties: PropertyHomes[] = (post.properties ?? [])
    .map((prop) => mapBlogPropertyEmbedToCard(prop, locale))
    .filter((p): p is PropertyHomes => p != null);

  const categories = (post.categories ?? [])
    .filter((c) => c?.slug)
    .map((c) => ({
      slug: c.slug ?? '',
      title: resolveLocalizedString(c.title as never, locale) || (typeof c.title === 'string' ? c.title : '') || '',
    }));

  return {
    slug: post.slug ?? '',
    title: resolveLocalizedString(post.title as never, locale) || (typeof post.title === 'string' ? post.title : '') || '',
    subtitle: resolveLocalizedString(post.subtitle as never, locale) || (typeof post.subtitle === 'string' ? post.subtitle : '') || '',
    excerpt: resolveLocalizedString(post.excerpt as never, locale) || (typeof post.excerpt === 'string' ? post.excerpt : '') || '',
    coverImageUrl: getCoverImageUrl(post.coverImage),
    coverImageAlt: post.coverImage?.alt ?? undefined,
    publishedAt: post.publishedAt ?? '',
    authorName: getAuthorName(post),
    authorImageUrl: getAuthorImageUrl(post),
    categoryLabel: getCategoryLabel(post, locale),
    categories,
    contentBlocks,
    relatedPosts,
    properties,
  };
}
