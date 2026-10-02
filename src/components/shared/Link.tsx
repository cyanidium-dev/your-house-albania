"use client";

import NextLink from "next/link";
import type { ComponentProps } from "react";

import { isCrawlerClient } from "@/lib/seo/crawlerClient";

type LinkProps = ComponentProps<typeof NextLink>;

/**
 * `next/link` with prefetch switched off for crawlers.
 *
 * Import this instead of `next/link` everywhere (an ESLint rule is not in
 * place; `git grep "from 'next/link'"` should return only this file). The
 * prop set is identical, and a `prefetch` the caller passes always wins.
 *
 * `prefetch` leaves no trace in the DOM, so the server rendering it as
 * `undefined` and a crawler's browser rendering it as `false` is not a
 * hydration mismatch; Next reads the prop after mount, when it decides
 * whether to fetch. See lib/seo/crawlerClient for why.
 */
export default function Link({ prefetch, ...props }: LinkProps) {
  const resolved = prefetch !== undefined ? prefetch : isCrawlerClient() ? false : undefined;
  return <NextLink {...props} prefetch={resolved} />;
}
