import { resolveLocalizedString } from './localized'

/** Resolved agent for a future contact-realtor page (one document, locale-aware strings). */
export type AgentContactPage = {
  _id: string
  slug: string
  name: string
  bio: string
  email: string | null
  phone: string | null
  photo: { url: string; alt?: string } | null
  agentLogo: { url: string; alt?: string } | null
  telegramUrl: string | null
  facebookUrl: string | null
  instagramUrl: string | null
  youtubeUrl: string | null
}

type SanityImageField = { asset?: { url?: string }; alt?: string } | null | undefined

/** Raw agent document shape returned by GROQ (before mapping). Not all fields are required at runtime. */
export type SanityAgentDocument = {
  _id?: string
  name?: unknown
  slug?: string | { current?: string }
  bio?: unknown
  email?: string
  phone?: string
  photo?: SanityImageField
  agentLogo?: SanityImageField
  telegramUrl?: string
  facebookUrl?: string
  instagramUrl?: string
  youtubeUrl?: string
}

function pickImage(img: SanityImageField): { url: string; alt?: string } | null {
  const url = img?.asset?.url
  if (!url || typeof url !== 'string') return null
  const alt = typeof img?.alt === 'string' && img.alt.trim() ? img.alt.trim() : undefined
  return { url, alt }
}

function resolveMaybeLocalized(field: unknown, locale: string): string {
  if (field == null) return ''
  if (typeof field === 'string') return field.trim()
  return resolveLocalizedString(field as never, locale).trim()
}

function nullableTrimmed(s: string | undefined): string | null {
  if (typeof s !== 'string') return null
  const t = s.trim()
  return t ? t : null
}

/**
 * Maps raw Sanity agent payload to a page-friendly shape with localized name/bio.
 */
export function mapSanityAgentToContactPage(
  raw: SanityAgentDocument | null | undefined,
  locale: string
): AgentContactPage | null {
  if (!raw?._id) return null
  const slug =
    typeof raw.slug === 'string' ? raw.slug.trim() : (raw.slug as { current?: string } | undefined)?.current?.trim() ?? ''
  if (!slug) return null

  const name = resolveMaybeLocalized(raw.name, locale)
  const bio = resolveMaybeLocalized(raw.bio, locale)

  return {
    _id: raw._id,
    slug,
    name: name || '—',
    bio,
    email: nullableTrimmed(raw.email),
    phone: nullableTrimmed(raw.phone),
    photo: pickImage(raw.photo),
    agentLogo: pickImage(raw.agentLogo),
    telegramUrl: nullableTrimmed(raw.telegramUrl),
    facebookUrl: nullableTrimmed(raw.facebookUrl),
    instagramUrl: nullableTrimmed(raw.instagramUrl),
    youtubeUrl: nullableTrimmed(raw.youtubeUrl),
  }
}
