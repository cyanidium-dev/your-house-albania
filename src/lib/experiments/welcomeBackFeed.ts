/**
 * Experiment E002: "welcome back" picks for returning visitors.
 * See docs/experiments/002-welcome-back-feed.md for the hypothesis, metric
 * and review date.
 *
 * The flag is read only for a visitor who would actually see the prompt
 * (returning, on the home page or a listings page, with at least two picks),
 * so control and test hold the same kind of visitor. Anyone PostHog has not
 * bucketed (no analytics consent, flags loading, flag deleted) sees nothing,
 * which is the site as it was.
 */

export const WELCOME_BACK_FLAG = 'welcome-back-feed'

/** `control`: nothing new. `test`: the prompt and the picks. */
export const WELCOME_BACK_VARIANTS = ['control', 'test'] as const

/** Where the prompt may appear: the home page and the listing pages. */
export function isWelcomeBackPath(pathname: string): boolean {
  const p = pathname.replace(/\/+$/, '')
  if (/^\/[a-z]{2}$/.test(p)) return true
  if (/\/(property|blog|guides|ai-search|favorites|contacts|partners)(\/|$)/.test(p)) return false
  return /^\/[a-z]{2}\/(catalog|sale)(\/|$)/.test(p) || /^\/[a-z]{2}\/albania\/[^/]+/.test(p)
}
