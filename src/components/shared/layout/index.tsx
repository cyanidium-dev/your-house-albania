import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * The page grid, in one place.
 *
 * Every section on every page sits in the same container: 1400px
 * (`max-w-8xl`), a 20px gutter below 1536px and none above it. Nothing gets a
 * narrower container of its own. Pages used to mix 1400, 1024, 896, 768 and
 * 672px wrappers, some centred and some not, so consecutive sections started
 * at different left edges and the page read as parts glued together
 * (design audit 2026-09-28, docs/ux/DESIGN-SYSTEM.md).
 *
 * Inside the container there are exactly three widths:
 * - full: tables, card grids, carousels, galleries;
 * - the reading measure (`MEASURE`, 768px) for a heading's lead or a lone
 *   paragraph, always start-aligned, never centred in a narrower box;
 * - the split (`SPLIT`): 5 columns of heading, photo or figures beside 7
 *   columns of text. The 7-column side lands at the reading measure on a
 *   desktop, so long text gets a comfortable line without leaving half the
 *   page empty. Below `lg` the two sides stack.
 *
 * The string constants exist so the Tailwind scanner sees the classes and so
 * a component that cannot use the components below still spells the grid the
 * same way.
 */
export const CONTAINER = "container max-w-8xl mx-auto px-5 2xl:px-0";

/** Top of a page that has no photo hero: clears the fixed header. */
export const PAGE_TOP = "pt-28 md:pt-36";

/** Vertical padding of one section: 96px between two sections on a phone, 128px from `md`. */
export const SECTION_Y = "py-12 md:py-16";

/** Reading measure for running text that is not in a split. */
export const MEASURE = "max-w-3xl";

export const SPLIT = "grid gap-8 lg:grid-cols-12 lg:gap-16";
/** The wide (text) side of the split. */
export const SPLIT_MAIN = "min-w-0 lg:col-span-7";
/** The narrow (heading / photo / figures) side of the split. */
export const SPLIT_ASIDE = "min-w-0 lg:col-span-5";

/** Every section `<h2>` on the site: 30px phone, 36px tablet, 44px desktop. */
export const SECTION_TITLE =
  "text-3xl sm:text-4xl lg:text-[2.75rem] font-medium leading-[1.1] tracking-tight text-dark dark:text-white text-balance";

export const SECTION_LEAD =
  "text-base sm:text-lg leading-relaxed text-dark/60 dark:text-white/60 whitespace-pre-line";

/** Body copy inside sections (not blog articles, which have their own scale). */
export const BODY_TEXT = "text-[17px] leading-relaxed text-dark/75 dark:text-white/75";

/**
 * Photo heroes (landing, listing, blog and guide hubs): all start-aligned, one
 * label style above the title, one title scale. Three hero components used to
 * disagree — two centred with a house-icon label, one start-aligned from
 * tablet up with an uppercase label — so a city's listing page and its price
 * page opened like two different sites.
 */
export const HERO_LABEL =
  "text-xs md:text-sm font-semibold uppercase tracking-[0.12em] md:tracking-[0.14em] text-white/90";
export const HERO_TITLE =
  "font-display text-[1.75rem] leading-[1.12] sm:text-[2.25rem] sm:leading-[1.08] md:text-5xl lg:text-[3.5rem] lg:leading-[1.05] font-bold tracking-[-0.02em] md:tracking-[-0.03em] text-balance";
export const HERO_LEAD = "text-base md:text-xl leading-relaxed text-white/90 whitespace-pre-line";

/** Quiet surface for panels that group figures or notes. */
export const PANEL =
  "rounded-3xl bg-dark/[0.03] ring-1 ring-dark/[0.06] dark:bg-white/[0.04] dark:ring-white/[0.08]";

export function Section({
  className,
  containerClassName,
  children,
  id,
  ...rest
}: React.HTMLAttributes<HTMLElement> & { containerClassName?: string }) {
  return (
    <section id={id} className={cn(SECTION_Y, className)} {...rest}>
      <div className={cn(CONTAINER, containerClassName)}>{children}</div>
    </section>
  );
}

/**
 * Section heading: title, optional lead, optional trailing action (a button
 * or carousel arrows) aligned to the title's baseline row on `md+`.
 */
export function SectionHeading({
  title,
  lead,
  trailing,
  as: Tag = "h2",
  id,
  className,
}: {
  title?: React.ReactNode;
  lead?: React.ReactNode;
  trailing?: React.ReactNode;
  as?: "h1" | "h2";
  id?: string;
  className?: string;
}) {
  if (!title && !lead && !trailing) return null;
  const text = (
    <div className={cn("min-w-0", MEASURE)}>
      {title ? (
        <Tag id={id} className={SECTION_TITLE}>
          {title}
        </Tag>
      ) : null}
      {lead ? <p className={cn(SECTION_LEAD, title ? "mt-3" : undefined)}>{lead}</p> : null}
    </div>
  );
  if (!trailing) return <div className={cn("mb-8 md:mb-10", className)}>{text}</div>;
  return (
    <div
      className={cn(
        "mb-8 md:mb-10 flex flex-col gap-5 md:flex-row md:items-end md:justify-between md:gap-10",
        className,
      )}
    >
      {text}
      <div className="shrink-0">{trailing}</div>
    </div>
  );
}

/**
 * Columns for a grid of `n` equal cards that leaves the last row as full as
 * possible: 4 cards read as one row of four, not three and an orphan.
 */
export function balancedGridClass(n: number): string {
  if (n <= 1) return "grid gap-6";
  if (n === 2) return "grid gap-6 sm:grid-cols-2";
  const fill = (cols: number) => (n % cols === 0 ? 1 : (n % cols) / cols);
  return fill(4) > fill(3)
    ? "grid gap-6 sm:grid-cols-2 lg:grid-cols-4"
    : "grid gap-6 sm:grid-cols-2 lg:grid-cols-3";
}
