import { realPhoneOrEmpty } from '@/lib/contacts/phone'
import { resolveLocalizedString } from '@/lib/sanity/localized'

/**
 * The trust details of the Contacts and About pages, from `siteSettings`:
 * phone, address, office photo, the reply-time line and up to three reviews.
 * Every field is the owner's own (Studio → Site Settings → Contact); an empty
 * one maps to null / [] and the pages print nothing for it. Nothing here has a
 * fallback text — a made-up review or promise is worse than none.
 */
export type SiteTrust = {
  phone: string | null
  address: string | null
  replyTime: string | null
  officePhoto: { url: string; alt: string | null } | null
  testimonials: Array<{ key: string; quote: string; author: string; context: string | null }>
}

type Raw = {
  contactPhone?: unknown
  companyAddress?: unknown
  replyTime?: unknown
  officePhoto?: { alt?: unknown; asset?: { url?: unknown } } | null
  testimonials?: Array<{ _key?: string; quote?: unknown; author?: unknown; context?: unknown }> | null
}

const text = (v: unknown): string | null => (typeof v === 'string' && v.trim() ? v.trim() : null)
const localized = (v: unknown, locale: string): string | null =>
  v && typeof v === 'object' ? text(resolveLocalizedString(v as never, locale)) : text(v)

export function mapSiteTrust(raw: unknown, locale: string): SiteTrust {
  const r = (raw && typeof raw === 'object' ? raw : {}) as Raw
  const photoUrl = text(r.officePhoto?.asset?.url)
  const testimonials = (Array.isArray(r.testimonials) ? r.testimonials : [])
    .map((item, i) => ({
      key: item?._key ?? String(i),
      quote: localized(item?.quote, locale),
      author: text(item?.author),
      context: localized(item?.context, locale),
    }))
    .filter((t): t is { key: string; quote: string; author: string; context: string | null } => Boolean(t.quote && t.author))
    .slice(0, 3)
  return {
    phone: realPhoneOrEmpty(r.contactPhone) || null,
    address: text(r.companyAddress),
    replyTime: localized(r.replyTime, locale),
    officePhoto: photoUrl ? { url: photoUrl, alt: text(r.officePhoto?.alt) } : null,
    testimonials,
  }
}

/** Whether there is anything to show at all. */
export function hasSiteTrust(t: SiteTrust): boolean {
  return Boolean(t.phone || t.address || t.replyTime || t.officePhoto || t.testimonials.length)
}
