/**
 * Campaign links for the panel's UTM builder. Presets are chosen so that
 * `classifyTraffic` files each arrival under the intended channel — the test
 * next to this file checks every one of them.
 */

export const UTM_PRESETS = {
  telegram: { source: 'telegram', medium: 'messenger', label: 'Telegram' },
  whatsapp: { source: 'whatsapp', medium: 'messenger', label: 'WhatsApp' },
  instagram: { source: 'instagram', medium: 'social', label: 'Instagram' },
  facebook: { source: 'facebook', medium: 'social', label: 'Facebook' },
  linkedin: { source: 'linkedin', medium: 'social', label: 'LinkedIn' },
  email: { source: 'email', medium: 'email', label: 'Email' },
} as const

export type UtmPreset = keyof typeof UTM_PRESETS

/** Campaign names in one spelling, so "Spring Sale" and "spring-sale" are one row. */
export function slugCampaign(v: string): string {
  return v
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60)
}

const SITE_HOSTS = ['domlivo.com', 'www.domlivo.com']

export type UtmLink = { url: string; warning?: string } | { error: string }

export function buildUtmLink(input: string, preset: UtmPreset, campaign: string): UtmLink {
  let u: URL
  try {
    u = new URL(input.trim())
  } catch {
    return { error: 'Paste a full link, starting with https://' }
  }
  if (u.protocol !== 'https:' && u.protocol !== 'http:') return { error: 'Paste a web link (https://…)' }
  const { source, medium } = UTM_PRESETS[preset]
  // Old campaign tags and the owner's own test flag must not ride along.
  for (const key of [...u.searchParams.keys()]) {
    if (key.startsWith('utm_') || key === 'domlivo_internal' || key === 'gclid') u.searchParams.delete(key)
  }
  u.searchParams.set('utm_source', source)
  u.searchParams.set('utm_medium', medium)
  const name = slugCampaign(campaign)
  if (name) u.searchParams.set('utm_campaign', name)
  const warning = !SITE_HOSTS.includes(u.host.toLowerCase())
    ? 'This is not a domlivo.com link — visits to it will not be counted here.'
    : !name
      ? 'Add a campaign name to tell this post apart from others on the same channel.'
      : undefined
  return warning ? { url: u.toString(), warning } : { url: u.toString() }
}
