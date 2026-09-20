/**
 * One address per photograph, for everything a search engine reads.
 *
 * Measured on production on 2026-09-20: the `<img src>` of a listing photo was
 * a `w=2560` variant, JSON-LD and the ItemList pointed at the untransformed
 * 1.2 MB original, and each asset was reachable under more than ten query
 * strings — all of them under a 40-character hash for a file name. Google
 * Images had nothing stable to index and nothing in the URL to read.
 *
 * The Sanity CDN ignores one extra path segment after the asset file, so
 *   …/images/<project>/<dataset>/<id>-<w>x<h>.jpg/<any-name>.jpg
 * serves the same bytes (checked with curl: same sha1, 200, same content
 * type). That segment is where the readable file name goes.
 *
 * Kept free of imports: `loader.ts` pulls this file in, and the next/image
 * loader is bundled on its own.
 */

/** The widest variant published anywhere. Listing photos are rarely wider. */
export const CANONICAL_IMAGE_WIDTH = 1600;
export const CANONICAL_IMAGE_QUERY = `w=${CANONICAL_IMAGE_WIDTH}&fit=max&auto=format&q=75`;

const SANITY_IMAGE_RE =
  /^(https:\/\/cdn\.sanity\.io\/images\/[^/?#]+\/[^/?#]+\/[^/?#]+\.([a-z0-9]+))(\/[^/?#]+)?(?:\?([^#]*))?$/i;

export type SanityImageUrlParts = {
  /** `https://cdn.sanity.io/images/<project>/<dataset>/<id>-<w>x<h>.<ext>` */
  asset: string;
  ext: string;
  /** `/<name>.<ext>` when the URL carries a readable file name, else "". */
  vanity: string;
  query: string;
};

export function parseSanityImageUrl(url: string): SanityImageUrlParts | null {
  const m = SANITY_IMAGE_RE.exec(url);
  if (!m) return null;
  return { asset: m[1], ext: m[2].toLowerCase(), vanity: m[3] ?? "", query: m[4] ?? "" };
}

function slugPart(value: string | null | undefined): string {
  return (value ?? "")
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export type PropertyImageNameInput = {
  typeSlug?: string | null;
  bedrooms?: number | null;
  districtSlug?: string | null;
  citySlug?: string | null;
};

/**
 * `apartment-1-1-plazh-durres` — built from slugs, never from titles, so the
 * seven locale pages of a listing all name the photo identically and the image
 * keeps a single URL. The `N+1` room notation is the one the catalogue's own
 * facet paths use (`/1-1`, `/2-1`), and only flats are described that way.
 */
export function propertyImageSeoName(input: PropertyImageNameInput): string {
  const type = slugPart(input.typeSlug) || "property";
  const beds = input.bedrooms;
  const rooms =
    type === "apartment" && typeof beds === "number" && Number.isInteger(beds) && beds >= 1 && beds <= 9
      ? `${beds}-1`
      : "";
  const district = slugPart(input.districtSlug);
  const city = slugPart(input.citySlug);
  // A district slug that already ends in its city ("plazh-durres") would
  // otherwise say the city twice.
  const place =
    district && city && (district === city || district.endsWith(`-${city}`)) ? [district] : [district, city];
  return [type, rooms, ...place].filter(Boolean).join("-");
}

/**
 * Puts the readable name on a Sanity asset URL: `<asset>/<name>-<n>.<ext>`.
 * `position` is 1-based — the photo's place in the gallery. Anything that is
 * not a Sanity image URL comes back untouched.
 */
export function withImageSeoName(url: string, seoName: string, position: number): string {
  const parts = parseSanityImageUrl(url);
  const name = slugPart(seoName);
  if (!parts || !name) return url;
  const n = Number.isInteger(position) && position > 0 ? `-${position}` : "";
  const query = parts.query ? `?${parts.query}` : "";
  return `${parts.asset}/${name}${n}.${parts.ext}${query}`;
}

/**
 * The single variant that JSON-LD, the ItemList, the image sitemap and the
 * `<img src>` all agree on. Any existing query is dropped — crop and hotspot
 * parameters would mint a second address for the same photograph.
 */
export function canonicalPropertyImageUrl(url: string): string {
  const parts = parseSanityImageUrl(url);
  if (!parts) return url;
  return `${parts.asset}${parts.vanity}?${CANONICAL_IMAGE_QUERY}`;
}
