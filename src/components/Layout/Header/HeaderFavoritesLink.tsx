'use client'

import { Icon } from "@/components/shared/Icon";
import Link from "@/components/shared/Link";
import { useTranslations } from 'next-intl'
import { useFavorites } from '@/hooks/useFavorites'
import { cn } from '@/lib/utils'
import { HEADER_HIT_AREA, headerIconColorClass } from './headerSwitcherStyles'

type HeaderFavoritesLinkProps = {
  locale: string
  overHero: boolean
  sticky: boolean
}

export default function HeaderFavoritesLink({
  locale,
  overHero,
  sticky,
}: HeaderFavoritesLinkProps) {
  const { favorites } = useFavorites()
  const t = useTranslations('Header')

  return (
    <Link
      href={`/${locale}/favorites`}
      aria-label={t('favoritesCount', { count: favorites.length })}
      data-favorites-target="true"
      className={cn(HEADER_HIT_AREA, headerIconColorClass(overHero, sticky))}
    >
      <Icon icon={'ph:heart'} width={24} height={24} aria-hidden className="h-6 w-6" />
      {favorites.length > 0 && (
        <span className="absolute top-1 right-0.5 min-w-[16px] h-[16px] md:min-w-[18px] md:h-[18px] px-0.5 md:px-1 flex items-center justify-center rounded-full bg-primary text-white text-[10px] md:text-[11px] font-semibold">
          {favorites.length > 99 ? '99+' : favorites.length}
        </span>
      )}
    </Link>
  )
}
