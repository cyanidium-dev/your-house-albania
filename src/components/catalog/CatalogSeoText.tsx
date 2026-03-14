"use client";

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
};

export function CatalogSeoText({ content }: Props) {
  if (!Array.isArray(content) || content.length === 0) return null;

  return (
    <div className="py-6">
      <PortableText value={content as PortableTextBlock[]} components={components} />
    </div>
  );
}
