/**
 * Limits shared by the route and the browser.
 *
 * Kept apart from `config.ts` on purpose: that module reads server-only
 * environment variables, and the chat UI needs these numbers without dragging
 * server configuration into the client bundle.
 */

/**
 * Chat answers are short by design — a wall of text in a search widget is a
 * failure mode, not a feature. Deliberately far below the model's ceiling.
 */
export const AI_MAX_TOKENS = 1600

/** Tool round-trips per user message. One is the normal case; two covers a retry. */
export const AI_MAX_TOOL_HOPS = 3

/** User messages allowed in one conversation before the UI asks to start over. */
export const AI_MAX_TURNS = 14

/** Longest accepted user message, characters. Enforced on both sides. */
export const AI_MAX_MESSAGE_CHARS = 600

/** Property cards one answer may show. */
export const AI_MAX_CARDS = 4

/** Requests per IP per window, and the window in milliseconds. */
export const AI_RATE_LIMIT = { requests: 20, windowMs: 60 * 60 * 1000 } as const
