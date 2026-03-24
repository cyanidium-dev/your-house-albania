"use client";

import { PortableText, type PortableTextComponents } from "@portabletext/react";
import type { PortableTextBlock } from "@portabletext/types";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { BlogCardClient } from "./BlogCardClient";
import { BlogContentImage } from "./BlogContentImage";
import PropertyCard from "@/components/shared/property/PropertyCard";
import { mapSanityBlogPostToList } from "@/lib/sanity/blogAdapter";
import { mapBlogPropertyEmbedToCard } from "@/lib/sanity/blogAdapter";
import { resolveLocalizedString, resolveLocalizedContent } from "@/lib/sanity/localized";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

type BlogArticleContentProps = {
  content: unknown[];
  locale: string;
};

/**
 * Resolves CTA href for blogCtaBlock.
 * Preserves as-is: http(s)://, mailto:, tel:, #anchor.
 * Prefixes internal paths with locale: /properties -> /{locale}/properties.
 * Empty/invalid -> "#".
 */
function resolveCtaHref(
  raw: string | null | undefined,
  locale: string
): string {
  const s = typeof raw === "string" ? raw.trim() : "";
  if (!s) return "#";
  if (s.startsWith("http://") || s.startsWith("https://")) return s;
  if (s.startsWith("mailto:")) return s;
  if (s.startsWith("tel:")) return s;
  if (s.startsWith("#")) return s;
  return s.startsWith("/") ? `/${locale}${s}` : `/${locale}/${s}`;
}

function createSharedPortableTextComponents(
  locale: string
): Pick<PortableTextComponents, "marks" | "list" | "listItem"> {
  return {
    marks: {
      link: ({ children, value }) => {
        const href = resolveCtaHref(
          typeof value?.href === "string" ? value.href : undefined,
          locale
        );
        const isExternal =
          href.startsWith("http://") || href.startsWith("https://");
        return (
          <Link
            href={href}
            className="text-primary hover:underline"
            target={isExternal ? "_blank" : undefined}
            rel={isExternal ? "noopener noreferrer" : undefined}
          >
            {children}
          </Link>
        );
      },
    },
    list: {
      bullet: ({ children }) => (
        <ul className="mt-4 flex flex-col gap-2 list-none pl-0">{children}</ul>
      ),
      number: ({ children }) => (
        <ol className="mt-4 flex flex-col gap-2 list-decimal pl-6">{children}</ol>
      ),
    },
    listItem: {
      bullet: ({ children }) => (
        <li className="flex items-start gap-2 text-dark/75 dark:text-white/75 text-base">
          <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0 mt-1.5" />
          {children}
        </li>
      ),
      number: ({ children }) => (
        <li className="text-dark/75 dark:text-white/75 text-base">{children}</li>
      ),
    },
  };
}

function createBlogComponents(
  locale: string,
  learnMoreFallback: string
): PortableTextComponents {
  const blockComponents: PortableTextComponents["block"] = {
    h1: ({ children }) => (
      <h2 className="text-dark dark:text-white text-2xl font-semibold mt-10 first:mt-0">
        {children}
      </h2>
    ),
    h2: ({ children }) => (
      <h3 className="text-dark dark:text-white text-xl font-medium mt-8 first:mt-0">
        {children}
      </h3>
    ),
    h3: ({ children }) => (
      <h4 className="text-dark dark:text-white text-lg font-medium mt-6 first:mt-0">
        {children}
      </h4>
    ),
    normal: ({ children }) => (
      <p className="text-dark/75 dark:text-white/75 text-base leading-relaxed mt-4 first:mt-0">
        {children}
      </p>
    ),
  };

  const sharedPortable = createSharedPortableTextComponents(locale);

  return {
    block: blockComponents,
    ...sharedPortable,
    types: {
      image: ({ value }) => <BlogContentImage value={value as { asset?: { url?: string }; alt?: string; caption?: string }} />,
      blogCtaBlock: ({ value }) => {
        const v = value as {
          href?: string;
          label?: Record<string, string>;
          cta?: { href?: string; label?: Record<string, string> };
        };
        const rawHref = v?.href ?? v?.cta?.href;
        const href = resolveCtaHref(rawHref, locale);
        const labelObj = v?.label ?? v?.cta?.label;
        const label =
          resolveLocalizedString(labelObj as never, locale) ||
          (typeof labelObj === "string" ? labelObj : "") ||
          learnMoreFallback;
        const variant = (v as { variant?: string })?.variant ?? "primary";
        const baseClass =
          "inline-flex items-center justify-center rounded-full font-semibold transition-colors py-3 px-6";
        const variantClass =
          variant === "secondary"
            ? "border-2 border-primary text-primary hover:bg-primary/10"
            : variant === "link"
              ? "text-primary hover:underline"
              : "bg-primary text-white hover:bg-primary/90";
        return (
          <div className="my-6">
            <Link href={href} className={`${baseClass} ${variantClass}`}>
              {label}
            </Link>
          </div>
        );
      },
      blogRelatedPostsBlock: ({ value }) => {
        const v = value as { posts?: unknown[]; title?: Record<string, string> };
        const posts = Array.isArray(v?.posts) ? v.posts : [];
        const blockTitle = v?.title?.[locale] ?? v?.title?.en;
        if (posts.length === 0) return null;
        const items = posts
          .map((p) => mapSanityBlogPostToList(p as never, locale))
          .filter((i) => i.slug);
        return (
          <div className="my-10">
            {blockTitle && (
              <h3 className="text-dark dark:text-white text-xl font-semibold mb-6">
                {blockTitle}
              </h3>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {items.map((item) => (
                <BlogCardClient key={item.slug} blog={item} locale={locale} />
              ))}
            </div>
          </div>
        );
      },
      blogPropertyEmbedBlock: ({ value }) => {
        const v = value as { properties?: unknown[]; title?: Record<string, string> };
        const properties = Array.isArray(v?.properties) ? v.properties : [];
        const blockTitle = v?.title?.[locale] ?? v?.title?.en;
        if (properties.length === 0) return null;
        const cards = properties
          .map((p) => mapBlogPropertyEmbedToCard(p as never, locale))
          .filter((c): c is NonNullable<typeof c> => c != null);
        if (cards.length === 0) return null;
        return (
          <div className="my-10">
            {blockTitle && (
              <h3 className="text-dark dark:text-white text-xl font-semibold mb-6">
                {blockTitle}
              </h3>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {cards.map((item) => (
                <PropertyCard
                  key={item.slug}
                  item={item}
                  locale={locale}
                  view="large"
                />
              ))}
            </div>
          </div>
        );
      },
      blogTable: ({ value }) => {
        const v = value as { rows?: Array<{ cells?: string[] }>; title?: Record<string, string> };
        const rows = Array.isArray(v?.rows) ? v.rows : [];
        const blockTitle = v?.title?.[locale] ?? v?.title?.en;
        if (rows.length === 0) return null;
        const headerCells = rows[0]?.cells ?? [];
        return (
          <div className="my-8 overflow-x-auto">
            {blockTitle && (
              <h4 className="text-dark dark:text-white font-medium mb-4">
                {blockTitle}
              </h4>
            )}
            <table className="w-full border-collapse border border-dark/10 dark:border-white/20">
              <thead>
                <tr>
                  {headerCells.map((cell, i) => (
                    <th
                      key={i}
                      className="border border-dark/10 dark:border-white/20 px-4 py-2 text-left text-dark dark:text-white font-medium"
                    >
                      {cell}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.slice(1).map((row, ri) => (
                  <tr key={ri}>
                    {(row.cells ?? []).map((cell, ci) => (
                      <td
                        key={ci}
                        className="border border-dark/10 dark:border-white/20 px-4 py-2 text-dark/80 dark:text-white/80 text-sm"
                      >
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      },
      blogFaqBlock: ({ value }) => {
        const v = value as {
          items?: Array<{
            question?: Record<string, string>;
            answer?: unknown;
          }>;
          title?: Record<string, string>;
        };
        const items = Array.isArray(v?.items) ? v.items : [];
        const blockTitle = v?.title?.[locale] ?? v?.title?.en;
        if (items.length === 0) return null;
        return (
          <div className="my-10">
            {blockTitle && (
              <h3 className="text-dark dark:text-white text-xl font-semibold mb-6">
                {blockTitle}
              </h3>
            )}
            <Accordion type="single" collapsible className="w-full">
              {items.map((item, i) => {
                const q = item.question?.[locale] ?? item.question?.en ?? "";
                const aRaw = item.answer;
                const resolvedBlocks = resolveLocalizedContent(
                  Array.isArray(aRaw) || (typeof aRaw === "object" && aRaw !== null) ? aRaw : null,
                  locale
                );
                const answerBlocks =
                  Array.isArray(resolvedBlocks) && resolvedBlocks.length > 0
                    ? (resolvedBlocks as PortableTextBlock[])
                    : [];
                const answerString =
                  typeof aRaw === "string"
                    ? aRaw
                    : typeof aRaw === "object" && aRaw !== null && !Array.isArray(aRaw)
                      ? resolveLocalizedString(aRaw as never, locale)
                      : "";
                return (
                  <AccordionItem key={i} value={`faq-${i}`}>
                    <AccordionTrigger className="text-left text-dark dark:text-white">
                      {q}
                    </AccordionTrigger>
                    <AccordionContent>
                      {answerBlocks.length > 0 ? (
                        <PortableText
                          value={answerBlocks}
                          components={{
                            block: blockComponents,
                            ...sharedPortable,
                          }}
                        />
                      ) : (
                        <span className="text-dark/75 dark:text-white/75">
                          {answerString}
                        </span>
                      )}
                    </AccordionContent>
                  </AccordionItem>
                );
              })}
            </Accordion>
          </div>
        );
      },
      blogCallout: ({ value }) => {
        const v = value as { content?: unknown[]; variant?: string };
        const content = Array.isArray(v?.content) ? v.content : [];
        const variant = v?.variant ?? "info";
        const bgClass =
          variant === "warning"
            ? "bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800"
            : variant === "error"
              ? "bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800"
              : "bg-primary/5 dark:bg-primary/10 border-primary/20 dark:border-primary/30";
        if (content.length === 0) return null;
        return (
          <div
            className={`my-6 rounded-lg border p-4 ${bgClass}`}
          >
            <PortableText
              value={content as PortableTextBlock[]}
              components={{
                block: {
                  normal: ({ children }) => (
                    <p className="text-dark dark:text-white text-base m-0">
                      {children}
                    </p>
                  ),
                  h1: ({ children }) => (
                    <p className="text-dark dark:text-white font-semibold m-0 mb-2">
                      {children}
                    </p>
                  ),
                },
                ...sharedPortable,
              }}
            />
          </div>
        );
      },
    },
  };
}

export function BlogArticleContent({ content, locale }: BlogArticleContentProps) {
  const t = useTranslations("Shared.blogCta");
  if (!Array.isArray(content) || content.length === 0) return null;
  const components = createBlogComponents(locale, t("learnMore"));
  return (
    <div className="blog-details">
      <PortableText value={content as PortableTextBlock[]} components={components} />
    </div>
  );
}
