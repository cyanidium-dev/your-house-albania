/**
 * Text helpers for anything that ends up inside a model request.
 *
 * The API reads its body as JSON, and JSON cannot encode half of a surrogate
 * pair. A plain `slice()` that lands in the middle of an emoji leaves exactly
 * that, and the whole turn comes back as
 * "The request body is not valid JSON: no low surrogate in string" — one
 * listing with an emoji in its description is enough to take the assistant
 * down for every visitor.
 */

/** Removes surrogate code units that have lost their other half. */
export function stripLoneSurrogates(value: string): string {
  return value
    .replace(/[\uD800-\uDBFF](?![\uDC00-\uDFFF])/g, '')
    .replace(/(?<![\uD800-\uDBFF])[\uDC00-\uDFFF]/g, '')
}

/**
 * `slice(0, limit)` that never leaves a half character behind, and that also
 * cleans up lone surrogates the input arrived with.
 */
export function sliceSafe(value: string, limit: number): string {
  return stripLoneSurrogates(value.length <= limit ? value : value.slice(0, limit))
}
