import { PortableText, type PortableTextComponents } from "@portabletext/react";
import type { PortableTextBlock } from "@portabletext/types";
import { BODY_TEXT, MEASURE, SECTION_TITLE, SPLIT, SPLIT_ASIDE, SPLIT_MAIN } from "@/components/shared/layout";

const components: PortableTextComponents = {
  block: {
    h1: ({ children }) => (
      <h2 className="text-dark dark:text-white text-xl sm:text-2xl font-semibold tracking-tight mt-10 first:mt-0">
        {children}
      </h2>
    ),
    h2: ({ children }) => (
      <h3 className="text-dark dark:text-white text-lg sm:text-xl font-semibold mt-8 first:mt-0">
        {children}
      </h3>
    ),
    h3: ({ children }) => (
      <h4 className="text-dark dark:text-white text-base font-semibold mt-6 first:mt-0">
        {children}
      </h4>
    ),
    normal: ({ children }) => (
      <p className={`${BODY_TEXT} mt-4 first:mt-0`}>
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
      <li className={`flex items-start gap-3 ${BODY_TEXT}`}>
        <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0 mt-[0.65rem]" />
        <span className="min-w-0">{children}</span>
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

  const body = <PortableText value={content as PortableTextBlock[]} components={components} />;

  // Same composition as the prose blocks on /info: heading on the narrow side,
  // text at a reading measure on the wide side. The copy used to run the full
  // 1400px width, ~190 characters a line on /durres.
  if (heading && !hasOwnHeading) {
    return (
      <div className={`${SPLIT} py-12 md:py-16`}>
        <h2 className={`${SPLIT_ASIDE} ${SECTION_TITLE}`}>{heading}</h2>
        <div className={SPLIT_MAIN}>{body}</div>
      </div>
    );
  }
  return <div className={`${MEASURE} py-12 md:py-16`}>{body}</div>;
}
