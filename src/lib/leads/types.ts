/**
 * Lead vocabulary shared by the browser, the API routes, Sanity and Telegram.
 * The Studio `lead` schema (domlivo-admin) mirrors these lists — change both.
 */

export const LEAD_TYPES = [
  'contact_form',
  'property_inquiry',
  'agent_contact',
  'registration',
  'click_whatsapp',
  'click_telegram',
  'click_phone',
  'click_email',
] as const

export type LeadType = (typeof LEAD_TYPES)[number]

export const CLICK_LEAD_TYPES = ['click_whatsapp', 'click_telegram', 'click_phone', 'click_email'] as const

export type ClickLeadType = (typeof CLICK_LEAD_TYPES)[number]

export const LEAD_STATUSES = [
  'new',
  'contacted',
  'qualified',
  'viewing',
  'negotiation',
  'won',
  'lost',
  'spam',
] as const

export type LeadStatus = (typeof LEAD_STATUSES)[number]

export const LEAD_PLACEMENTS = [
  'header',
  'footer',
  'property',
  'property-card',
  'catalog',
  'agent',
  'quick-contact',
  'contact-page',
  'blog-cta',
  'landing',
  'register-page',
  'page',
] as const

export type LeadPlacement = (typeof LEAD_PLACEMENTS)[number]

export function isLeadPlacement(v: unknown): v is LeadPlacement {
  return typeof v === 'string' && (LEAD_PLACEMENTS as readonly string[]).includes(v)
}

export function isClickLeadType(v: unknown): v is ClickLeadType {
  return typeof v === 'string' && (CLICK_LEAD_TYPES as readonly string[]).includes(v)
}

/**
 * Which contact channel an `href` opens, or `null` for an ordinary link.
 * WhatsApp covers the short link (`wa.me/<number>` and the WhatsApp Business
 * `wa.me/message/<code>` form), the API/web hosts and the app scheme. Telegram
 * covers `t.me`, its `telegram.me` alias and the `tg:` app scheme.
 */
export function classifyContactHref(href: string): ClickLeadType | null {
  const h = href.trim().toLowerCase()
  if (h.startsWith('tel:')) return 'click_phone'
  if (h.startsWith('mailto:')) return 'click_email'
  if (h.startsWith('whatsapp:')) return 'click_whatsapp'
  if (/^https?:\/\/(www\.)?(wa\.me|api\.whatsapp\.com|web\.whatsapp\.com)(\/|$|\?)/.test(h)) {
    return 'click_whatsapp'
  }
  if (h.startsWith('tg:')) return 'click_telegram'
  if (/^https?:\/\/(www\.)?(t\.me|telegram\.me)\/[^/?#]/.test(h)) return 'click_telegram'
  return null
}
