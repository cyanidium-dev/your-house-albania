"use client";

import { PortableText, type PortableTextComponents } from "@portabletext/react";
import type { PortableTextBlock } from "@portabletext/types";
import { Icon } from "@iconify/react";
import type { ReactNode } from "react";

const introComponents: PortableTextComponents = {
  block: {
    normal: ({ children }) => (
      <p className="text-lg text-dark/50 dark:text-white/50 font-normal mt-2 first:mt-0 md:mt-3 md:first:mt-0">
        {children}
      </p>
    ),
    h1: ({ children }) => (
      <p className="text-lg text-dark/50 dark:text-white/50 font-normal mt-2 first:mt-0 md:mt-3 md:first:mt-0">
        {children}
      </p>
    ),
    h2: ({ children }) => (
      <p className="text-lg text-dark/50 dark:text-white/50 font-normal mt-2 first:mt-0 md:mt-3 md:first:mt-0">
        {children}
      </p>
    ),
  },
};

type Props = {
  title: string;
  badge: string;
  intro: unknown[] | null;
  introFallback: string;
  breadcrumb: ReactNode;
};

export function CatalogHero({
  title,
  badge,
  intro,
  introFallback,
  breadcrumb,
}: Props) {
  const hasIntro = Array.isArray(intro) && intro.length > 0;
  const subtitle = hasIntro ? (
    <div className="mt-2 max-w-2xl mx-auto md:mt-3">
      <PortableText
        value={intro as PortableTextBlock[]}
        components={introComponents}
      />
    </div>
  ) : (
    <p className="text-lg text-dark/50 dark:text-white/50 font-normal mt-2 w-full mx-auto md:mt-3">
      {introFallback}
    </p>
  );

  return (
    <section className="text-center bg-cover pt-16 pb-10 md:pt-32 md:pb-16 relative overflow-x-hidden">
      <div className="container max-w-8xl mx-auto px-5 2xl:px-0">
        <div className="text-left">{breadcrumb}</div>
        <div className="flex flex-wrap gap-2.5 items-center justify-center mt-3 md:mt-6 min-w-0">
          <span className="shrink-0">
            <Icon
              icon="ph:house-simple-fill"
              width={20}
              height={20}
              className="text-primary"
            />
          </span>
          <p className="text-base font-semibold text-dark/75 dark:text-white/75 min-w-0 truncate max-w-full">
            {badge}
          </p>
        </div>
        <h1 className="text-dark text-3xl sm:text-4xl md:text-5xl lg:text-6xl relative font-bold dark:text-white mt-1.5 md:mt-2">
          {title}
        </h1>
        {subtitle}
      </div>
    </section>
  );
}
