/**
 * Iconify icon id for a `socialLinks[].platform` string (case-insensitive substring match).
 * LinkedIn: add `linkedin` / `LinkedIn` in CMS platform field.
 */
export function iconForContactsSocialPlatform(platform: string): string {
  const p = platform.toLowerCase()
  if (p.includes('telegram')) return 'ph:telegram-logo'
  if (p.includes('facebook')) return 'ph:facebook-logo'
  if (p.includes('instagram')) return 'ph:instagram-logo'
  if (p.includes('youtube')) return 'ph:youtube-logo'
  if (p.includes('linkedin')) return 'ph:linkedin-logo'
  return 'ph:link'
}
