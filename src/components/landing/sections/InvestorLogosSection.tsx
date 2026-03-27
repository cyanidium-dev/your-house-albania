import * as React from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { PortableText, type PortableTextComponents } from '@portabletext/react'
import type { PortableTextBlock } from '@portabletext/types'
import { resolveLocalizedString } from '@/lib/sanity/localized'
import { resolveRichTextDataFromContent } from '@/components/landing/sectionRenderers/helpers'

type LogoItem = {
  _key?: string
  label?: unknown
  href?: string
  image?: { asset?: { url?: string }; alt?: string }
}

/** Matches blog CTA / portable-text link behavior: locale-prefix internal paths. */
function resolveSectionHref(raw: string | null | undefined, locale: string): string {
  const s = typeof raw === 'string' ? raw.trim() : ''
  if (!s) return '#'
  if (s.startsWith('http://') || s.startsWith('https://')) return s
  if (s.startsWith('mailto:')) return s
  if (s.startsWith('tel:')) return s
  if (s.startsWith('#')) return s
  return s.startsWith('/') ? `/${locale}${s}` : `/${locale}/${s}`
}

const descriptionPortableComponents: PortableTextComponents = {
  block: {
    normal: ({ children }) => (
      <p className="text-dark/50 dark:text-white/50 text-xm mt-2 max-w-3xl leading-relaxed first:mt-0">{children}</p>
    ),
  },
}

function LogoAnchor({
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
      <a href={resolved} target="_blank" rel="noopener noreferrer" className={className}>
        {children}
      </a>
    )
  }
  if (resolved.startsWith('mailto:') || resolved.startsWith('tel:')) {
    return (
      <a href={resolved} className={className}>
        {children}
      </a>
    )
  }
  return (
    <Link href={resolved} className={className}>
      {children}
    </Link>
  )
}

export function InvestorLogosSection({
  locale,
  section,
}: {
  locale: string
  section: {
    enabled?: boolean
    title?: unknown
    description?: unknown
    items?: unknown[]
  }
}) {
  if (section.enabled === false) return null

  const rawItems = Array.isArray(section.items) ? section.items : []
  const items = rawItems
    .map((it) => it as LogoItem)
    .filter((it) => {
      const url = it.image?.asset?.url
      const href = typeof it.href === 'string' ? it.href.trim() : ''
      return Boolean(url && href)
    })

  if (items.length === 0) return null

  const title = resolveLocalizedString(section.title as never, locale) || ''
  const descData = resolveRichTextDataFromContent(section.description, locale)
  const hasDesc =
    descData &&
    (descData.isPlainText
      ? typeof descData.content === 'string' && (descData.content as string).trim().length > 0
      : Array.isArray(descData.content) && descData.content.length > 0)

  const scrollRegionLabel = title.trim() ? `${title} — logos` : 'Partner logos'

  return (
    <section className="py-12 md:py-16">
      <div className="container max-w-8xl mx-auto px-5 2xl:px-0">
        {(title || hasDesc) && (
          <div className="mb-8 md:mb-10">
            {title ? (
              <h2 className="lg:text-52 text-40 font-medium dark:text-white">{title}</h2>
            ) : null}
            {hasDesc && descData ? (
              descData.isPlainText && typeof descData.content === 'string' ? (
                <div className="mt-2 max-w-3xl text-dark/50 dark:text-white/50 text-xm leading-relaxed">
                  {descData.content
                    .split(/\n\n+/)
                    .map((p) => p.trim())
                    .filter(Boolean)
                    .map((para, i) => (
                      <p key={i}>{para}</p>
                    ))}
                </div>
              ) : (
                <div className="mt-2 max-w-3xl">
                  <PortableText
                    value={(descData.content as unknown[]) as PortableTextBlock[]}
                    components={descriptionPortableComponents}
                  />
                </div>
              )
            ) : null}
          </div>
        )}

        <div className="relative -mx-5 min-w-0 px-5 md:mx-0 md:px-0">
          <div
            className="flex min-w-0 gap-10 overflow-x-auto overflow-y-visible overscroll-x-contain pb-2 pt-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
            role="region"
            aria-label={scrollRegionLabel}
          >
            {items.map((it, idx) => {
              const src = it.image!.asset!.url!
              const unoptimized = src.startsWith('http')
              const labelResolved =
                typeof it.label === 'string'
                  ? it.label.trim()
                  : resolveLocalizedString(it.label as never, locale).trim()
              const alt =
                (typeof it.image?.alt === 'string' && it.image.alt.trim()) ||
                labelResolved ||
                'Investor logo'
              return (
                <LogoAnchor
                  key={it._key ?? `logo-${idx}`}
                  href={it.href!}
                  locale={locale}
                  className="group flex shrink-0 items-center justify-center rounded-xl px-3 py-2 transition-opacity duration-200 hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                >
                  <span className="relative block h-9 w-[7.5rem] sm:h-10 sm:w-[8.5rem] md:h-11 md:w-36">
                    <Image
                      src={src}
                      alt={alt}
                      fill
                      className="object-contain object-center"
                      sizes="(max-width: 768px) 120px, 144px"
                      unoptimized={unoptimized}
                    />
                  </span>
                </LogoAnchor>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}
