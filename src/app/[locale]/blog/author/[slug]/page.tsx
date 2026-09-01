import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AuthorAvatar } from "@/components/Blog/AuthorAvatar";
import { getTranslations } from "next-intl/server";
import { fetchBlogAuthorBySlug } from "@/lib/sanity/queries/blog";
import { mapSanityBlogPostToList } from "@/lib/sanity/blogAdapter";
import { BlogCardClient } from "@/components/Blog/BlogCardClient";
import { PersonJsonLd } from "@/lib/seo/personJsonLd";
import { resolveLocalizedString } from "@/lib/sanity/localized";
import { getBaseUrl } from "@/lib/seo/baseUrl";
import { getSiteBaseUrl } from "@/lib/siteUrl";

type Props = { params: Promise<{ locale: string; slug: string }> };

const SLUG_REGEX = /^[a-z0-9-]+$/;

type Author = {
  name?: string;
  slug?: string;
  active?: boolean;
  role?: unknown;
  bio?: unknown;
  photo?: { alt?: string; asset?: { url?: string } };
  socialLinks?: Array<{ url?: string }>;
  posts?: unknown[];
};

async function load(slug: string): Promise<Author | null> {
  if (!slug || !SLUG_REGEX.test(slug)) return null;
  return (await fetchBlogAuthorBySlug(slug)) as Author | null;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug, locale } = await params;
  const author = await load(slug);
  if (!author) return {};
  const role = resolveLocalizedString(author.role as never, locale);
  const bio = resolveLocalizedString(author.bio as never, locale);
  return {
    title: author.name,
    description: bio || role || undefined,
    // An inactive author still renders — the seed has to be testable — but it
    // is not advertised. Rendering and indexing are separate decisions.
    robots: author.active === true ? undefined : { index: false, follow: true },
  };
}

export default async function BlogAuthorPage({ params }: Props) {
  const { slug, locale } = await params;
  const author = await load(slug);
  if (!author) notFound();

  const t = await getTranslations("Blog");
  const baseUrl = ((await getBaseUrl()) || getSiteBaseUrl()).replace(/\/$/, "");
  const role = resolveLocalizedString(author.role as never, locale);
  const bio = resolveLocalizedString(author.bio as never, locale);
  const photoUrl = author.photo?.asset?.url;
  const posts = (author.posts ?? []).map((p) => mapSanityBlogPostToList(p as never, locale));

  return (
    <section className="pt-32 pb-20">
      <PersonJsonLd
        name={author.name ?? ""}
        url={`${baseUrl}/${locale}/blog/author/${author.slug ?? slug}`}
        imageUrl={photoUrl}
        jobTitle={role || undefined}
        description={bio || undefined}
        sameAs={(author.socialLinks ?? [])
          .map((s) => s?.url)
          .filter((u): u is string => typeof u === "string" && u.trim().length > 0)}
      />

      <div className="container max-w-8xl mx-auto px-4 md:px-5 2xl:px-0">
        <header className="flex items-center gap-5 mb-10">
          <AuthorAvatar
            imageUrl={photoUrl}
            name={author.name}
            alt={author.photo?.alt}
            size={96}
          />
          <div>
            <h1 className="text-dark dark:text-white text-40 font-semibold">{author.name}</h1>
            {role && <p className="text-dark/70 dark:text-white/70 mt-1">{role}</p>}
          </div>
        </header>

        {bio && (
          <p className="text-dark/80 dark:text-white/80 max-w-3xl leading-relaxed mb-12">{bio}</p>
        )}

        <h2 className="text-dark dark:text-white text-2xl font-semibold mb-6">
          {t("authorPostsTitle")}
        </h2>
        {posts.length === 0 ? (
          <p className="text-dark/60 dark:text-white/60">{t("authorNoPosts")}</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {posts.map((p) => (
              <BlogCardClient key={p.slug} blog={p} locale={locale} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
