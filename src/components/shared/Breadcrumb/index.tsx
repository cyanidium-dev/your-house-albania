import Link from "@/components/shared/Link";
import { getTranslations } from "next-intl/server";
import { cn } from "@/lib/utils";

export type BreadcrumbItem = {
  label: string;
  href?: string;
};

type Props = {
  items: BreadcrumbItem[];
  separator?: string;
  /** When true, uses light text for use over dark hero imagery */
  overHero?: boolean;
};

export async function Breadcrumb({ items, separator = "/", overHero = false }: Props) {
  if (items.length === 0) return null;
  const t = await getTranslations("Breadcrumbs");

  return (
    <nav
      aria-label={t("navLabel")}
      className={cn(
        // min-w-0 / overflow-hidden on the nav and the list: without them the
        // list grew to the full title width and the page scrolled sideways on
        // phones (listing 398px wide at 390, post 447px — visual audit 18.10).
        // Clipped sideways only, so the links' 44px tap zones are not cut.
        "flex min-w-0 max-w-full overflow-x-clip flex-wrap items-center gap-x-1.5 gap-y-1 text-sm mb-4",
        overHero
          ? "text-white/90 [&_a]:text-white/90 [&_a]:hover:text-primary [&_a]:transition-colors [&_span]:text-white/70 [&_.font-medium]:text-white"
          : "text-dark/70 dark:text-white/70"
      )}
    >
      <ol className="flex w-full min-w-0 max-w-full flex-wrap items-center gap-x-1.5 gap-y-1 list-none p-0 m-0">
        {items.map((item, idx) => (
          // min-w-0 + truncate: a long current page stays on one line with an
          // ellipsis (the H1 below repeats it) instead of wrapping beside a
          // separator left hanging at the start of the line. The last item
          // takes the remaining width, so the ellipsis has somewhere to land.
          <li
            key={idx}
            className={cn(
              "flex min-w-0 max-w-full items-center gap-x-1.5 py-1",
              idx === items.length - 1 && !item.href && "flex-1",
            )}
          >
            {idx > 0 && (
              <span className={overHero ? "text-white/60" : "text-dark/40 dark:text-white/40"} aria-hidden>
                {separator}
              </span>
            )}
            {item.href ? (
              <Link
                href={item.href}
                // tap-zone: the link is 20px tall; its hit area is 44px (audit M2).
                className="tap-zone relative hover:text-primary transition-colors"
              >
                {item.label}
              </Link>
            ) : (
              <span
                className="min-w-0 truncate text-dark dark:text-white font-medium"
                title={item.label}
                aria-current={idx === items.length - 1 ? "page" : undefined}
              >
                {item.label}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
