/**
 * The lead funnel and the owner's 1 % for a period, from the `lead`
 * documents in Sanity (reports/domlivo-leads-funnel.md).
 *
 *   npx tsx --env-file=.env --env-file=.env.local scripts/leads-funnel.ts
 *   npx tsx --env-file=.env --env-file=.env.local scripts/leads-funnel.ts --from 2026-10-01 --to 2026-11-01
 *   npx tsx --env-file=.env --env-file=.env.local scripts/leads-funnel.ts --from 2026-10-01 --deals
 *
 * `--from` is inclusive, `--to` exclusive (default: today + 1 day); without
 * `--from` the period starts at the first lead. `--deals` lists every deal
 * of the period with its price. Reads with SANITY_API_TOKEN; writes nothing.
 */

import { createClient } from '@sanity/client'
import { computeFunnel, formatFunnel, reachedAt, type FunnelLead } from '../src/lib/leads/funnel'
import { formatEuro, leadCode, leadWho } from '../src/lib/leads/status'

const projectId = process.env.SANITY_PROJECT_ID ?? process.env.NEXT_PUBLIC_SANITY_PROJECT_ID ?? 'g4aqp6ex'
const dataset = process.env.SANITY_DATASET ?? process.env.NEXT_PUBLIC_SANITY_DATASET ?? 'production'
const token = process.env.SANITY_API_TOKEN

function arg(name: string): string | undefined {
  const i = process.argv.indexOf(`--${name}`)
  return i >= 0 ? process.argv[i + 1] : undefined
}

function day(v: string | undefined, fallback: Date): Date {
  if (!v) return fallback
  const d = new Date(`${v}T00:00:00Z`)
  if (Number.isNaN(d.getTime())) throw new Error(`Not a date: ${v} (expected YYYY-MM-DD)`)
  return d
}

async function main() {
  if (!token) throw new Error('SANITY_API_TOKEN is not set (.env.local)')
  const client = createClient({ projectId, dataset, apiVersion: '2024-01-01', token, useCdn: false })
  const leads = await client.fetch<FunnelLead[]>(`*[_type == "lead" && !(_id in path("drafts.**"))]{
    _id, type, status, internal, createdAt, statusUpdatedAt, "statusHistory": statusHistory[]{status, at},
    name, phone, email, telegramUsername, propertyTitle, propertySlug, dealPrice
  }`)
  const first = leads.reduce((min, l) => (l.createdAt < min ? l.createdAt : min), new Date().toISOString())
  const from = day(arg('from'), new Date(first))
  const to = day(arg('to'), new Date(Date.now() + 86_400_000))
  const f = computeFunnel(leads, from, to)

  console.log(`Воронка ${from.toISOString().slice(0, 10)} - ${to.toISOString().slice(0, 10)}\n`)
  console.log(formatFunnel(f))

  if (process.argv.includes('--deals')) {
    const deals = leads.filter((l) => {
      const at = l.status === 'won' ? (reachedAt(l, 'won') ?? new Date(l.createdAt)) : null
      return at && at >= from && at < to && l.internal !== true
    })
    console.log(`\nСделки: ${deals.length ? '' : 'нет'}`)
    for (const l of deals) {
      console.log(`#${leadCode(l._id)}  ${leadWho(l) || l.type}  ${l.dealPrice ? formatEuro(l.dealPrice) : 'цена не указана'}  (${l._id})`)
    }
  }
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err)
  process.exit(1)
})
