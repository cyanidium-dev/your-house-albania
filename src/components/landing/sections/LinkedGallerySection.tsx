import * as React from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { resolveLocalizedString } from '@/lib/sanity/localized'
import { SectionHeader } from '@/components/landing/sectionPrimitives'

/**
 * `linkedGallerySection` — captioned photographs that link somewhere.
 *
 * The component previously read `primaryImage` and `secondaryImage`, which the
 * Sanity schema does not define and which no document has ever carried. It
 * returned `null` whenever both were absent, so **every** linked gallery on the
 * site rendered nothing: the ten-slide "Gallery of Durrës areas" on the Durrës
 * city landing, the equivalent on Tirana, and the comparison pages added in
 * ТЗ-12. The schema's shape is `items[]` of `{title, image, href}`, so that is
 * what this renders.
 *
 * The old fields are not kept as a fallback: they exist in no document, and a
 * dead branch here is what let the mismatch go unnoticed.
 */
type GalleryItem = {
  _key?: string
  title?: unknown
  href?: string
  image?: { asset?: { url?: string }; alt?: string } | null
}

export function LinkedGallerySection({
  locale,
  section,
}: {
  locale: string
  section: {
    title?: unknown
    description?: unknown
    subtitle?: unknown
    shortLine?: unknown
    items?: unknown[]
  }
}) {
  const title = resolveLocalizedString(section.title as never, locale) || ''
  // The schema calls it `description`; `subtitle` is accepted because other
  // section types use that name and editors move copy between them.
  const subtitle =
    resolveLocalizedString(section.description as never, locale) ||
    resolveLocalizedString(section.subtitle as never, locale) ||
    ''
  const eyebrow = resolveLocalizedString(section.shortLine as never, locale) || ''

  const items = ((section.items ?? []) as GalleryItem[]).filter((item) =>
    Boolean(item?.image?.asset?.url),
  )
  if (items.length === 0) return null

  const hasHeader = Boolean(title || subtitle || eyebrow)

  return (
    <section className="py-16 md:py-24">
      <div className="container max-w-8xl mx-auto px-5 2xl:px-0">
        {hasHeader ? (
          <div className="mb-10 md:mb-12">
            <SectionHeader
              variant="left"
              eyebrowText={eyebrow || undefined}
              title={title || undefined}
              subtitle={subtitle || undefined}
              titleClassName="lg:text-52 text-40 font-medium text-dark dark:text-white leading-[1.2] mt-4 mb-2"
              subtitleClassName="text-dark/50 dark:text-white/50 text-lg leading-snug whitespace-pre-line max-w-3xl"
            />
          </div>
        ) : null}

        <ul className="grid grid-cols-12 gap-4 md:gap-6">
          {items.map((item, index) => {
            const url = item.image!.asset!.url!
            const caption = resolveLocalizedString(item.title as never, locale) || ''
            // A two-slide gallery — the comparison pages — reads best as an
            // even pair; longer ones tile three across.
            const span =
              items.length === 2 ? 'col-span-12 md:col-span-6' : 'col-span-12 sm:col-span-6 lg:col-span-4'

            const media = (
              <div className="group relative rounded-2xl overflow-hidden aspect-[16/10] bg-dark/5 dark:bg-white/5">
                <Image
                  src={url}
                  alt={item.image?.alt ?? caption ?? ''}
                  fill
                  className="object-cover object-center will-change-transform transition-transform duration-700 ease-out group-hover:scale-[1.03]"
                  sizes={items.length === 2 ? '(max-width: 767px) 100vw, 50vw' : '(max-width: 639px) 100vw, (max-width: 1023px) 50vw, 33vw'}
                  unoptimized={url.startsWith('http')}
                />
              </div>
            )

            return (
              <li key={item._key ?? `${url}-${index}`} className={span}>
                {item.href ? (
                  <Link href={item.href.startsWith('/') ? `/${locale}${item.href}` : item.href}>
                    {media}
                  </Link>
                ) : (
                  media
                )}
                {caption ? (
                  <p className="mt-3 text-base text-dark/70 dark:text-white/70">{caption}</p>
                ) : null}
              </li>
            )
          })}
        </ul>
      </div>
    </section>
  )
}
