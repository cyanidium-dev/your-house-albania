import { Icon } from '@iconify/react'
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
  const columns = (showRooms ? 2 : 0) + 1 + (showPlot ? 1 : 0)

  const iconSize = isList ? 18 : isSmall ? 16 : 20

  const metaItemClass = cn(
    'flex flex-col font-normal text-black dark:text-white',
    isList && 'gap-0.5 text-xs',
    isSmall && !isList && 'gap-0.5 text-[11px]',
    !isSmall && !isList && 'gap-1.5 text-sm mobile:text-base'
  )

  return (
    <div
      className={cn(
        'grid w-full min-w-0',
        columns === 4 ? 'grid-cols-4' : columns === 3 ? 'grid-cols-3' : columns === 2 ? 'grid-cols-2' : 'grid-cols-1',
        isList && 'mt-1 pt-1.5 border-t border-black/5 dark:border-white/10'
      )}
    >
      {showRooms && (
        <>
          <div
            className={cn(
              'flex border-e border-black/10 dark:border-white/20 items-center',
              isSmall && !isList ? 'flex-row gap-1 py-0.5 justify-between' : 'flex-col gap-1.5 py-1 justify-center',
              isList && 'gap-0.5 py-0.5 justify-start',
              metaItemClass
            )}
          >
            <Icon icon="solar:bed-linear" width={iconSize} height={iconSize} className="shrink-0" />
            <span className={cn('truncate max-w-full', isSmall && !isList && 'min-w-0')}>
              {t('bedroomsCount', { count: beds })}
            </span>
          </div>
          <div
            className={cn(
              'flex border-e border-black/10 dark:border-white/20 items-center',
              isSmall && !isList ? 'flex-row gap-1 py-0.5 justify-between' : 'flex-col gap-1.5 py-1 justify-center',
              isList && 'gap-0.5 py-0.5 justify-start',
              metaItemClass
            )}
          >
            <Icon icon="solar:bath-linear" width={iconSize} height={iconSize} className="shrink-0" />
            <span className={cn('truncate max-w-full', isSmall && !isList && 'min-w-0')}>
              {t('bathroomsCount', { count: baths })}
            </span>
          </div>
        </>
      )}
      <div
        className={cn(
          'flex items-center min-w-0',
          showPlot && 'border-e border-black/10 dark:border-white/20',
          isSmall && !isList ? 'flex-row gap-1 py-0.5 justify-between' : 'flex-col gap-1.5 py-1 justify-center',
          isList && 'gap-0.5 py-0.5 justify-start',
          metaItemClass
        )}
      >
        <Icon icon="lineicons:arrow-all-direction" width={iconSize} height={iconSize} className="shrink-0" />
        <span className={cn('truncate max-w-full', isSmall && !isList && 'min-w-0')}>
          {area}{t('areaUnit')}
        </span>
      </div>
      {showPlot && (
        <div
          className={cn(
            'flex items-center min-w-0',
            isSmall && !isList ? 'flex-row gap-1 py-0.5 justify-between' : 'flex-col gap-1.5 py-1 justify-center',
            isList && 'gap-0.5 py-0.5 justify-start',
            metaItemClass
          )}
          title={plotArea ? t('plotArea', { value: plotArea }) : t('plotAreaUnknown')}
        >
          <Icon icon="solar:map-linear" width={iconSize} height={iconSize} className="shrink-0" />
          <span className={cn('truncate max-w-full', isSmall && !isList && 'min-w-0')}>
            {plotArea ? t('plotArea', { value: plotArea }) : t('plotAreaUnknown')}
          </span>
        </div>
      )}
    </div>
  )
}
