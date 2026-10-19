/**
 * Points the public Telegram bot at the site and sets its profile texts in the
 * seven site languages. Run once by the owner after creating the bot, and
 * again whenever the texts or the domain change. See docs/messenger-leads.md.
 *
 *   node --env-file=.env.local scripts/telegram-set-webhook.ts
 *   node --env-file=.env.local scripts/telegram-set-webhook.ts --info
 *   node --env-file=.env.local scripts/telegram-set-webhook.ts --delete
 *
 * Reads TELEGRAM_PUBLIC_BOT_TOKEN, TELEGRAM_WEBHOOK_SECRET and (optionally)
 * NEXT_PUBLIC_SITE_URL (default https://www.domlivo.com) and
 * NEXT_PUBLIC_TELEGRAM_BOT_USERNAME (checked against the token's bot).
 * The texts come from `TelegramBot` in messages/*.json. Node >= 22.6.
 *
 * The token never leaves this process except to api.telegram.org, and is
 * never printed.
 */

import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const LOCALES = ['en', 'uk', 'ru', 'sq', 'it', 'pl', 'de'] as const

type BotTexts = { commandStart: string; commandStop: string; description: string; shortDescription: string }

const token = process.env.TELEGRAM_PUBLIC_BOT_TOKEN?.trim()
const secret = process.env.TELEGRAM_WEBHOOK_SECRET?.trim()
const site = (process.env.NEXT_PUBLIC_SITE_URL?.trim() || 'https://www.domlivo.com').replace(/\/$/, '')
const expectedUsername = process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME?.trim().replace(/^@/, '')

if (!token) {
  console.error('TELEGRAM_PUBLIC_BOT_TOKEN is not set.')
  process.exit(1)
}

async function call<T = unknown>(method: string, body: Record<string, unknown> = {}): Promise<T> {
  const res = await fetch(`https://api.telegram.org/bot${token}/${method}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  const data = (await res.json()) as { ok: boolean; result?: T; description?: string }
  if (!data.ok) throw new Error(`${method}: ${data.description ?? res.status}`)
  return data.result as T
}

function texts(locale: (typeof LOCALES)[number]): BotTexts {
  const file = join(import.meta.dirname, '..', 'messages', `${locale}.json`)
  const json = JSON.parse(readFileSync(file, 'utf8')) as { TelegramBot?: BotTexts }
  if (!json.TelegramBot) throw new Error(`messages/${locale}.json has no TelegramBot section`)
  return json.TelegramBot
}

async function main() {
  const args = new Set(process.argv.slice(2))
  const me = await call<{ username: string; id: number }>('getMe')
  console.log(`Bot: @${me.username} (id ${me.id})`)
  if (expectedUsername && expectedUsername.toLowerCase() !== me.username.toLowerCase()) {
    console.warn(`! NEXT_PUBLIC_TELEGRAM_BOT_USERNAME is "${expectedUsername}", the token belongs to "@${me.username}".`)
  }

  if (args.has('--info')) {
    console.log(await call('getWebhookInfo'))
    return
  }
  if (args.has('--delete')) {
    await call('deleteWebhook')
    console.log('Webhook removed.')
    return
  }

  if (!secret || !/^[A-Za-z0-9_-]{16,256}$/.test(secret)) {
    console.error('TELEGRAM_WEBHOOK_SECRET must be 16–256 characters of A-Z a-z 0-9 _ -.')
    process.exit(1)
  }

  const url = `${site}/api/telegram/webhook`
  await call('setWebhook', {
    url,
    secret_token: secret,
    allowed_updates: ['message'],
    drop_pending_updates: true,
  })
  console.log(`Webhook → ${url}`)

  // English is also the default for every other app language.
  for (const locale of LOCALES) {
    const t = texts(locale)
    const lang = locale === 'en' ? {} : { language_code: locale }
    await call('setMyCommands', {
      commands: [
        { command: 'start', description: t.commandStart },
        { command: 'stop', description: t.commandStop },
      ],
      ...lang,
    })
    await call('setMyDescription', { description: t.description, ...lang })
    await call('setMyShortDescription', { short_description: t.shortDescription, ...lang })
    console.log(`Texts: ${locale}`)
  }

  const info = await call<{ url: string; pending_update_count: number; last_error_message?: string }>('getWebhookInfo')
  console.log(`OK. Pending updates: ${info.pending_update_count}${info.last_error_message ? `, last error: ${info.last_error_message}` : ''}`)
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err)
  process.exit(1)
})
