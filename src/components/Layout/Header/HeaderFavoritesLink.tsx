'use client'

import { Icon } from '@iconify/react'
import Link from 'next/link'
import { useFavorites } from '@/hooks/useFavorites'

type HeaderFavoritesLinkProps = {
  locale: string
  isHomepage: boolean
  sticky: boolean
}

export default function HeaderFavoritesLink({
  locale,
  isHomepage,
  sticky,
}: HeaderFavoritesLinkProps) {
  const { favorites } = useFavorites()

  return (
    <Link
      href={`/${locale}/favorites`}
      aria-label={`Favorites (${favorites.length})`}
      data-favorites-target="true"
      className={`relative flex items-center justify-center transition-colors duration-300 ease-out hover:cursor-pointer hover:text-primary p-0.5 md:p-0 ${isHomepage
        ? sticky
          ? 'text-dark dark:text-white'
          : 'text-white'
        : 'text-dark dark:text-white'
        }`}
    >
      <Icon icon={'ph:heart'} width={24} height={24} className="w-5 h-5 md:w-6 md:h-6" />
      {favorites.length > 0 && (
        <span className="absolute -top-0.5 -right-0.5 md:-top-1.5 md:-right-1.5 min-w-[16px] h-[16px] md:min-w-[18px] md:h-[18px] px-0.5 md:px-1 flex items-center justify-center rounded-full bg-primary text-white text-[10px] md:text-[11px] font-semibold">
          {favorites.length > 99 ? '99+' : favorites.length}
        </span>
      )}
    </Link>
  )
}
