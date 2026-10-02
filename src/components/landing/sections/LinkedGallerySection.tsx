import * as React from 'react'
import Image from 'next/image'
import Link from "@/components/shared/Link";
import { resolveLocalizedString } from '@/lib/sanity/localized'
import { Section, SectionHeading } from '@/components/shared/layout'

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
/**
 * Column span of photo `index` of `count` on a 12-column grid, filling the
 * last row: three across, but the last two share a row as halves and a
 * leftover fourth turns the last four into a 2×2. Four photos used to lay
 * out as three and one alone under them.
 */
export function galleryItemClass(index: number, count: number): string {
  if (count <= 1) return 'col-span-12'
  if (count === 2) return 'col-span-12 sm:col-span-6'
  const rest = count % 3
  const lg =
    (rest === 2 && index >= count - 2) || (rest === 1 && index >= count - 4) ? 'lg:col-span-6' : 'lg:col-span-4'
  const sm = count % 2 === 1 && index === count - 1 ? 'sm:col-span-12' : 'sm:col-span-6'
  return `col-span-12 ${sm} ${lg}`
}

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

  const items = ((section.items ?? []) as GalleryItem[]).filter((item) =>
    Boolean(item?.image?.asset?.url),
  )
  if (items.length === 0) return null

  const hasHeader = Boolean(title || subtitle)

  return (
    <Section>
        {hasHeader ? <SectionHeading title={title || undefined} lead={subtitle || undefined} /> : null}

        <ul className="grid grid-cols-12 gap-4 md:gap-6">
          {items.map((item, index) => {
            const url = item.image!.asset!.url!
            const caption = resolveLocalizedString(item.title as never, locale) || ''
            // A two-slide gallery — the comparison pages — reads best as an
            // even pair; longer ones tile three across with a full last row.
            const span = galleryItemClass(index, items.length)

            const media = (
              <div className="group relative rounded-2xl overflow-hidden aspect-[16/10] bg-dark/5 dark:bg-white/5">
                <Image
                  src={url}
                  // The caption is localised; `image.alt` is one plain string
                  // in whatever language the editor typed, so it comes second.
                  alt={caption || item.image?.alt || ''}
                  fill
                  className="object-cover object-center will-change-transform transition-transform duration-700 ease-out group-hover:scale-[1.03]"
                  sizes={items.length === 2 ? '(max-width: 767px) 100vw, 50vw' : '(max-width: 639px) 100vw, (max-width: 1023px) 50vw, 33vw'}
                />
              </div>
            )

            return (
              <li key={item._key ?? `${url}-${index}`} className={span}>
                {/* figure + figcaption: the markup that ties a caption to its
                    photograph for a crawler, not only for the eye. */}
                <figure>
                {item.href ? (
                  <Link href={item.href.startsWith('/') ? `/${locale}${item.href}` : item.href}>
                    {media}
                  </Link>
                ) : (
                  media
                )}
                {caption ? (
                  <figcaption className="mt-3 text-base text-dark/70 dark:text-white/70">{caption}</figcaption>
                ) : null}
                </figure>
              </li>
            )
          })}
        </ul>
    </Section>
  )
}
