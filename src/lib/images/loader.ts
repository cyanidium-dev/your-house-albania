/**
 * Global `next/image` loader (wired up through `images.loaderFile`).
 *
 * Every photograph on this site comes from the Sanity CDN, and every call site
 * used to opt those out of optimisation with a remote-URL check
 * because remote hosts were never added to `images.remotePatterns`. The result
 * was that Sanity served the untouched original on every page: 3.4 MB JPEGs and
 * 3.3 MB PNGs on the home page, ~9 MB of gallery originals on a property page.
 *
 * The Sanity CDN can resize and re-encode on its own, so rather than proxying
 * those bytes through Vercel's optimiser we hand the work to the CDN and let
 * `next/image` keep generating the `srcset` — which is what makes `sizes` mean
 * anything. Local assets under /public still go through the built-in optimiser.
 */

import { CANONICAL_IMAGE_WIDTH, canonicalPropertyImageUrl, parseSanityImageUrl } from "./propertyImageUrl";

const SANITY_IMAGE_PREFIX = "https://cdn.sanity.io/images/";

/** Sanity re-encodes on the fly; 72 is visually clean and well below the default. */
const SANITY_DEFAULT_QUALITY = 72;

type LoaderArgs = {
  src: string;
  width: number;
  quality?: number;
};

export default function imageLoader({ src: input, width, quality }: LoaderArgs): string {
  let src = input;
  if (src.startsWith(SANITY_IMAGE_PREFIX)) {
    // A listing photo arrives with a readable file name on the end of its path
    // (see propertyImageUrl.ts). That name belongs to exactly one variant — the
    // canonical one the sitemap and JSON-LD also publish — so every width at
    // or above it collapses onto that URL, and it becomes the `src`. The
    // smaller candidates drop the name: they are not what gets indexed, and
    // forty characters on each of them is markup nobody reads.
    const named = parseSanityImageUrl(src);
    if (named?.vanity) {
      if (width >= CANONICAL_IMAGE_WIDTH && quality === undefined) {
        return canonicalPropertyImageUrl(src);
      }
      src = named.query ? `${named.asset}?${named.query}` : named.asset;
    }

    const [path, existingQuery] = src.split("?");
    const params = new URLSearchParams(existingQuery ?? "");
    params.set("w", String(width));
    params.set("q", String(quality ?? SANITY_DEFAULT_QUALITY));
    // `auto=format` negotiates WebP/AVIF per request; `fit=max` never upscales
    // an asset that is already smaller than the requested width.
    params.set("auto", "format");
    params.set("fit", "max");
    return `${path}?${params.toString()}`;
  }

  // Any other remote host is one we cannot resize — pass it through untouched,
  // which is exactly what `unoptimized` used to do.
  if (src.startsWith("http://") || src.startsWith("https://")) {
    return src;
  }

  // Local assets: the built-in optimiser endpoint stays available even with a
  // custom loader, so /public images keep their WebP/AVIF variants.
  return `/_next/image?url=${encodeURIComponent(src)}&w=${width}&q=${quality ?? 75}`;
}
