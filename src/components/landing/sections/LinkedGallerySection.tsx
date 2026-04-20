import * as React from 'react'
import Image from 'next/image'
import { resolveLocalizedString } from '@/lib/sanity/localized'
import { SectionHeader } from '@/components/landing/sectionPrimitives'

type ImageField = { asset?: { url?: string }; alt?: string } | null | undefined

export function LinkedGallerySection({
  locale,
  section,
}: {
  locale: string
  section: {
    title?: unknown
    subtitle?: unknown
    shortLine?: unknown
    primaryImage?: ImageField
    secondaryImage?: ImageField
  }
}) {
  const title = resolveLocalizedString(section.title as never, locale) || ''
  const subtitle = resolveLocalizedString(section.subtitle as never, locale) || ''
  const eyebrow = resolveLocalizedString(section.shortLine as never, locale) || ''
  const primary = section.primaryImage
  const secondary = section.secondaryImage
  const primaryUrl = primary?.asset?.url
  const secondaryUrl = secondary?.asset?.url

  if (!primaryUrl && !secondaryUrl) return null

  const unoptimized = (primaryUrl?.startsWith('http') || secondaryUrl?.startsWith('http')) ?? false

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

        <div className="grid grid-cols-12 gap-4 md:gap-6">
          {primaryUrl ? (
            <div className="col-span-12 lg:col-span-8">
              <div className="group relative rounded-2xl overflow-hidden aspect-[16/10] bg-dark/5 dark:bg-white/5">
                <Image
                  src={primaryUrl}
                  alt={primary?.alt ?? title ?? 'Gallery image'}
                  fill
                  className="object-cover object-center transition-transform duration-700 group-hover:scale-[1.03]"
                  sizes="(max-width: 1023px) 100vw, 66vw"
                  unoptimized={unoptimized}
                />
              </div>
            </div>
          ) : null}
          {secondaryUrl ? (
            <div className="col-span-12 lg:col-span-4">
              <div className="group relative rounded-2xl overflow-hidden aspect-[16/10] lg:aspect-[4/5] bg-dark/5 dark:bg-white/5">
                <Image
                  src={secondaryUrl}
                  alt={secondary?.alt ?? title ?? 'Gallery image'}
                  fill
                  className="object-cover object-center transition-transform duration-700 group-hover:scale-[1.03]"
                  sizes="(max-width: 1023px) 100vw, 33vw"
                  unoptimized={unoptimized}
                />
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  )
}
