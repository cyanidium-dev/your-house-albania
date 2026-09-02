"use client";

import { useMemo } from 'react'
import { Icon } from '@iconify/react'
import { useTranslations } from 'next-intl'
import { cn } from '@/lib/utils'
import type { ViewMode } from '@/lib/catalog/viewMode'
import type { ConstructionStage } from '@/types/catalog'

type Badge = {
  key: string
  label: string
  icon: string
  className: string
}

export function PropertyBadges({
  promotionType,
  discountPercent,
  constructionStage,
  handoverYear,
  handoverQuarter,
  view,
}: {
  promotionType?: 'premium' | 'top' | 'sale'
  discountPercent?: number
  constructionStage?: ConstructionStage
  handoverYear?: number
  handoverQuarter?: number
  view: ViewMode
}) {
  const t = useTranslations('Shared.propertyCard')
  const isList = view === 'list'
  const isSmall = view === 'small'

  const badges = useMemo(() => {
    const list: Badge[] = []

    if (promotionType === 'premium') {
      list.push({
        key: 'premium',
        label: t('premium'),
        icon: 'ph:star-fill',
        className: 'bg-yellow-400 text-black ring-1 ring-yellow-500/50',
      })
    } else if (promotionType === 'top') {
      list.push({
        key: 'top',
        label: t('top'),
        icon: 'ph:fire-fill',
        className: 'bg-primary text-white ring-1 ring-primary/40',
      })
    } else if (promotionType === 'sale') {
      list.push({
        key: 'sale',
        label:
          typeof discountPercent === 'number' ? t('discount', { value: discountPercent }) : t('sale'),
        icon: 'ph:tag-fill',
        className: 'bg-red-500 text-white ring-1 ring-red-600/40',
      })
    }

    // Only an unfinished building earns a badge. "Completed" is the norm here,
    // and labelling the norm just adds noise to every other card.
    if (constructionStage === 'off-plan' || constructionStage === 'under-construction') {
      const stageLabel =
        constructionStage === 'off-plan' ? t('stageOffPlan') : t('stageUnderConstruction')
      const handover = handoverYear
        ? handoverQuarter
          ? t('handoverQuarter', { quarter: handoverQuarter, year: handoverYear })
          : t('handoverYear', { year: handoverYear })
        : ''
      list.push({
        key: 'stage',
        label: handover ? `${stageLabel} · ${handover}` : stageLabel,
        icon: 'ph:crane-tower-fill',
        className: 'bg-dark/85 text-white ring-1 ring-white/20',
      })
    }

    return list
  }, [promotionType, discountPercent, constructionStage, handoverYear, handoverQuarter, t])

  if (badges.length === 0) return null

  const badgeIconSize = isList || isSmall ? 13 : 14

  return (
    <div
      className={cn(
        'absolute z-[35] pointer-events-none flex flex-col items-start gap-1 max-w-[calc(100%-3.5rem)]',
        isList ? 'top-2 left-2' : 'top-4 left-4',
        isSmall && !isList && 'top-2 left-2'
      )}
    >
      {badges.map((badge) => (
        <span
          key={badge.key}
          className={cn(
            'inline-flex items-center gap-1.5 min-w-0 max-w-full rounded px-2 py-1 text-xs font-semibold shadow-sm backdrop-blur-[1px]',
            badge.className
          )}
        >
          <Icon
            icon={badge.icon}
            width={badgeIconSize}
            height={badgeIconSize}
            className="shrink-0"
            aria-hidden
          />
          <span className="min-w-0 truncate">{badge.label}</span>
        </span>
      ))}
    </div>
  )
}
