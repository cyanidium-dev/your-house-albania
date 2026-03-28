import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import { fetchAgentBySlug, fetchSiteSettings } from '@/lib/sanity/client'
import { resolveLocalizedString } from '@/lib/sanity/localized'
import { AgentContactPageContent } from '@/components/contact/AgentContactPageContent'

type Props = {
  params: Promise<{ locale: string; slug: string }>
}

const SLUG_REGEX = /^[a-z0-9-]+$/

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug, locale } = await params
  if (!slug || typeof slug !== 'string' || !SLUG_REGEX.test(slug)) {
    notFound()
  }

  const [agent, siteSettings] = await Promise.all([
    fetchAgentBySlug(slug, locale),
    fetchSiteSettings(),
  ])
  if (!agent) {
    notFound()
  }

  const t = await getTranslations({ locale, namespace: 'ContactAgent' })
  const defaultSeo = (siteSettings as { defaultSeo?: { metaTitle?: unknown; metaDescription?: unknown } } | null)
    ?.defaultSeo
  const siteDefaultDesc = resolveLocalizedString(defaultSeo?.metaDescription as never, locale)

  const title = `${agent.name} | ${t('metaTitleSuffix')}`
  const descSource = agent.bio?.trim() || siteDefaultDesc || ''
  const description = descSource ? descSource.slice(0, 160) : undefined

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      ...(agent.photo?.url ? { images: [{ url: agent.photo.url }] } : {}),
    },
  }
}

export default async function AgentContactPage({ params }: Props) {
  const { slug, locale } = await params
  if (!slug || typeof slug !== 'string' || !SLUG_REGEX.test(slug)) {
    notFound()
  }

  const agent = await fetchAgentBySlug(slug, locale)
  if (!agent) {
    notFound()
  }

  return <AgentContactPageContent agent={agent} locale={locale} />
}
