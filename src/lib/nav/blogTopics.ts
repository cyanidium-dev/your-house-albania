import { getTranslations } from 'next-intl/server'
import { GUIDE_TOPICS, blogTopicHref, findGuideTopic, postInTopic, type GuideTopic } from '@/data/guideTopics'
import { fetchNavGuidePosts } from '@/lib/sanity/queries/navMenu'

export type BlogTopicChip = { key: string; label: string; href: string; count: number }

/**
 * The blog index's filter chips: the guide topics that have posts, with their
 * counts — the same list, labels and numbers as the header's Guides menu.
 */
export async function loadBlogTopicChips(locale: string): Promise<BlogTopicChip[]> {
  const [posts, t] = await Promise.all([fetchNavGuidePosts(), getTranslations('Header.guideTopics')])
  return GUIDE_TOPICS.map((topic) => ({
    key: topic.key,
    label: t(topic.key),
    href: blogTopicHref(locale, topic.key),
    count: posts.filter((p) => postInTopic(p.categories, topic)).length,
  })).filter((chip) => chip.count > 0)
}

/** The topic named by `?topic=`, when it is one. */
export function topicFromSearch(value: string | string[] | undefined): GuideTopic | undefined {
  return typeof value === 'string' ? findGuideTopic(value) : undefined
}
