import { SpriteIcon } from "@/components/shared/SpriteIcon";
import { useTranslations } from 'next-intl'
import { cn } from '@/lib/utils'
import type { ViewMode } from '@/lib/catalog/viewMode'

export function PropertyCardMeta({
  view,
  beds,
  baths,
  area,
  plotArea,
  showPlot = false,
  showRooms = true,
}: {
  view: ViewMode
  beds: number
  baths: number
  area: number
  /** Land under a house or villa, m². */
  plotArea?: number | null
  /** Houses and villas get a fourth tile, which reads "not specified" when the seller gave no figure. */
  showPlot?: boolean
  /** False on land and commercial space: no bedroom or bathroom tiles, the area stands alone. */
  showRooms?: boolean
}) {
  const t = useTranslations('Shared.propertyCard')
  const isList = view === 'list'
  const isSmall = view === 'small'
  // No area on record → no "0 m²" tile; the row simply has one cell fewer.
  const showArea = typeof area === 'number' && area > 0
  // Zero rooms is "not stated" (studios, plots, many partner houses), never
  // a fact worth a tile: cards printed "0 Bedrooms" (QA 2026-10-11).
  const showBeds = showRooms && typeof beds === 'number' && beds > 0
  const showBaths = showRooms && typeof baths === 'number' && baths > 0
  const columns = (showBeds ? 1 : 0) + (showBaths ? 1 : 0) + (showArea ? 1 : 0) + (showPlot ? 1 : 0)
  if (columns === 0) return null

  const compact = isSmall || isList
  const iconSize = compact ? 14 : 16
  const unit = t('areaUnit')

  // One line of facts with small icons instead of a row of icon-over-label
  // tiles: on two phone columns the tiles cut "1 Bedroom" to "1 Bedr…" and
  // took a second line (owner, 2026-10-21). Compact cards show the figures;
  // the full wording stays in the HTML for screen readers and search engines.
  const items: { key: string; icon: string; short: string; full: string }[] = []
  if (showBeds) items.push({ key: 'beds', icon: 'solar:bed-linear', short: String(beds), full: t('bedroomsCount', { count: beds }) })
  if (showBaths) items.push({ key: 'baths', icon: 'solar:bath-linear', short: String(baths), full: t('bathroomsCount', { count: baths }) })
  if (showArea) items.push({ key: 'area', icon: 'lineicons:arrow-all-direction', short: `${area} ${unit}`, full: `${area} ${unit}` })
  if (showPlot) {
    const full = plotArea ? t('plotArea', { value: plotArea }) : t('plotAreaUnknown')
    items.push({ key: 'plot', icon: 'solar:map-linear', short: plotArea ? `${plotArea} ${unit}` : '–', full })
  }

  return (
    <ul
      className={cn(
        'flex w-full min-w-0 flex-wrap items-center text-black/80 dark:text-white/80 tabular-nums',
        compact ? 'gap-x-3 gap-y-1 text-xs' : 'gap-x-5 gap-y-1.5 text-sm',
        isList && 'mt-1 pt-1.5 border-t border-black/5 dark:border-white/10'
      )}
    >
      {items.map((item) => (
        <li key={item.key} className="inline-flex min-w-0 items-center gap-1.5 whitespace-nowrap" title={item.full}>
          <SpriteIcon icon={item.icon} width={iconSize} height={iconSize} className="shrink-0 text-black/45 dark:text-white/45" />
          {compact ? (
            <>
              <span aria-hidden>{item.short}</span>
              <span className="sr-only">{item.full}</span>
            </>
          ) : (
            <span>{item.full}</span>
          )}
        </li>
      ))}
    </ul>
  )
}
