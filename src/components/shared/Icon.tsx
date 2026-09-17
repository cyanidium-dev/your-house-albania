"use client";

import { Icon as IconifyIcon, type IconProps } from "@iconify/react";

import "@/lib/icons/bundle";

/**
 * The site's icon entry point. Import from here, not from `@iconify/react`.
 *
 * Two things were wrong with using the library's component directly:
 *
 * 1. It fetches every icon it has not seen from api.iconify.design, so each
 *    page opened with three blocking requests to a third party. The bundle
 *    imported above registers the icons this codebase names, up front.
 * 2. `IconComponent` starts with `useState(!!props.ssr)` — without that prop it
 *    deliberately renders an empty, zero-width span on the first pass and only
 *    swaps in the real icon after hydration. On a listing page that is a
 *    hundred-odd icons appearing at once and pushing the cards down; it was
 *    the bulk of the pages' layout shift.
 *
 * So the default here is `ssr`, which callers can still override. An icon key
 * that comes from the CMS and is not in the bundle behaves as it always did:
 * it resolves through the API, one round trip later.
 *
 * `"use client"` is required rather than incidental — `@iconify/react` is
 * itself a client package, so `addCollection` is a client reference that a
 * server component's module graph cannot call.
 */
export function Icon(props: IconProps) {
  return <IconifyIcon ssr {...props} />;
}

export type { IconProps };
