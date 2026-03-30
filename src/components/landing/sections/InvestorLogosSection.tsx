import { PortableText, type PortableTextComponents } from '@portabletext/react'
import type { PortableTextBlock } from '@portabletext/types'
import { resolveLocalizedString } from '@/lib/sanity/localized'
import { resolveRichTextDataFromContent } from '@/components/landing/sectionRenderers/helpers'
import { InvestorLogosMarquee } from '@/components/landing/sections/InvestorLogosMarquee'
import { buildLogoRows } from '@/components/landing/sections/investorLogosShared'

const descriptionPortableComponents: PortableTextComponents = {
  block: {
    normal: ({ children }) => (
      <p className="text-dark/50 dark:text-white/50 text-xm mt-2 max-w-3xl leading-relaxed first:mt-0">{children}</p>
    ),
  },
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
    agents?: unknown[]
  }
}) {
  if (section.enabled === false) return null

  const rows = buildLogoRows(section.agents ?? [], locale)
  if (rows.length === 0) return null

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
      {(title || hasDesc) && (
        <div className="container max-w-8xl mx-auto px-5 2xl:px-0">
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
        </div>
      )}

      {/* Full width of the content column — no horizontal padding (marquee rail is not inset) */}
      <div className="container max-w-8xl mx-auto w-full min-w-0 px-0">
        <InvestorLogosMarquee locale={locale} rows={rows} scrollRegionLabel={scrollRegionLabel} />
      </div>
    </section>
  )
}
