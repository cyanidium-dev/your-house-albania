'use client'

import { SpriteIcon as Icon } from "@/components/shared/SpriteIcon";
import Link from "@/components/shared/Link";
import { useTranslations } from 'next-intl'
import { aiSearchPath } from '@/lib/ai/routes'
import { cn } from '@/lib/utils'
import { HEADER_HIT_AREA, headerIconColorClass } from './headerSwitcherStyles'

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
      className={cn(HEADER_HIT_AREA, headerIconColorClass(overHero, sticky))}
    >
      <Icon icon="ph:sparkle" width={24} height={24} aria-hidden className="h-6 w-6" />
    </Link>
  )
}
