import Image from 'next/image'
import { getTranslations } from 'next-intl/server'
import { SpriteIcon as Icon } from '@/components/shared/SpriteIcon'
import { Section, SECTION_TITLE, SPLIT, SPLIT_ASIDE, SPLIT_MAIN } from '@/components/shared/layout'
import { cn } from '@/lib/utils'
import type { SiteTrust } from '@/lib/sanity/trustFromSiteSettings'

/**
 * Phone, reply time and address from Site Settings, as lines with icons.
 * Prints nothing for an empty field, and nothing at all when all are empty.
 */
export async function SiteTrustContactLines({
  locale,
  trust,
  className,
}: {
  locale: string
  trust: SiteTrust
  className?: string
}) {
  if (!trust.phone && !trust.address && !trust.replyTime) return null
  const t = await getTranslations({ locale, namespace: 'Capture.trust' })
  return (
    <ul className={cn('flex flex-col gap-3', className)}>
      {trust.phone ? (
        <li>
          <a
            href={`tel:${trust.phone.replace(/[^\d+]/g, '')}`}
            className="inline-flex min-h-11 items-center gap-3 text-base text-dark transition-colors hover:text-primary dark:text-white dark:hover:text-primary"
          >
            <Icon icon="ph:phone-call-fill" width={22} height={22} className="shrink-0 text-primary" aria-hidden />
            <span>
              <span className="text-sm text-dark/60 dark:text-white/60">{t('phone')}: </span>
              {trust.phone}
            </span>
          </a>
        </li>
      ) : null}
      {trust.replyTime ? (
        <li className="flex items-start gap-3 text-base text-dark/80 dark:text-white/80">
          <Icon icon="ph:clock" width={22} height={22} className="mt-0.5 shrink-0 text-primary" aria-hidden />
          <span>{trust.replyTime}</span>
        </li>
      ) : null}
      {trust.address ? (
        <li className="flex items-start gap-3 text-base text-dark dark:text-white">
          <Icon icon="ph:map-pin" width={22} height={22} className="mt-0.5 shrink-0 text-primary" aria-hidden />
          <span className="whitespace-pre-line">
            <span className="text-sm text-dark/60 dark:text-white/60">{t('address')}: </span>
            {trust.address}
          </span>
        </li>
      ) : null}
    </ul>
  )
}

/**
 * The office photo and up to three reviews (and, on About, the contact lines
 * beside the photo). Renders nothing when the owner has filled in none of it.
 */
export async function SiteTrustSection({
  locale,
  trust,
  withContacts = false,
}: {
  locale: string
  trust: SiteTrust
  withContacts?: boolean
}) {
  const hasContacts = withContacts && Boolean(trust.phone || trust.address || trust.replyTime)
  if (!trust.officePhoto && trust.testimonials.length === 0 && !hasContacts) return null
  const t = await getTranslations({ locale, namespace: 'Capture.trust' })
  return (
    <Section aria-label={t('sectionLabel')}>
      {trust.officePhoto || hasContacts ? (
        <div className={cn(SPLIT, 'items-center')}>
          {hasContacts ? (
            <div className={SPLIT_ASIDE}>
              <SiteTrustContactLines locale={locale} trust={trust} />
            </div>
          ) : null}
          {trust.officePhoto ? (
            <div className={hasContacts ? SPLIT_MAIN : 'lg:col-span-12'}>
              <div className="relative aspect-[3/2] overflow-hidden rounded-3xl bg-dark/5 dark:bg-white/5">
                <Image
                  src={trust.officePhoto.url}
                  alt={trust.officePhoto.alt ?? t('officePhotoAlt')}
                  fill
                  sizes="(min-width: 1024px) 58vw, 100vw"
                  className="object-cover"
                />
              </div>
            </div>
          ) : null}
        </div>
      ) : null}
      {trust.testimonials.length > 0 ? (
        <div className={trust.officePhoto || hasContacts ? 'mt-12 md:mt-16' : undefined}>
          <h2 className={SECTION_TITLE}>{t('testimonialsTitle')}</h2>
          <ul
            className={cn(
              'mt-8 grid gap-6',
              trust.testimonials.length === 2 ? 'md:grid-cols-2' : trust.testimonials.length === 3 ? 'md:grid-cols-3' : '',
            )}
          >
            {trust.testimonials.map((item) => (
              <li key={item.key}>
                <figure className="flex h-full flex-col rounded-3xl bg-dark/[0.03] p-6 ring-1 ring-dark/[0.06] dark:bg-white/[0.04] dark:ring-white/[0.08] md:p-8">
                  <blockquote className="flex-1 text-base leading-relaxed text-dark/85 whitespace-pre-line dark:text-white/85">
                    {item.quote}
                  </blockquote>
                  <figcaption className="mt-5 text-sm">
                    <span className="font-semibold text-dark dark:text-white">{item.author}</span>
                    {item.context ? <span className="text-dark/60 dark:text-white/60"> · {item.context}</span> : null}
                  </figcaption>
                </figure>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </Section>
  )
}
