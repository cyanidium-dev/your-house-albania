/**
 * Guide topics: how the header's Guides menu, the drawer and the blog filter
 * group the articles.
 *
 * The CMS has twelve blog categories, and they overlap ("Guides", "City
 * guides", "District guides", "Neighborhoods") or sit empty ("Tips",
 * "Tourism" on 2026-10-11). A visitor choosing what to read needs five or six
 * plain topics, so the grouping lives here, in code, over the categories that
 * exist. A topic shows only while at least one published post carries one of
 * its categories; nothing here invents a category.
 *
 * A post lands in every topic one of its categories maps to, so the counts can
 * add up to more than the number of posts. The listing behind each topic is
 * `/{locale}/blog?topic={key}` (see `listing-query/blog`), which filters on
 * the same category list, so the count in the menu is the count on the page.
 *
 * Comparisons ("Durrës or Vlorë") are not blog posts: they are guide landings
 * with `-vs-` in the slug, and their entry links to that section of /guides.
 */

export type GuideTopicKey = 'investing' | 'buying' | 'market' | 'places' | 'living'

export type GuideTopic = {
  key: GuideTopicKey
  /** Iconify name, bundled (scripts/build-icon-bundle.mjs). */
  icon: string
  /** Blog category slugs (Sanity `blogCategory.slug`). */
  categories: readonly string[]
}

export const GUIDE_TOPICS: readonly GuideTopic[] = [
  { key: 'investing', icon: 'ph:chart-line-up', categories: ['investment-guides', 'renting-in-albania'] },
  { key: 'buying', icon: 'ph:key', categories: ['buying-in-albania', 'legal-and-taxes', 'guides', 'tips'] },
  { key: 'market', icon: 'ph:chart-bar', categories: ['market-trends'] },
  { key: 'places', icon: 'ph:map-pin', categories: ['city-guides', 'district-guides', 'neighborhoods'] },
  { key: 'living', icon: 'ph:sun-horizon', categories: ['lifestyle', 'tourism'] },
]

/** The comparisons entry: guide landings whose slug holds `-vs-`. */
export const COMPARISONS_TOPIC = { key: 'comparisons', icon: 'ph:arrows-left-right' } as const

/** Section ids on /guides, so a menu entry can land on its group. */
export const GUIDES_SECTION_IDS = { guides: 'guides', comparisons: 'comparisons' } as const

export function isComparisonGuideSlug(slug?: string | null): boolean {
  return typeof slug === 'string' && slug.includes('-vs-')
}

export function findGuideTopic(key?: string | null): GuideTopic | undefined {
  if (!key) return undefined
  const k = key.trim().toLowerCase()
  return GUIDE_TOPICS.find((t) => t.key === k)
}

/** True when a post with these category slugs belongs to the topic. */
export function postInTopic(categorySlugs: readonly (string | null | undefined)[] | null | undefined, topic: GuideTopic): boolean {
  if (!categorySlugs?.length) return false
  return categorySlugs.some((c) => typeof c === 'string' && topic.categories.includes(c))
}

export function blogTopicHref(locale: string, key: GuideTopicKey): string {
  return `/${locale}/blog?topic=${key}`
}

/**
 * Which topic a guide landing (not a blog post) belongs to, from its slug: the
 * landings carry no category. Order matters — the first rule that matches wins.
 * Comparisons are their own group (isComparisonGuideSlug) and never reach this.
 */
const GUIDE_LANDING_RULES: ReadonlyArray<[RegExp, GuideTopicKey]> = [
  [/invest|yield|rental|dochod/, 'investing'],
  [/market|price|ceny|cmim|ile-kosztuje|tanie|czy-warto/, 'market'],
  [/^(apartment|house|villa)-|mieszkania-w-|nieruchomosci-(saranda|nad-morzem)|-durres$|-tirana$|-vlore$|-sarande$/, 'places'],
  [/living|retire|moving|family|relocat/, 'living'],
]

export function guideLandingTopic(slug?: string | null): GuideTopicKey {
  const s = (slug ?? '').toLowerCase()
  for (const [re, key] of GUIDE_LANDING_RULES) if (re.test(s)) return key
  return 'buying'
}
