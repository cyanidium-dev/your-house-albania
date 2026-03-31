/**
 * Maps `siteSettings` into the contact block for `/[locale]/contacts`.
 * Uses: `contactsManagerPhoto` (optional; legacy `managerPhoto` fallback), `contactEmail`, `socialLinks`.
 */

export type ContactsManagerBlock = {
  photo: { url: string; alt?: string } | null
  /** From `contactEmail` */
  email: string | null
  /** From `socialLinks[]` — platform + url preserved for display (LinkedIn, etc.) */
  socialLinks: { platform: string; url: string }[]
}

type SanityImageField = { asset?: { url?: string }; alt?: string } | null | undefined

type RawSocial = { platform?: string; url?: string }

function pickImage(img: SanityImageField): { url: string; alt?: string } | null {
  const url = img?.asset?.url
  if (!url || typeof url !== 'string') return null
  const alt = typeof img?.alt === 'string' && img.alt.trim() ? img.alt.trim() : undefined
  return { url, alt }
}

function trimOrNull(s: unknown): string | null {
  if (typeof s !== 'string') return null
  const t = s.trim()
  return t.length ? t : null
}

export function mapContactsManagerFromSiteSettings(raw: unknown): ContactsManagerBlock {
  if (!raw || typeof raw !== 'object') {
    return { photo: null, email: null, socialLinks: [] }
  }

  const r = raw as Record<string, unknown>
  const linksRaw = r.socialLinks

  const socialLinks: { platform: string; url: string }[] = []
  if (Array.isArray(linksRaw)) {
    for (const item of linksRaw) {
      const s = item as RawSocial
      const url = trimOrNull(s?.url)
      if (!url) continue
      const platform = String(s?.platform ?? '').trim() || 'Link'
      socialLinks.push({ platform, url })
    }
  }

  const photo =
    pickImage(r.contactsManagerPhoto as SanityImageField) ?? pickImage(r.managerPhoto as SanityImageField)

  return {
    photo,
    email: trimOrNull(r.contactEmail),
    socialLinks,
  }
}
