import * as React from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { resolveLocalizedString } from '@/lib/sanity/localized'

export type AgentDoc = {
  _id?: string
  name?: unknown
  slug?: string | null
  photo?: { asset?: { url?: string }; alt?: string }
  agentLogo?: { asset?: { url?: string }; alt?: string }
  telegramUrl?: string | null
  instagramUrl?: string | null
  facebookUrl?: string | null
  youtubeUrl?: string | null
}

export const SOCIAL_PRIORITY: Array<
  keyof Pick<AgentDoc, 'telegramUrl' | 'instagramUrl' | 'facebookUrl' | 'youtubeUrl'>
> = ['telegramUrl', 'instagramUrl', 'facebookUrl', 'youtubeUrl']

/** Prefer `agentLogo`, then `photo`. */
export function pickAgentLogoImage(agent: AgentDoc): { url: string; alt?: string } | null {
  const logoUrl = agent.agentLogo?.asset?.url
  if (typeof logoUrl === 'string' && logoUrl.trim()) {
    const a = agent.agentLogo?.alt
    return { url: logoUrl.trim(), alt: typeof a === 'string' ? a : undefined }
  }
  const photoUrl = agent.photo?.asset?.url
  if (typeof photoUrl === 'string' && photoUrl.trim()) {
    const a = agent.photo?.alt
    return { url: photoUrl.trim(), alt: typeof a === 'string' ? a : undefined }
  }
  return null
}

/**
 * Per-agent contact page is decommissioned; prefer first social URL by priority.
 * Returns `null` when the logo should render without a link.
 */
export function resolveAgentHref(agent: AgentDoc): string | null {
  for (const key of SOCIAL_PRIORITY) {
    const u = agent[key]
    if (typeof u === 'string' && u.trim()) return u.trim()
  }
  return null
}

/** Matches blog CTA / portable-text link behavior: locale-prefix internal paths. */
export function resolveSectionHref(raw: string | null | undefined, locale: string): string {
  const s = typeof raw === 'string' ? raw.trim() : ''
  if (!s) return '#'
  if (s.startsWith('http://') || s.startsWith('https://')) return s
  if (s.startsWith('mailto:')) return s
  if (s.startsWith('tel:')) return s
  if (s.startsWith('#')) return s
  return s.startsWith('/') ? `/${locale}${s}` : `/${locale}/${s}`
}

export function LogoAnchor({
  href,
  locale,
  children,
  className,
}: {
  href: string
  locale: string
  children: React.ReactNode
  className?: string
}) {
  const resolved = resolveSectionHref(href, locale)
  const isExternal = resolved.startsWith('http://') || resolved.startsWith('https://')
  if (isExternal) {
    return (
      <a href={resolved} target="_blank" rel="noopener noreferrer" className={className} draggable={false}>
        {children}
      </a>
    )
  }
  if (resolved.startsWith('mailto:') || resolved.startsWith('tel:')) {
    return (
      <a href={resolved} className={className} draggable={false}>
        {children}
      </a>
    )
  }
  return (
    <Link href={resolved} className={className} draggable={false}>
      {children}
    </Link>
  )
}

export const logoTileClassName =
  'group flex shrink-0 items-center justify-center rounded-xl px-3 py-2 transition-opacity duration-200 hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40'

export type LogoRow = {
  image: { url: string; alt?: string }
  /** Resolved display alt (image alt → name → fallback). */
  alt: string
  href: string | null
  key: string
}

export function buildLogoRows(
  rawAgents: unknown[],
  locale: string
): LogoRow[] {
  return (Array.isArray(rawAgents) ? rawAgents : [])
    .map((a) => a as AgentDoc)
    .map((agent) => {
      const image = pickAgentLogoImage(agent)
      if (!image) return null
      const nameStr = resolveLocalizedString(agent.name as never, locale).trim()
      const alt = (typeof image.alt === 'string' && image.alt.trim()) || nameStr || 'Agent logo'
      const href = resolveAgentHref(agent)
      return { image, alt, href, key: agent._id ?? image.url }
    })
    .filter((row): row is LogoRow => row !== null)
}

/** Fixed row height; width follows aspect ratio with a max width cap (wide logos). */
const logoImgClassName =
  'h-9 w-auto max-h-9 max-w-[10rem] object-contain object-center sm:h-10 sm:max-h-10 sm:max-w-[11rem] md:h-11 md:max-h-11 md:max-w-[12rem]'

export function LogoTile({
  image,
  alt,
  href,
  locale,
}: {
  image: { url: string; alt?: string }
  alt: string
  href: string | null
  locale: string
}) {
  const src = image.url
  const unoptimized = src.startsWith('http')
  /** Intrinsic placeholder; display size comes from CSS (fixed height, auto width). */
  const inner = (
    <span className="inline-flex max-w-[12rem] shrink-0 items-center justify-center">
      <Image
        src={src}
        alt={alt}
        width={320}
        height={88}
        draggable={false}
        className={logoImgClassName}
        sizes="(max-width: 768px) 160px, 192px"
        unoptimized={unoptimized}
      />
    </span>
  )
  if (!href) {
    return <div className={logoTileClassName}>{inner}</div>
  }
  return (
    <LogoAnchor href={href} locale={locale} className={logoTileClassName}>
      {inner}
    </LogoAnchor>
  )
}
