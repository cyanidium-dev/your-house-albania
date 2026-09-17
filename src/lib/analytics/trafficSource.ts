/**
 * Where a visit came from, from what the browser can see on arrival: the
 * referrer host, UTM parameters and whether a Google Ads click id was present.
 *
 * Pure, so the rules are unit-tested rather than discovered in Telegram.
 * Precedence: UTMs > gclid > referrer > direct. A referrer from our own host is
 * navigation inside the site, not a source, and counts as direct.
 */

import type { DeviceClass, TrafficChannel } from '@/lib/leads/context'

export type ArrivalSignals = {
  /** `document.referrer` host, or empty. */
  referrerHost: string
  /** Our own host, so internal navigation is not a referral. */
  selfHost: string
  utmSource?: string
  utmMedium?: string
  utmCampaign?: string
  hasGclid: boolean
}

export type TrafficSource = {
  source: string
  medium: string
  channel: TrafficChannel
  campaign?: string
}

type HostRule = { name: string; pattern: RegExp }

/** `host` is `domain` or a subdomain of it. */
function hostRule(name: string, ...domains: string[]): HostRule {
  const alt = domains.map((d) => d.replace(/\./g, '\\.')).join('|')
  return { name, pattern: new RegExp(`(^|\\.)(${alt})$`, 'i') }
}

// AI first: gemini.google.com must not read as Google search.
const AI_RULES: HostRule[] = [
  hostRule('chatgpt', 'chatgpt.com', 'chat.openai.com'),
  hostRule('perplexity', 'perplexity.ai'),
  hostRule('copilot', 'copilot.microsoft.com'),
  hostRule('gemini', 'gemini.google.com'),
  hostRule('claude', 'claude.ai'),
]

const SEARCH_RULES: HostRule[] = [
  { name: 'google', pattern: /(^|\.)google\.[a-z]{2,3}(\.[a-z]{2})?$/i },
  hostRule('bing', 'bing.com'),
  hostRule('duckduckgo', 'duckduckgo.com'),
  { name: 'yandex', pattern: /(^|\.)(yandex\.[a-z]{2,3}(\.[a-z]{2})?|ya\.ru)$/i },
  { name: 'yahoo', pattern: /(^|\.)yahoo\.[a-z]{2,3}(\.[a-z]{2})?$/i },
  hostRule('qwant', 'qwant.com'),
  hostRule('ecosia', 'ecosia.org'),
]

const SOCIAL_RULES: HostRule[] = [
  hostRule('threads', 'threads.net', 'threads.com'),
  hostRule('instagram', 'instagram.com'),
  hostRule('facebook', 'facebook.com', 'fb.com', 'fb.me'),
  hostRule('telegram', 't.me', 'telegram.org', 'telegram.me'),
  hostRule('tiktok', 'tiktok.com'),
  hostRule('linkedin', 'linkedin.com', 'lnkd.in'),
]

function match(rules: HostRule[], host: string): string | undefined {
  return rules.find((r) => r.pattern.test(host))?.name
}

export function normalizeHost(host: string): string {
  return host.trim().toLowerCase().replace(/^www\./, '').replace(/\.$/, '')
}

/** `utm_source` written as a bare name ("google") or a host ("chatgpt.com"). */
function knownName(rules: HostRule[], value: string): string | undefined {
  const v = normalizeHost(value)
  return rules.find((r) => r.name === v)?.name ?? match(rules, v)
}

const PAID_MEDIUMS = /^(cpc|ppc|paid|paidsearch|paid_search|paid-search|cpm|display|banner|paid_social|paidsocial)$/i

export function classifyTraffic(signals: ArrivalSignals): TrafficSource {
  const utmSource = signals.utmSource?.trim()
  const utmMedium = signals.utmMedium?.trim()
  const campaign = signals.utmCampaign?.trim() || undefined
  const withCampaign = (t: Omit<TrafficSource, 'campaign'>): TrafficSource =>
    campaign ? { ...t, campaign } : t

  if (utmSource) {
    const source = utmSource.toLowerCase()
    const medium = (utmMedium || '(not set)').toLowerCase()
    let channel: TrafficChannel = 'campaign'
    if (PAID_MEDIUMS.test(medium)) {
      channel = knownName(SEARCH_RULES, source) ? 'paid_search' : 'campaign'
    } else if (knownName(AI_RULES, source)) {
      channel = 'ai'
    } else if (medium === 'email' || medium === 'newsletter') {
      channel = 'email'
    } else if (medium === 'social' || knownName(SOCIAL_RULES, source)) {
      channel = 'social'
    } else if (medium === 'organic' && knownName(SEARCH_RULES, source)) {
      channel = 'organic_search'
    } else if (medium === 'referral') {
      channel = 'referral'
    }
    return withCampaign({ source, medium, channel })
  }

  if (signals.hasGclid) {
    return withCampaign({ source: 'google', medium: 'cpc', channel: 'paid_search' })
  }

  const host = normalizeHost(signals.referrerHost)
  const self = normalizeHost(signals.selfHost)
  if (!host || (self && host === self)) {
    return withCampaign({ source: '(direct)', medium: '(none)', channel: 'direct' })
  }

  const ai = match(AI_RULES, host)
  if (ai) return withCampaign({ source: ai, medium: 'referral', channel: 'ai' })
  const search = match(SEARCH_RULES, host)
  if (search) return withCampaign({ source: search, medium: 'organic', channel: 'organic_search' })
  const social = match(SOCIAL_RULES, host)
  if (social) return withCampaign({ source: social, medium: 'social', channel: 'social' })
  return withCampaign({ source: host, medium: 'referral', channel: 'referral' })
}

/**
 * Device class from viewport width and user agent. The UA decides for phones
 * and tablets that say so; the width covers the rest, and a narrow window on a
 * UA that is clearly a desktop stays a desktop.
 */
export function classifyDevice(
  viewportWidth: number,
  userAgent: string,
  maxTouchPoints = 0
): DeviceClass {
  const ua = userAgent || ''
  if (/iPad|Tablet|PlayBook|Silk|Android(?!.*Mobile)/i.test(ua)) return 'tablet'
  if (/Mobi|iPhone|iPod|Android.*Mobile|Windows Phone|Opera Mini/i.test(ua)) return 'mobile'
  // iPadOS asks for desktop sites with a Mac UA; only the touch screen gives it away.
  if (/Macintosh/i.test(ua) && maxTouchPoints > 1) return 'tablet'
  if (!Number.isFinite(viewportWidth) || viewportWidth <= 0) return 'desktop'
  if (viewportWidth < 768 && !/Windows NT|Macintosh|X11|CrOS/i.test(ua)) return 'mobile'
  return 'desktop'
}
