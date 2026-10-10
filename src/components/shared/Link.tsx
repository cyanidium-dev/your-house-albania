"use client";

import NextLink from "next/link";
import { useState, type ComponentProps } from "react";

import { isCrawlerClient } from "@/lib/seo/crawlerClient";

type LinkProps = ComponentProps<typeof NextLink>;

/**
 * `next/link` that prefetches on intent rather than on sight.
 *
 * Import this instead of `next/link` everywhere (an ESLint rule is not in
 * place; `git grep "from 'next/link'"` should return only this file). The
 * prop set is identical, and a `prefetch` the caller passes always wins.
 *
 * Next's default prefetches every link that scrolls into view. On a listing
 * page that was ~25 `?_rsc=` requests (≈800 KB) plus the JavaScript of each
 * target route, all fetched and parsed while a phone was still hydrating the
 * page (Lighthouse mobile, 2026-10-10). Here a link starts with prefetch off
 * and switches to Next's default the moment the visitor shows intent —
 * pointer over it, a finger down on it, or keyboard focus — so the page it
 * leads to is still on its way before the click lands.
 *
 * Crawlers never get prefetch at all: Googlebot renders pages in a tall
 * headless Chrome where every link is "in view" (see lib/seo/crawlerClient).
 *
 * `prefetch` leaves no trace in the DOM, so the server rendering it as
 * `false` and the browser later switching it on is not a hydration mismatch.
 */
export default function Link({ prefetch, onMouseEnter, onTouchStart, onFocus, ...props }: LinkProps) {
  const [intent, setIntent] = useState(false);
  const resolved =
    prefetch !== undefined ? prefetch : isCrawlerClient() || !intent ? false : undefined;
  const arm = () => {
    if (!intent) setIntent(true);
  };
  return (
    <NextLink
      {...props}
      prefetch={resolved}
      onMouseEnter={(e) => {
        arm();
        onMouseEnter?.(e);
      }}
      onTouchStart={(e) => {
        arm();
        onTouchStart?.(e);
      }}
      onFocus={(e) => {
        arm();
        onFocus?.(e);
      }}
    />
  );
}
