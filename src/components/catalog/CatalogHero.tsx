"use client";

import { PortableText, type PortableTextComponents } from "@portabletext/react";
import type { PortableTextBlock } from "@portabletext/types";
import { Icon } from "@iconify/react";
import type { ReactNode } from "react";

const introComponents: PortableTextComponents = {
  block: {
    normal: ({ children }) => (
      <p className="text-lg text-dark/50 dark:text-white/50 font-normal mt-3 first:mt-0">
        {children}
      </p>
    ),
    h1: ({ children }) => (
      <p className="text-lg text-dark/50 dark:text-white/50 font-normal mt-3 first:mt-0">
        {children}
      </p>
    ),
    h2: ({ children }) => (
      <p className="text-lg text-dark/50 dark:text-white/50 font-normal mt-3 first:mt-0">
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
    <div className="mt-3 max-w-2xl mx-auto">
      <PortableText value={intro as PortableTextBlock[]} components={introComponents} />
    </div>
  ) : (
    <p className="text-lg text-dark/50 dark:text-white/50 font-normal mt-3 w-full mx-auto">
      {introFallback}
    </p>
  );

  return (
    <section className="text-center bg-cover !pt-40 pb-20 relative overflow-x-hidden">
      <div className="container max-w-8xl mx-auto px-5 2xl:px-0">
        <div className="text-left">{breadcrumb}</div>
        <div className="flex gap-2.5 items-center justify-center mt-6">
          <span>
            <Icon
              icon="ph:house-simple-fill"
              width={20}
              height={20}
              className="text-primary"
            />
          </span>
          <p className="text-base font-semibold text-dark/75 dark:text-white/75">
            {badge}
          </p>
        </div>
        <h1 className="text-dark text-52 relative font-bold dark:text-white mt-2">
          {title}
        </h1>
        {subtitle}
      </div>
    </section>
  );
}
