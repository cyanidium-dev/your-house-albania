'use client'

import { Icon } from '@iconify/react'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { aiSearchPath } from '@/lib/ai/routes'

/**
 * Entry point to the assistant from anywhere on the site.
 *
 * Colour logic mirrors the other header icons: white while floating over the
 * hero photograph, themed once the bar has its own background.
 */
export default function HeaderAiSearchLink({
  locale,
  overHero,
  sticky,
}: {
  locale: string
  overHero: boolean
  sticky: boolean
}) {
  const t = useTranslations('AiSearch')

  return (
    <Link
      href={`${aiSearchPath(locale)}?from=header`}
      aria-label={t('headerLink')}
      title={t('headerLink')}
      className={`relative flex items-center justify-center p-0.5 transition-colors duration-300 ease-out hover:cursor-pointer hover:text-primary md:p-0 ${
        overHero
          ? sticky
            ? 'text-dark dark:text-white'
            : 'text-white'
          : 'text-dark dark:text-white'
      }`}
    >
      <Icon icon="ph:sparkle" width={24} height={24} className="h-5 w-5 md:h-6 md:w-6" />
    </Link>
  )
}
