import Image from 'next/image'
import { Icon } from '@iconify/react'
import { getTranslations } from 'next-intl/server'
import type { AgentContactPage } from '@/lib/sanity/agentAdapter'
import { AgentContactRequestForm } from '@/components/contact/AgentContactRequestForm'
import {
  fetchCatalogFilterOptions,
  fetchSiteSettings,
  fetchCatalogAreaBoundsFromData,
} from '@/lib/sanity/client'
import { resolvePriceRange, toRangesByDeal } from '@/lib/catalog/priceRanges'
import { resolveAreaRangeBounds } from '@/lib/catalog/areaRanges'

const DEAL_TYPE_VALUES = ['sale', 'rent', 'short-term'] as const

type SocialItem = { key: 'telegram' | 'facebook' | 'instagram' | 'youtube'; url: string; icon: string; labelKey: string }

function socialsForAgent(agent: AgentContactPage): SocialItem[] {
  const items: SocialItem[] = []
  if (agent.telegramUrl) items.push({ key: 'telegram', url: agent.telegramUrl, icon: 'ph:telegram-logo', labelKey: 'telegram' })
  if (agent.facebookUrl) items.push({ key: 'facebook', url: agent.facebookUrl, icon: 'ph:facebook-logo', labelKey: 'facebook' })
  if (agent.instagramUrl) items.push({ key: 'instagram', url: agent.instagramUrl, icon: 'ph:instagram-logo', labelKey: 'instagram' })
  if (agent.youtubeUrl) items.push({ key: 'youtube', url: agent.youtubeUrl, icon: 'ph:youtube-logo', labelKey: 'youtube' })
  return items
}

export async function AgentContactPageContent({
  agent,
  locale,
}: {
  agent: AgentContactPage
  locale: string
}) {
  const t = await getTranslations({ locale, namespace: 'ContactAgent' })
  const [filterOptions, siteSettings, areaBoundsFromData] = await Promise.all([
    fetchCatalogFilterOptions(locale),
    fetchSiteSettings(),
    fetchCatalogAreaBoundsFromData(),
  ])

  const { locations: locationOptions, propertyTypes: typeOptions } = filterOptions
  const priceRangesByDeal = toRangesByDeal(
    resolvePriceRange((siteSettings as Record<string, unknown>)?.priceRange)
  )
  const defaultAreaRange = resolveAreaRangeBounds(
    (siteSettings as Record<string, unknown>)?.areaRange,
    areaBoundsFromData
  )

  const socialItems = socialsForAgent(agent)
  const photoAlt = agent.photo?.alt ?? t('photoAlt', { name: agent.name })
  const unoptimizedPhoto = agent.photo?.url?.startsWith('http') ?? false

  return (
    <div className="container mx-auto max-w-8xl px-5 2xl:px-0 pb-14 pt-20 md:pb-28 md:pt-32">
      <div className="mb-10 text-center md:mb-12">
        <div className="mb-3 flex items-center justify-center gap-2.5">
          <Icon icon="ph:house-simple-fill" width={20} height={20} className="text-primary" />
          <p className="text-base font-semibold text-badge dark:text-white/90">{t('badge')}</p>
        </div>
        <p className="mx-auto max-w-2xl text-xm text-black/50 dark:text-white/50">{t('subtitle', { name: agent.name })}</p>
      </div>

      <section
        aria-labelledby="agent-identity-heading"
        className="mb-10 rounded-2xl border border-black/10 p-6 shadow-xl dark:border-white/10 dark:shadow-white/10 md:p-8"
      >
        <h2 id="agent-identity-heading" className="sr-only">
          {agent.name}
        </h2>
        <div className="flex flex-col gap-8 md:flex-row md:items-start md:gap-10">
          {agent.photo?.url ? (
            <div className="relative mx-auto aspect-[4/5] w-full max-w-xs shrink-0 overflow-hidden rounded-2xl bg-dark/5 dark:bg-white/5 md:mx-0">
              <Image
                src={agent.photo.url}
                alt={photoAlt}
                fill
                className="object-cover object-center"
                sizes="(max-width: 767px) 100vw, 320px"
                priority
                unoptimized={unoptimizedPhoto}
              />
            </div>
          ) : null}

          <div className="min-w-0 flex-1">
            <h1 className="mb-4 text-3xl font-medium leading-tight tracking-tighter text-black dark:text-white sm:text-4xl">
              {agent.name}
            </h1>

            {agent.bio?.trim() ? (
              <div className="mb-6">
                <p className="mb-2 text-sm font-medium text-dark/70 dark:text-white/70">{t('about')}</p>
                <p className="text-base leading-relaxed text-dark/80 dark:text-white/80 whitespace-pre-wrap">{agent.bio}</p>
              </div>
            ) : null}

            {agent.email ? (
              <a
                href={`mailto:${agent.email}`}
                className="mb-6 inline-flex w-fit max-w-full items-start gap-3 break-all text-dark transition-colors hover:text-primary dark:text-white"
              >
                <Icon icon="ph:envelope-simple" width={24} height={24} className="mt-0.5 shrink-0 text-primary" />
                <span>
                  <span className="text-sm text-dark/60 dark:text-white/60">{t('email')}: </span>
                  {agent.email}
                </span>
              </a>
            ) : null}

            {socialItems.length > 0 ? (
              <div>
                <p className="mb-3 text-sm font-medium text-dark/70 dark:text-white/70">{t('follow')}</p>
                <ul className="flex flex-wrap gap-3">
                  {socialItems.map((s) => (
                    <li key={s.key}>
                      <a
                        href={s.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 rounded-full border border-dark/10 px-4 py-2 text-sm text-dark transition-colors hover:border-primary hover:text-primary dark:border-white/15 dark:text-white"
                      >
                        <Icon icon={s.icon} width={20} height={20} aria-hidden />
                        {t(s.labelKey)}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>
        </div>
      </section>

      <section aria-labelledby="agent-request-form-heading" className="min-w-0">
        <h2 id="agent-request-form-heading" className="sr-only">
          {t('formHeading')}
        </h2>
        <AgentContactRequestForm
          agentSlug={agent.slug}
          agentName={agent.name}
          locale={locale}
          filterProps={{
            locations: locationOptions.map((o) => ({ value: o.value, label: o.label })),
            propertyTypes: typeOptions.map((o) => ({ value: o.value, label: o.label })),
            dealTypeValues: DEAL_TYPE_VALUES,
            priceRangesByDeal,
            defaultAreaRange,
          }}
        />
      </section>
    </div>
  )
}
