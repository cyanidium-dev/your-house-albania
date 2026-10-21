/**
 * The lead funnel and the weekly summary the bot posts to each lead chat.
 * Pure; the cron route (`/api/cron/leads-weekly`) and the owner's script
 * (`scripts/leads-funnel.ts`) feed it the `lead` documents. No path aliases.
 */

import {
  formatEuro,
  formatShortDate,
  leadCode,
  leadWho,
  openCallbackData,
  TYPE_LABEL,
  type LeadCardRow,
  type TelegramPost,
} from './status'
import type { LeadStatus, LeadType } from './types'

export type FunnelLead = LeadCardRow & {
  internal?: boolean
  statusUpdatedAt?: string
  statusHistory?: { status: string; at: string }[]
  posts?: TelegramPost[]
}

/** The owner's share of a sale. */
export const OWNER_SHARE = 0.01

/** How far along a status is; `lost` and `spam` end a lead without a stage. */
const RANK: Partial<Record<LeadStatus, number>> = { new: 0, contacted: 1, qualified: 1, viewing: 2, negotiation: 3, won: 4 }

const STAGES = ['contacted', 'viewing', 'negotiation', 'won'] as const
type Stage = (typeof STAGES)[number]

/** Leads the funnel counts: real visitors, not tests, spam or agency sign-ups. */
export function countsInFunnel(l: FunnelLead): boolean {
  return l.internal !== true && l.status !== 'spam' && l.type !== 'registration'
}

/** The furthest stage a lead got to: its status now, or one it had before (a lost lead after a viewing). */
export function furthestRank(l: FunnelLead): number {
  let rank = RANK[l.status as LeadStatus] ?? 0
  for (const h of l.statusHistory ?? []) rank = Math.max(rank, RANK[h.status as LeadStatus] ?? 0)
  return rank
}

/** When the lead last moved to `status` (history first, then the current status' time). */
export function reachedAt(l: FunnelLead, status: string): Date | null {
  const times = (l.statusHistory ?? []).filter((h) => h.status === status).map((h) => new Date(h.at).getTime())
  if (l.status === status && l.statusUpdatedAt) times.push(new Date(l.statusUpdatedAt).getTime())
  const valid = times.filter((t) => Number.isFinite(t))
  return valid.length ? new Date(Math.max(...valid)) : null
}

function inRange(iso: string | Date | null | undefined, from: Date, to: Date): boolean {
  if (!iso) return false
  const t = new Date(iso).getTime()
  return t >= from.getTime() && t < to.getTime()
}

export type Funnel = {
  from: string
  to: string
  /** Cohort: leads created in the period, and how far they got. */
  leads: number
  byStage: Record<Stage, number>
  lost: number
  stillNew: number
  /** Events: deals marked won in the period, whenever the lead came in. */
  deals: number
  dealsWithoutPrice: number
  dealVolume: number
  ownerShare: number
}

export function computeFunnel(all: FunnelLead[], from: Date, to: Date): Funnel {
  const leads = all.filter(countsInFunnel)
  const cohort = leads.filter((l) => inRange(l.createdAt, from, to))
  const byStage = Object.fromEntries(
    STAGES.map((s, i) => [s, cohort.filter((l) => furthestRank(l) >= i + 1).length]),
  ) as Record<Stage, number>
  const won = leads.filter((l) => l.status === 'won' && inRange(reachedAt(l, 'won') ?? l.createdAt, from, to))
  const dealVolume = won.reduce((sum, l) => sum + (l.dealPrice ?? 0), 0)
  return {
    from: from.toISOString(),
    to: to.toISOString(),
    leads: cohort.length,
    byStage,
    lost: cohort.filter((l) => l.status === 'lost').length,
    stillNew: cohort.filter((l) => l.status === 'new').length,
    deals: won.length,
    dealsWithoutPrice: won.filter((l) => !l.dealPrice).length,
    dealVolume,
    ownerShare: Math.round(dealVolume * OWNER_SHARE),
  }
}

function pct(part: number, whole: number): string {
  return whole > 0 ? `${Math.round((part / whole) * 100)} %` : '-'
}

/** The funnel as a few lines of text, for the script and the owner's message. */
export function formatFunnel(f: Funnel): string {
  return [
    `Заявок: ${f.leads}`,
    `Связались: ${f.byStage.contacted} (${pct(f.byStage.contacted, f.leads)})`,
    `Просмотр: ${f.byStage.viewing} (${pct(f.byStage.viewing, f.leads)})`,
    `Торг: ${f.byStage.negotiation} (${pct(f.byStage.negotiation, f.leads)})`,
    `Сделка: ${f.byStage.won} (${pct(f.byStage.won, f.leads)})`,
    `Отказ: ${f.lost}, без статуса: ${f.stillNew}`,
    '',
    `Сделок закрыто за период: ${f.deals}${f.dealsWithoutPrice ? ` (без цены: ${f.dealsWithoutPrice})` : ''}`,
    `Сумма сделок: ${formatEuro(f.dealVolume)}`,
    `1 % владельца: ${formatEuro(f.ownerShare)}`,
  ].join('\n')
}

// --- Weekly summary -----------------------------------------------------------

const DAY = 24 * 60 * 60 * 1000
/** A lead with no status this long is listed for the team to sort out. */
export const STALE_DAYS = 3
const MAX_LISTED = 10

const IN_WORK: LeadStatus[] = ['contacted', 'qualified', 'viewing', 'negotiation']

/** Link to a message in a supergroup or channel; basic groups have none. */
export function messageLink(chatId: string, messageId: number): string | null {
  const m = /^-100(\d+)$/.exec(chatId)
  return m ? `https://t.me/c/${m[1]}/${messageId}` : null
}

export type WeeklySummary = {
  text: string
  /** Up to ten stale leads: one button each posts the lead again with its status buttons. */
  keyboard: { inline_keyboard: { text: string; callback_data: string }[][] } | null
}

/**
 * The Monday message of one chat: what came in last week, what is moving,
 * and the leads nobody touched for more than three days, by number. Plain
 * text. `leads` are that chat's leads. No price or share here: the partners
 * see the work, the owner sees the money (`formatFunnel`).
 */
export function formatWeeklySummary(leads: FunnelLead[], chatId: string, now: Date): WeeklySummary {
  const from = new Date(now.getTime() - 7 * DAY)
  const real = leads.filter(countsInFunnel)
  const fresh = real.filter((l) => inRange(l.createdAt, from, now)).length
  const inWork = real.filter((l) => IN_WORK.includes(l.status as LeadStatus))
  const viewings = real.filter((l) => inRange(reachedAt(l, 'viewing'), from, now)).length
  const deals = real.filter((l) => l.status === 'won' && inRange(reachedAt(l, 'won'), from, now)).length
  const staleBefore = now.getTime() - STALE_DAYS * DAY
  const stale = real
    .filter((l) => l.status === 'new' && new Date(l.createdAt).getTime() < staleBefore)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))

  const count = (s: LeadStatus) => inWork.filter((l) => l.status === s).length
  const work = [
    count('contacted') + count('qualified') ? `связались ${count('contacted') + count('qualified')}` : '',
    count('viewing') ? `просмотр ${count('viewing')}` : '',
    count('negotiation') ? `торг ${count('negotiation')}` : '',
  ].filter(Boolean)

  const lines = [
    `📊 Заявки за неделю (${formatShortDate(from.toISOString())}-${formatShortDate(new Date(now.getTime() - 1).toISOString())})`,
    '',
    `Новых заявок: ${fresh}`,
    `В работе: ${inWork.length}${work.length ? ` (${work.join(', ')})` : ''}`,
    `Просмотров за неделю: ${viewings}`,
    `Сделок за неделю: ${deals}`,
  ]
  if (stale.length === 0) {
    lines.push('', 'Заявок без статуса старше 3 дней нет 👍')
    return { text: lines.join('\n'), keyboard: null }
  }

  const listed = stale.slice(0, MAX_LISTED)
  lines.push('', `⏳ Без статуса больше ${STALE_DAYS} дней: ${stale.length}`)
  for (const l of listed) {
    const post = l.posts?.find((p) => String(p.chatId) === chatId)
    const link = post ? messageLink(chatId, post.messageId) : null
    const who = leadWho(l)
    lines.push(
      `#${leadCode(l._id)} ${formatShortDate(l.createdAt)}, ${TYPE_LABEL[l.type as LeadType] ?? l.type}${who ? `, ${who}` : ''}${link ? ` - ${link}` : ''}`,
    )
  }
  if (stale.length > listed.length) lines.push(`…и ещё ${stale.length - listed.length}`)
  lines.push('', 'Нажмите номер ниже - бот пришлёт заявку с кнопками статусов.')

  const buttons = listed.map((l) => ({ text: `#${leadCode(l._id)}`, callback_data: openCallbackData(l._id) }))
  const rows: { text: string; callback_data: string }[][] = []
  for (let i = 0; i < buttons.length; i += 5) rows.push(buttons.slice(i, i + 5))
  return { text: lines.join('\n'), keyboard: { inline_keyboard: rows } }
}
