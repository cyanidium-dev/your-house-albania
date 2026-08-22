import { getClient, sanityCache, SANITY_TAGS } from './_core';

// --- Blog query projections (aligned with blog-schema-contract) ---

const blogAuthorProjection = `{
  _id,
  "slug": slug.current,
  name,
  active,
  role,
  "photo": photo{
    alt,
    asset->{url}
  },
  email
}`;

const blogCategoryListProjection = `{
  _id,
  "slug": slug.current,
  title
}`;

/** Content block projection for detail: dereferences posts and properties in inline blocks. */
const blogDetailContentBlockProjection = `{
  ...,
  "posts": select(_type == "blogRelatedPostsBlock" => posts[]->{
    _id,
    "slug": slug.current,
    title,
    excerpt,
    publishedAt,
    coverImage{alt,caption,asset->{url}},
    "categories": categories[]->{_id,"slug":slug.current,title},
    "author": author->{_id,name,"photo":photo{alt,asset->{url}}},
    authorName,
    authorRole,
    authorImage{asset->{url}}
  }, null),
  "properties": select(_type == "blogPropertyEmbedBlock" => properties[]->{
    _id,
    "slug": slug.current,
    title,
    shortDescription,
    price,
    currency,
    area,
    bedrooms,
    bathrooms,
    status,
    "mainImageUrl": gallery[0].asset->url,
    "galleryUrls": gallery[].asset->url,
    "city": city->{_id,title,"slug":slug.current},
    "district": district->{_id,title,"slug":slug.current,"citySlug":city->slug.current},
    "type": type->{_id,title,"slug":slug.current},
    "propertyType": propertyType->{_id,title,"slug":slug.current}
  }, null),
  asset->{url}
}`;

/** Minimal content projection for reading time only. No assets, no heavy refs. */
const blogContentForReadingTimeProjection = `{
  _type,
  children[]{text},
  text,
  content[]{
    _type,
    children[]{text},
    text,
    items[]{answer[]{children[]{text}}, cells},
    rows[]{cells}
  },
  items[]{answer[]{children[]{text}}, cells},
  rows[]{cells},
  "posts": select(_type == "blogRelatedPostsBlock" => posts[]->{excerpt, title}, null),
  "properties": select(_type == "blogPropertyEmbedBlock" => properties[]->{title, shortDescription}, null)
}`;

export const blogListingProjection = `{
  _id,
  _type,
  "slug": slug.current,
  title,
  subtitle,
  excerpt,
  publishedAt,
  featured,
  coverImage{
    alt,
    caption,
    asset->{url}
  },
  "category": categories[0]->${blogCategoryListProjection},
  "categories": categories[]->${blogCategoryListProjection},
  "author": author->${blogAuthorProjection},
  authorName,
  authorRole,
  authorImage{
    asset->{url}
  },
  "contentForReadingTime": coalesce(content.en, content.uk, content.ru, content.sq, content["it"], [])[]${blogContentForReadingTimeProjection}
}`;

const cachedFetchBlogPosts = sanityCache(
  async (): Promise<unknown[] | null> => {
    const client = getClient();
    if (!client) return null;
    const query = `*[_type == "blogPost" && defined(publishedAt) && publishedAt <= now()] | order(featured desc, publishedAt desc) ${blogListingProjection}`;
    try {
      const result = await client.fetch<unknown[]>(query);
      return Array.isArray(result) ? result : [];
    } catch (err) {
      console.warn('[Sanity] fetchBlogPosts failed:', err);
      return null;
    }
  },
  ['sanity-blog-posts'],
  { revalidate: 60, tags: [SANITY_TAGS.blogPost, SANITY_TAGS.blogCategory] },
);

/** Fetch published blog posts for listing. Uses publishedAt <= now(). */
export async function fetchBlogPosts(): Promise<unknown[] | null> {
  return cachedFetchBlogPosts();
}

export type FetchBlogPostsPaginatedParams = {
  category?: string;
  page?: number;
  pageSize?: number;
};

export type FetchBlogPostsPaginatedResult = {
  items: unknown[];
  totalCount: number;
};

/** Fetch published blog posts with category filter and pagination. */
export async function fetchBlogPostsPaginated(
  params: FetchBlogPostsPaginatedParams = {}
): Promise<FetchBlogPostsPaginatedResult> {
  const client = getClient();
  if (!client) return { items: [], totalCount: 0 };
  const { category, page = 1, pageSize = 12 } = params;
  const offset = Math.max(0, (page - 1) * pageSize);
  const limit = Math.max(1, pageSize);

  const categoryFilter = category?.trim()
    ? `&& $categorySlug in categories[]->slug.current`
    : '';
  const filter = `*[_type == "blogPost" && defined(publishedAt) && publishedAt <= now() ${categoryFilter}]`;
  const order = `| order(featured desc, publishedAt desc)`;
  const slice = `[${offset}...${offset + limit}]`;

  const query = `${filter} ${order} ${slice} ${blogListingProjection}`;
  const countQuery = `count(${filter})`;

  try {
    const [items, totalCount] = await Promise.all([
      client.fetch<unknown[]>(query, category?.trim() ? { categorySlug: category.trim() } : {}),
      client.fetch<number>(countQuery, category?.trim() ? { categorySlug: category.trim() } : {}),
    ]);
    return {
      items: Array.isArray(items) ? items : [],
      totalCount: typeof totalCount === 'number' ? totalCount : 0,
    };
  } catch (err) {
    console.warn('[Sanity] fetchBlogPostsPaginated failed:', err);
    return { items: [], totalCount: 0 };
  }
}

/** Fetch blog post count for pagination. */
export async function fetchBlogPostCount(category?: string): Promise<number> {
  const client = getClient();
  if (!client) return 0;
  const categoryFilter = category?.trim()
    ? `&& $categorySlug in categories[]->slug.current`
    : '';
  const query = `count(*[_type == "blogPost" && defined(publishedAt) && publishedAt <= now() ${categoryFilter}])`;
  try {
    const result = await client.fetch<number>(
      query,
      category?.trim() ? { categorySlug: category.trim() } : {}
    );
    return typeof result === 'number' ? result : 0;
  } catch (err) {
    console.warn('[Sanity] fetchBlogPostCount failed:', err);
    return 0;
  }
}

/** Fetch blog-settings singleton. Returns null if not found. */
export async function fetchBlogSettings(): Promise<unknown | null> {
  const client = getClient();
  if (!client) return null;
  // `blogSettings` is the schema type; `blog-settings` is only the document id.
  // The filter used to match the id as if it were the type, so this always
  // returned null and `seo` / `relatedPostsSidebarCount` never took effect.
  // Hero copy is deliberately not consumed by the blog page: it renders its hero
  // from `messages/*.json` (translated), whereas these CMS fields currently hold
  // the same English string in all five locales.
  const query = `*[_type == "blogSettings" && _id == "blog-settings"][0]{
    heroTitle,
    heroDescription,
    relatedPostsSidebarCount,
    seo {
      metaTitle,
      metaDescription,
      ogTitle,
      ogDescription,
      ogImage { asset->{url} },
      noIndex,
      noFollow
    }
  }`;
  try {
    const result = await client.fetch(query);
    return result ?? null;
  } catch (err) {
    console.warn('[Sanity] fetchBlogSettings failed:', err);
    return null;
  }
}

/** Fetch a single published blog post by slug. Returns null if not found or not yet published. */
export async function fetchBlogPostBySlug(slug: string): Promise<unknown | null> {
  const client = getClient();
  if (!client) return null;
  const query = `*[_type == "blogPost" && slug.current == $slug && defined(publishedAt) && publishedAt <= now()][0]{
    _id,
    _type,
    "slug": slug.current,
    title,
    subtitle,
    excerpt,
    publishedAt,
    featured,
    coverImage{
      alt,
      caption,
      asset->{url}
    },
    "categories": categories[]->{_id,"slug":slug.current,title},
    "author": author->{_id,"slug":slug.current,name,active,role,"photo":photo{alt,asset->{url}},email},
    authorName,
    authorRole,
    authorImage{
      asset->{url}
    },
    seo,
    "relatedPosts": relatedPosts[]->{
      _id,
      "slug": slug.current,
      title,
      excerpt,
      publishedAt,
      coverImage{alt,caption,asset->{url}},
      "categories": categories[]->{_id,"slug":slug.current,title},
      "author": author->{_id,name,"photo":photo{alt,asset->{url}}},
      authorName,
      authorRole,
      authorImage{asset->{url}}
    },
    "properties": relatedProperties[]->{
      _id,
      "slug": slug.current,
      title,
      "description": shortDescription,
      price,
      currency,
      area,
      bedrooms,
      bathrooms,
      status,
      "mainImageUrl": gallery[0].asset->url,
      "galleryUrls": gallery[].asset->url,
      "city": city->{_id,title,"slug":slug.current},
      "district": district->{_id,title,"slug":slug.current,"citySlug":city->slug.current}
    },
    "content": {
      "en": content.en[]${blogDetailContentBlockProjection},
      "uk": content.uk[]${blogDetailContentBlockProjection},
      "ru": content.ru[]${blogDetailContentBlockProjection},
      "sq": content.sq[]${blogDetailContentBlockProjection},
      "it": content.it[]${blogDetailContentBlockProjection}
    }
  }`;
  try {
    const result = await client.fetch(query, { slug });
    return result ?? null;
  } catch (err) {
    console.warn('[Sanity] fetchBlogPostBySlug failed:', err);
    return null;
  }
}

/** Fetch blog categories. Returns active and inactive; frontend can filter by active if needed. */
export async function fetchBlogCategories(): Promise<unknown[] | null> {
  const client = getClient();
  if (!client) return null;
  const query = `*[_type == "blogCategory"] | order(order asc) {
    _id,
    "slug": slug.current,
    title,
    description,
    order,
    active,
    seo
  }`;
  try {
    const result = await client.fetch<unknown[]>(query);
    return Array.isArray(result) ? result : [];
  } catch (err) {
    console.warn('[Sanity] fetchBlogCategories failed:', err);
    return null;
  }
}

