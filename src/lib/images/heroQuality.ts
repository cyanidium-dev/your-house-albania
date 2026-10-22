/**
 * Whether a photo is good enough to fill a full-width hero.
 *
 * Listing photos arrive from agencies at any size: a 590x443 phone shot
 * stretched over a 1440px hero is a blur (owner, 2026-10-22: "шакальное
 * недоразумение"). Sanity encodes an asset's size in its URL
 * (`…-3200x2000.jpg`), so the check costs nothing. A hero needs a landscape
 * photo at least `MIN_HERO_WIDTH` wide; anything else falls back to the place's
 * own photograph (`lib/media/albaniaPhotos`).
 */
export const MIN_HERO_WIDTH = 1600;

export function sanityImageSize(url: string | null | undefined): { width: number; height: number } | null {
  if (!url) return null;
  const m = url.match(/-(\d{2,5})x(\d{2,5})\.(?:jpe?g|png|webp|avif)/i);
  return m ? { width: Number(m[1]), height: Number(m[2]) } : null;
}

export function isHeroQuality(url: string | null | undefined, minWidth = MIN_HERO_WIDTH): boolean {
  const size = sanityImageSize(url);
  // Landscape, and not a thin strip (a 1280x183 banner cannot fill a 21:9 box).
  return size !== null && size.width >= minWidth && size.width >= size.height && size.height * 3 >= size.width;
}
