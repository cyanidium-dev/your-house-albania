"use client";

import { useMemo } from 'react'
import { Icon } from '@iconify/react'
import { useTranslations } from 'next-intl'
import { cn } from '@/lib/utils'
import type { ViewMode } from '@/lib/catalog/viewMode'

export function PropertyBadges({
  promotionType,
  discountPercent,
  view,
}: {
  promotionType?: 'premium' | 'top' | 'sale'
  discountPercent?: number
  view: ViewMode
}) {
  const t = useTranslations('Shared.propertyCard')
  const isList = view === 'list'
  const isSmall = view === 'small'

  const marketingBadge = useMemo(() => {
    if (promotionType === 'premium') {
      return {
        type: 'premium' as const,
        label: t('premium'),
        icon: 'ph:star-fill' as const,
      }
    }
    if (promotionType === 'top') {
      return {
        type: 'top' as const,
        label: t('top'),
        icon: 'ph:fire-fill' as const,
      }
    }
    if (promotionType === 'sale') {
      return {
        type: 'sale' as const,
        label:
          typeof discountPercent === 'number'
            ? t('discount', { value: discountPercent })
            : t('sale'),
        icon: 'ph:tag-fill' as const,
      }
    }
    return null
  }, [promotionType, discountPercent, t])

  if (!marketingBadge) return null

  const badgeClass = (() => {
    switch (marketingBadge.type) {
      case 'premium':
        return 'bg-yellow-400 text-black ring-1 ring-yellow-500/50'
      case 'top':
        return 'bg-primary text-white ring-1 ring-primary/40'
      case 'sale':
        return 'bg-red-500 text-white ring-1 ring-red-600/40'
      default:
        return 'bg-dark text-white'
    }
  })()

  const badgeIconSize = isList || isSmall ? 13 : 14

  return (
    <div
      className={cn(
        'absolute z-[35] pointer-events-none max-w-[calc(100%-3.5rem)]',
        isList ? 'top-2 left-2' : 'top-4 left-4',
        isSmall && !isList && 'top-2 left-2'
      )}
    >
      <span
        className={cn(
          'inline-flex items-center gap-1.5 min-w-0 max-w-full rounded px-2 py-1 text-xs font-semibold shadow-sm backdrop-blur-[1px]',
          badgeClass
        )}
      >
        <Icon
          icon={marketingBadge.icon}
          width={badgeIconSize}
          height={badgeIconSize}
          className="shrink-0"
          aria-hidden
        />
        <span className="min-w-0 truncate">{marketingBadge.label}</span>
      </span>
    </div>
  )
}
