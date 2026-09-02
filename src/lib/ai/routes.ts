/**
 * Route helper for the assistant page.
 *
 * A static segment under `/[locale]`, so it wins over the `[country]` dynamic
 * segment that resolves single-segment paths. Kept in one place because the
 * hero input, the header button and the page itself all need to agree on it.
 */

export const AI_SEARCH_SEGMENT = 'ai-search'

export function aiSearchPath(locale: string): string {
  return `/${locale}/${AI_SEARCH_SEGMENT}`
}
