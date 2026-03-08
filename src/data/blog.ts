import type { BlogPost } from '@/types/domain';
import { getAllPosts, getPostBySlug } from '@/components/utils/markdown';

/**
 * Returns all blog posts sorted by date. Later: replace with Sanity query.
 */
export function getBlogPosts(fields: string[] = ['title', 'date', 'excerpt', 'coverImage', 'slug', 'detail', 'tag']): BlogPost[] {
  const posts = getAllPosts(fields);
  return posts.map((p) => ({
    title: typeof p.title === 'string' ? p.title : String(p.title ?? ''),
    date: typeof p.date === 'string' ? p.date : String(p.date ?? ''),
    excerpt: typeof p.excerpt === 'string' ? p.excerpt : String(p.excerpt ?? ''),
    coverImage: typeof p.coverImage === 'string' ? p.coverImage : String(p.coverImage ?? ''),
    slug: typeof p.slug === 'string' ? p.slug : String(p.slug ?? ''),
    detail: typeof p.detail === 'string' ? p.detail : String(p.detail ?? ''),
    tag: typeof p.tag === 'string' ? p.tag : String(p.tag ?? ''),
  }));
}

/**
 * Returns a blog post by slug, or null if not found. Later: replace with Sanity query.
 */
export function getBlogPostBySlug(slug: string, fields: string[] = ['title', 'author', 'content', 'coverImage', 'date', 'tag', 'detail', 'authorImage']): Partial<BlogPost> | null {
  try {
    const post = getPostBySlug(slug, fields);
    return post ? (post as Partial<BlogPost>) : null;
  } catch {
    return null;
  }
}
