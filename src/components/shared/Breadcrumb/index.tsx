"use client";

import Link from "next/link";
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

export function Breadcrumb({ items, separator = "/", overHero = false }: Props) {
  if (items.length === 0) return null;

  return (
    <nav
      aria-label="Breadcrumb"
      className={cn(
        "flex flex-wrap items-center gap-x-1.5 gap-y-1 text-sm mb-4",
        overHero
          ? "text-white/90 [&_a]:text-white/90 [&_a]:hover:text-primary [&_a]:transition-colors [&_span]:text-white/70 [&_.font-medium]:text-white"
          : "text-dark/70 dark:text-white/70"
      )}
    >
      <ol className="flex flex-wrap items-center gap-x-1.5 gap-y-1 list-none p-0 m-0">
        {items.map((item, idx) => (
          <li key={idx} className="flex items-center gap-x-1.5">
            {idx > 0 && (
              <span className={overHero ? "text-white/60" : "text-dark/40 dark:text-white/40"} aria-hidden>
                {separator}
              </span>
            )}
            {item.href ? (
              <Link
                href={item.href}
                className="hover:text-primary transition-colors"
              >
                {item.label}
              </Link>
            ) : (
              <span
                className="text-dark dark:text-white font-medium"
                aria-current="page"
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
