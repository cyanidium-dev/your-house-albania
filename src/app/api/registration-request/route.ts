import { NextResponse } from 'next/server'
import {
  resolveAgentContactTelegramRouting,
  resolveTelegramBotToken,
} from '@/lib/notifications/agentContact/routing'
import { sendTelegramTextMessage } from '@/lib/notifications/agentContact/telegramBotSend'
import { formatTelegramRegistrationRequestMessage } from '@/lib/notifications/registrationRequest/formatTelegramRegistrationRequest'
// Sanity persistence is temporarily disabled in POST — see comments below and
// docs/registration-request-sanity-frontend-contract.md
// import { createRegistrationRequest } from '@/lib/sanity/writeClient'

const ALLOWED_LANGUAGES = new Set(['en', 'uk', 'ru', 'sq', 'it'])
const ALLOWED_REALTOR_OR_AGENCY = new Set(['realtor', 'agency'])

const MAX_LEN = 500

type Body = {
  name?: string
  phone?: string
  email?: string
  language?: string
  realtorOrAgency?: string
  /** Honeypot — must stay empty for real users. */
  companyWebsite?: string
}

function isNonEmptyString(v: unknown): v is string {
  return typeof v === 'string' && v.trim().length > 0
}

function jsonError(status: number, error: string) {
  return NextResponse.json({ ok: false as const, error }, { status })
}

function jsonOk() {
  return NextResponse.json({ ok: true as const })
}

export async function POST(request: Request) {
  let body: Body
  try {
    body = (await request.json()) as Body
  } catch {
    return jsonError(400, 'Invalid JSON')
  }

  const hp =
    typeof body.companyWebsite === 'string' ? body.companyWebsite.trim() : ''
  if (hp.length > 0) {
    console.warn('[registration-request] rejected (honeypot)')
    return jsonError(400, 'Bad request')
  }

  if (!isNonEmptyString(body.name)) {
    return jsonError(400, 'Missing name')
  }
  if (!isNonEmptyString(body.phone)) {
    return jsonError(400, 'Missing phone')
  }
  if (typeof body.language !== 'string' || !ALLOWED_LANGUAGES.has(body.language)) {
    return jsonError(400, 'Invalid language')
  }

  const name = body.name.trim()
  const phone = body.phone.trim()
  if (name.length > MAX_LEN || phone.length > MAX_LEN) {
    return jsonError(400, 'Invalid input')
  }

  let email: string | undefined
  if (body.email !== undefined && body.email !== null) {
    const raw = typeof body.email === 'string' ? body.email.trim() : ''
    if (raw.length > 0) {
      if (raw.length > MAX_LEN) {
        return jsonError(400, 'Invalid email')
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(raw)) {
        return jsonError(400, 'Invalid email')
      }
      email = raw
    }
  }

  let realtorOrAgency: 'realtor' | 'agency' | undefined
  if (body.realtorOrAgency !== undefined && body.realtorOrAgency !== null) {
    const v =
      typeof body.realtorOrAgency === 'string' ? body.realtorOrAgency.trim() : ''
    if (v.length > 0) {
      if (!ALLOWED_REALTOR_OR_AGENCY.has(v)) {
        return jsonError(400, 'Invalid type')
      }
      realtorOrAgency = v as 'realtor' | 'agency'
    }
  }

  const botToken = resolveTelegramBotToken()
  const chatId = resolveAgentContactTelegramRouting().generalChatId
  if (!botToken || !chatId) {
    console.error('[registration-request] Telegram not configured', {
      hasBotToken: !!botToken,
      hasChatId: !!chatId,
    })
    return jsonError(500, 'Submission failed')
  }

  const text = formatTelegramRegistrationRequestMessage({
    name,
    phone,
    language: body.language,
    ...(email !== undefined ? { email } : {}),
    ...(realtorOrAgency !== undefined ? { realtorOrAgency } : {}),
  })

  console.log('[registration-request] sending Telegram', {
    chatIdLength: chatId.length,
    textLength: text.length,
  })

  const delivery = await sendTelegramTextMessage({
    botToken,
    chatId,
    text,
  })

  if (!delivery.ok) {
    console.error('[registration-request] Telegram delivery failed', delivery.reason)
    return jsonError(500, 'Submission failed')
  }

  // ---------------------------------------------------------------------------
  // TEMPORARY — Telegram-first phase: do not create `registrationRequest` in
  // Sanity (avoids CMS noise). `createRegistrationRequest` in
  // `@/lib/sanity/writeClient` remains the canonical helper for when persistence
  // is turned back on. Re-enable by importing `createRegistrationRequest` and
  // uncommenting the block below (typically after Telegram send, or replace
  // Telegram-only policy — product decision).
  //
  // import { createRegistrationRequest } from '@/lib/sanity/writeClient'
  //
  // const sanityResult = await createRegistrationRequest({
  //   name,
  //   phone,
  //   language: body.language,
  //   ...(email !== undefined ? { email } : {}),
  //   ...(realtorOrAgency !== undefined ? { realtorOrAgency } : {}),
  // })
  // if (!sanityResult.ok) {
  //   console.error('[registration-request] create failed', sanityResult.reason)
  //   return jsonError(500, 'Submission failed')
  // }
  // ---------------------------------------------------------------------------

  return jsonOk()
}
