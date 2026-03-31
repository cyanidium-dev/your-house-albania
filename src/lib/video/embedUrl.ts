/**
 * Parses a user-facing video URL into a safe iframe src for known providers.
 * Returns null if the URL is missing, invalid, or unsupported.
 */

const YT_ID = /^[a-zA-Z0-9_-]{11}$/

function youtubeEmbedSrc(videoId: string): string {
  return `https://www.youtube-nocookie.com/embed/${encodeURIComponent(videoId)}`
}

function extractYoutubeIdFromPath(pathname: string, searchParams: URLSearchParams): string | null {
  if (pathname === '/watch' || pathname.startsWith('/watch/')) {
    const v = searchParams.get('v')
    if (v && YT_ID.test(v)) return v
  }
  if (pathname.startsWith('/embed/')) {
    const id = pathname.slice('/embed/'.length).split('/')[0] ?? ''
    if (id && YT_ID.test(id)) return id
  }
  if (pathname.startsWith('/shorts/')) {
    const id = pathname.split('/')[2] ?? ''
    if (id && YT_ID.test(id)) return id
  }
  if (pathname.startsWith('/v/')) {
    const id = pathname.split('/')[2] ?? ''
    if (id && YT_ID.test(id)) return id
  }
  return null
}

function parseYoutube(url: URL): string | null {
  const host = url.hostname.replace(/^www\./, '')
  if (host === 'youtu.be') {
    const id = url.pathname.replace(/^\//, '').split('/')[0] ?? ''
    return id && YT_ID.test(id) ? youtubeEmbedSrc(id) : null
  }
  if (
    host === 'youtube.com' ||
    host === 'm.youtube.com' ||
    host === 'youtube-nocookie.com'
  ) {
    const id = extractYoutubeIdFromPath(url.pathname, url.searchParams)
    return id ? youtubeEmbedSrc(id) : null
  }
  return null
}

function parseVimeo(url: URL): string | null {
  const host = url.hostname.replace(/^www\./, '')
  if (host === 'player.vimeo.com' && url.pathname.startsWith('/video/')) {
    const id = url.pathname.slice('/video/'.length).split('/')[0] ?? ''
    return /^\d+$/.test(id) ? `https://player.vimeo.com/video/${id}` : null
  }
  if (host === 'vimeo.com') {
    const parts = url.pathname.split('/').filter(Boolean)
    const id = parts[0]
    if (id && /^\d+$/.test(id)) {
      return `https://player.vimeo.com/video/${id}`
    }
  }
  return null
}

export type ParsedVideoEmbed = {
  iframeSrc: string
  /** Short label for iframe title (a11y). */
  title: string
}

/**
 * Normalizes common YouTube / Vimeo watch URLs to an embeddable iframe origin.
 */
export function parseVideoEmbedUrl(raw: string): ParsedVideoEmbed | null {
  const trimmed = raw.trim()
  if (!trimmed) return null

  let url: URL
  try {
    url = new URL(trimmed)
  } catch {
    return null
  }

  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    return null
  }

  const yt = parseYoutube(url)
  if (yt) {
    return { iframeSrc: yt, title: 'YouTube video' }
  }

  const vm = parseVimeo(url)
  if (vm) {
    return { iframeSrc: vm, title: 'Vimeo video' }
  }

  return null
}
