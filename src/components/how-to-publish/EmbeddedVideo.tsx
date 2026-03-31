import { parseVideoEmbedUrl } from '@/lib/video/embedUrl'

type EmbeddedVideoProps = {
  videoUrl: string | null | undefined
  /** Anchor id for in-page links (e.g. hero CTA scroll). */
  anchorId?: string
}

/**
 * Safe responsive iframe embed for YouTube / Vimeo URLs resolved via {@link parseVideoEmbedUrl}.
 * Renders nothing if the URL is missing or unsupported.
 */
export function EmbeddedVideo({ videoUrl, anchorId = 'how-to-publish-video' }: EmbeddedVideoProps) {
  const parsed = videoUrl?.trim() ? parseVideoEmbedUrl(videoUrl.trim()) : null
  if (!parsed) return null

  return (
    <div
      id={anchorId}
      className="relative w-full overflow-hidden rounded-2xl border border-dark/10 bg-dark/[0.03] shadow-sm dark:border-white/15 dark:bg-white/[0.04] aspect-video"
    >
      <iframe
        src={parsed.iframeSrc}
        title={parsed.title}
        className="absolute inset-0 h-full w-full border-0"
        allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
        loading="lazy"
        referrerPolicy="strict-origin-when-cross-origin"
      />
    </div>
  )
}
