"use client";

import Link from "next/link";

export type BreadcrumbItem = {
  label: string;
  href?: string;
};

type Props = {
  items: BreadcrumbItem[];
  separator?: string;
};

export function Breadcrumb({ items, separator = "/" }: Props) {
  if (items.length === 0) return null;

  return (
    <nav
      aria-label="Breadcrumb"
      className="flex flex-wrap items-center gap-x-1.5 gap-y-1 text-sm text-dark/70 dark:text-white/70 mb-4"
    >
      <ol className="flex flex-wrap items-center gap-x-1.5 gap-y-1 list-none p-0 m-0">
        {items.map((item, idx) => (
          <li key={idx} className="flex items-center gap-x-1.5">
            {idx > 0 && (
              <span className="text-dark/40 dark:text-white/40" aria-hidden>
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
