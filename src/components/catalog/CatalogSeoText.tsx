import { PortableText, type PortableTextComponents } from "@portabletext/react";
import type { PortableTextBlock } from "@portabletext/types";

const components: PortableTextComponents = {
  block: {
    h1: ({ children }) => (
      <h2 className="text-dark dark:text-white text-xl font-semibold mt-6 first:mt-0">
        {children}
      </h2>
    ),
    h2: ({ children }) => (
      <h3 className="text-dark dark:text-white text-lg font-medium mt-4 first:mt-0">
        {children}
      </h3>
    ),
    h3: ({ children }) => (
      <h4 className="text-dark dark:text-white text-base font-medium mt-3 first:mt-0">
        {children}
      </h4>
    ),
    normal: ({ children }) => (
      <p className="text-dark/75 dark:text-white/75 text-base leading-relaxed mt-3 first:mt-0">
        {children}
      </p>
    ),
  },
  list: {
    bullet: ({ children }) => (
      <ul className="mt-3 flex flex-col gap-1 list-none pl-0">{children}</ul>
    ),
  },
  listItem: {
    bullet: ({ children }) => (
      <li className="flex items-start gap-2 text-dark/75 dark:text-white/75 text-base">
        <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0 mt-1.5" />
        {children}
      </li>
    ),
  },
};

type Props = {
  content: unknown[];
  /**
   * Heading for copy that has none of its own. The CMS field is plain text, so
   * it arrives as paragraphs only and the page's longest prose sat under no
   * heading at all.
   */
  heading?: string;
};

const HEADING_STYLES = new Set(["h1", "h2"]);

export function CatalogSeoText({ content, heading }: Props) {
  if (!Array.isArray(content) || content.length === 0) return null;
  const hasOwnHeading = content.some(
    (block) => HEADING_STYLES.has(String((block as { style?: unknown } | null)?.style ?? "")),
  );

  return (
    <div className="py-6">
      {heading && !hasOwnHeading ? (
        <h2 className="text-dark dark:text-white text-xl md:text-2xl font-semibold mb-3">{heading}</h2>
      ) : null}
      <PortableText value={content as PortableTextBlock[]} components={components} />
    </div>
  );
}
