import type Anthropic from '@anthropic-ai/sdk'
import { after, type NextRequest } from 'next/server'
import { createAnthropicClient } from '@/lib/ai/client'
import { routing } from '@/i18n/routing'
import { getCatalogSnapshot } from '@/lib/ai/catalogSnapshot'
import { buildSystemBlocks } from '@/lib/ai/prompt'
import { AI_TOOLS, runShowProperties } from '@/lib/ai/tools'
import { checkRateLimit, clientKeyFromHeaders } from '@/lib/ai/rateLimit'
import { addUsage, EMPTY_USAGE, estimateUsd, isBudgetExhausted, recordUsage } from '@/lib/ai/budget'
import { encodeAiEvent, type AiChatMessage, type AiStreamEvent } from '@/lib/ai/events'
import {
  AI_MAX_MESSAGE_CHARS,
  AI_MAX_TOKENS,
  AI_MAX_TOOL_HOPS,
  AI_MAX_TURNS,
  AI_MODEL,
  isAiSearchEnabled,
} from '@/lib/ai/config'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
/** A tool hop plus a second generation pass fits comfortably; a hung upstream does not. */
export const maxDuration = 60

function parseMessages(raw: unknown): AiChatMessage[] | null {
  if (!Array.isArray(raw) || raw.length === 0) return null
  const out: AiChatMessage[] = []
  for (const entry of raw) {
    const role = (entry as { role?: unknown })?.role
    const content = (entry as { content?: unknown })?.content
    if (role !== 'user' && role !== 'assistant') return null
    if (typeof content !== 'string') return null
    const trimmed = content.trim()
    // An empty assistant turn happens when a previous answer was only cards;
    // it carries nothing for the model and the API rejects blank content.
    if (!trimmed) continue
    out.push({ role, content: trimmed.slice(0, AI_MAX_MESSAGE_CHARS) })
  }
  if (out.length === 0) return null
  if (out[out.length - 1].role !== 'user') return null
  return out
}

/** One SSE response carrying a single terminal error. */
function errorStream(event: Extract<AiStreamEvent, { type: 'error' }>, status: number): Response {
  return new Response(encodeAiEvent(event), {
    status,
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-store',
    },
  })
}

/**
 * Streaming assistant turn: model text goes out as it is generated, tool calls
 * are executed server-side, and their results go out twice — as `cards` for the
 * browser and as `tool_result` back into the model's next hop.
 */
export async function POST(req: NextRequest) {
  if (!isAiSearchEnabled()) {
    return errorStream({ type: 'error', code: 'unavailable' }, 503)
  }

  const limit = checkRateLimit(clientKeyFromHeaders(req.headers))
  if (!limit.allowed) {
    return errorStream(
      { type: 'error', code: 'rate_limited', retryAfterSec: limit.retryAfterSec },
      429,
    )
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return errorStream({ type: 'error', code: 'failed' }, 400)
  }

  const rawLocale = (body as { locale?: unknown })?.locale
  const locale =
    typeof rawLocale === 'string' && (routing.locales as readonly string[]).includes(rawLocale)
      ? rawLocale
      : routing.defaultLocale

  const messages = parseMessages((body as { messages?: unknown })?.messages)
  if (!messages) {
    return errorStream({ type: 'error', code: 'failed' }, 400)
  }
  const userTurns = messages.filter((m) => m.role === 'user').length
  if (userTurns > AI_MAX_TURNS) {
    return errorStream({ type: 'error', code: 'too_many_turns' }, 400)
  }

  // Checked after the cheap validations and before any billable call.
  if (await isBudgetExhausted()) {
    return errorStream({ type: 'error', code: 'budget_exhausted' }, 503)
  }

  const snapshot = await getCatalogSnapshot()
  const system = buildSystemBlocks(snapshot, locale)
  const client = createAnthropicClient()

  const conversation: Anthropic.MessageParam[] = messages.map((m) => ({
    role: m.role,
    content: m.content,
  }))

  const encoder = new TextEncoder()
  // Accumulated across hops and written once, so a two-hop answer costs one
  // Sanity write rather than two. Declared out here so the `after` callback
  // below closes over the final value.
  let turnUsage = EMPTY_USAGE

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (event: AiStreamEvent) => {
        controller.enqueue(encoder.encode(encodeAiEvent(event)))
      }

      try {
        for (let hop = 0; hop <= AI_MAX_TOOL_HOPS; hop += 1) {
          const modelStream = client.messages.stream({
            model: AI_MODEL,
            max_tokens: AI_MAX_TOKENS,
            thinking: { type: 'adaptive' },
            // Matching listings against a list already in context is not a
            // reasoning-heavy task, and this surface is latency-sensitive.
            output_config: { effort: 'low' },
            system,
            tools: AI_TOOLS,
            messages: conversation,
          })

          modelStream.on('text', (delta) => send({ type: 'text', delta }))

          const message = await modelStream.finalMessage()

          // Per-turn cost visibility. `cache_read_input_tokens` above zero is
          // the proof that the catalog prefix is being reused rather than
          // re-sent — the difference between ~$0.001 and ~$0.01 a reply.
          const usage = message.usage
          turnUsage = addUsage(turnUsage, {
            inputTokens: usage.input_tokens,
            outputTokens: usage.output_tokens,
            cacheReadTokens: usage.cache_read_input_tokens ?? 0,
            cacheWriteTokens: usage.cache_creation_input_tokens ?? 0,
          })
          console.log('[ai] usage', {
            hop,
            input: usage.input_tokens,
            output: usage.output_tokens,
            cacheRead: usage.cache_read_input_tokens ?? 0,
            cacheWrite: usage.cache_creation_input_tokens ?? 0,
          })

          conversation.push({ role: 'assistant', content: message.content })

          const toolUses = message.content.filter(
            (block): block is Anthropic.ToolUseBlock => block.type === 'tool_use',
          )
          if (toolUses.length === 0) break

          // Last hop reached: answer with what we have rather than looping.
          if (hop === AI_MAX_TOOL_HOPS) break

          const results: Anthropic.ToolResultBlockParam[] = []
          for (const toolUse of toolUses) {
            send({ type: 'tool_start', name: toolUse.name })

            if (toolUse.name !== 'show_properties') {
              results.push({
                type: 'tool_result',
                tool_use_id: toolUse.id,
                is_error: true,
                content: `Unknown tool: ${toolUse.name}`,
              })
              continue
            }

            try {
              const { model, ui } = await runShowProperties(toolUse.input, locale)
              if (ui.items.length > 0) {
                send({ type: 'cards', items: ui.items, catalogUrl: ui.catalogUrl })
              }
              results.push({
                type: 'tool_result',
                tool_use_id: toolUse.id,
                content: JSON.stringify(model),
              })
            } catch (err) {
              console.warn('[ai] tool execution failed:', err)
              results.push({
                type: 'tool_result',
                tool_use_id: toolUse.id,
                is_error: true,
                content: 'Catalog lookup failed. Tell the visitor and offer to try again.',
              })
            }
          }

          conversation.push({ role: 'user', content: results })
        }

        send({ type: 'done' })
      } catch (err) {
        console.error('[ai] chat turn failed:', err)
        send({ type: 'error', code: 'failed' })
      } finally {
        controller.close()
      }
    },
  })

  // Registered during the request, run once the response has finished. A bare
  // `void recordUsage(...)` after the stream closes does not survive on a
  // serverless platform: the invocation is frozen the moment the response ends
  // and the floating promise is dropped, which is why the first production
  // turns spent tokens without ever reaching the counter. `after` is the
  // supported way to keep the visitor's answer fast and still do the write.
  after(async () => {
    if (turnUsage.inputTokens === 0 && turnUsage.outputTokens === 0) return
    console.log('[ai] turn cost', { usd: estimateUsd(turnUsage).toFixed(4) })
    await recordUsage(turnUsage, { newDialogue: userTurns === 1 })
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-store, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  })
}
