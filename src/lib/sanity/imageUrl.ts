import { createImageUrlBuilder } from '@sanity/image-url'

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID ?? ''
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET ?? 'production'

const builder = createImageUrlBuilder({
  projectId,
  dataset,
})

/**
 * Builds a Sanity image URL from an image object (asset reference, expanded asset, or asset stub).
 * Returns undefined if the source cannot produce a valid URL.
 */
export function urlFor(
  source:
    | string
    | { asset?: { url?: string; _id?: string; _ref?: string }; crop?: unknown; hotspot?: unknown }
    | null
    | undefined
): string | undefined {
  if (!source) return undefined
  try {
    const url = builder.image(source as never).url()
    return typeof url === 'string' && url.length > 0 ? url : undefined
  } catch {
    return undefined
  }
}
