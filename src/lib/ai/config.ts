/**
 * Server-side configuration for the AI property search.
 *
 * Only the pieces that read the environment live here; the numeric limits the
 * browser also needs are in `limits.ts` so the chat UI can import them without
 * pulling server configuration into the client bundle.
 */

export {
  AI_MAX_CARDS,
  AI_MAX_MESSAGE_CHARS,
  AI_MAX_TOKENS,
  AI_MAX_TOOL_HOPS,
  AI_MAX_TURNS,
  AI_RATE_LIMIT,
} from './limits'

/**
 * Anthropic model id. Sonnet 5 is the agreed tier for this surface; the
 * override exists so a different tier can be compared without a code change.
 */
export const AI_MODEL = process.env.ANTHROPIC_MODEL?.trim() || 'claude-sonnet-5'

/**
 * True when the route can actually reach the API. Every surface checks this and
 * degrades to the ordinary catalog rather than rendering a chat that 500s.
 */
export function isAiSearchEnabled(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY?.trim())
}
