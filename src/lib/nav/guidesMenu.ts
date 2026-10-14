import {
  COMPARISONS_TOPIC,
  GUIDE_TOPICS,
  GUIDES_SECTION_IDS,
  blogTopicHref,
  isComparisonGuideSlug,
  postInTopic,
  type GuideTopicKey,
} from '@/data/guideTopics'
import type { GuidesMenuData } from '@/data/navConfig'
import { resolveLocalizedStringStrict } from '@/lib/sanity/localized'

type PostRow = {
  slug: string
  title?: Partial<Record<string, string>> | null
  publishedAt?: string
  categories?: (string | null)[] | null
}

type GuideRow = { slug?: string | null }

export type GuidesMenuLabels = Record<GuideTopicKey | 'comparisons', string>

/** How many articles the menu's "latest" column shows. */
export const MAX_LATEST_GUIDES = 3

/**
 * The Guides menu for one locale: the topics that have articles, in the
 * config's order and each with its count, then the comparisons; the newest
 * articles with a title in this locale; the two "all" links.
 *
 * `guides` are the guide landings already filtered to this locale
 * (`isLandingInLocale`), so the comparisons count is the one /guides shows.
 */
export function buildGuidesMenu({
  locale,
  posts,
  guides,
  labels,
  latestLimit = MAX_LATEST_GUIDES,
}: {
  locale: string
  posts: readonly PostRow[]
  guides: readonly GuideRow[]
  labels: GuidesMenuLabels
  latestLimit?: number
}): GuidesMenuData {
  const topics: GuidesMenuData['topics'] = []
  for (const topic of GUIDE_TOPICS) {
    const count = posts.filter((p) => postInTopic(p.categories, topic)).length
    if (count === 0) continue
    topics.push({ key: topic.key, label: labels[topic.key], href: blogTopicHref(locale, topic.key), count, icon: topic.icon })
  }
  const comparisons = guides.filter((g) => isComparisonGuideSlug(g.slug)).length
  if (comparisons > 0) {
    topics.push({
      key: COMPARISONS_TOPIC.key,
      label: labels.comparisons,
      href: `/${locale}/guides#${GUIDES_SECTION_IDS.comparisons}`,
      count: comparisons,
      icon: COMPARISONS_TOPIC.icon,
    })
  }

  const latest: GuidesMenuData['latest'] = []
  const newestFirst = [...posts].sort((a, b) => (b.publishedAt ?? '').localeCompare(a.publishedAt ?? ''))
  for (const post of newestFirst) {
    if (latest.length >= latestLimit) break
    const title = resolveLocalizedStringStrict(post.title as never, locale)
    if (!title || !post.slug) continue
    latest.push({ key: post.slug, title, href: `/${locale}/blog/${post.slug}`, publishedAt: post.publishedAt })
  }

  return {
    topics,
    latest,
    allGuidesHref: `/${locale}/guides`,
    allArticlesHref: `/${locale}/blog`,
  }
}
