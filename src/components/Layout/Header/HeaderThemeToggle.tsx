'use client'

import { useEffect, useState } from 'react'
import { Icon } from "@/components/shared/Icon";
import { useTheme } from 'next-themes'
import { cn } from '@/lib/utils'
import { HEADER_HIT_AREA, headerIconColorClass } from './headerSwitcherStyles'

type HeaderThemeToggleProps = {
  overHero: boolean
  sticky: boolean
  lightModeLabel: string
  darkModeLabel: string
}

export default function HeaderThemeToggle({
  overHero,
  sticky,
  lightModeLabel,
  darkModeLabel,
}: HeaderThemeToggleProps) {
  const { resolvedTheme, setTheme } = useTheme()
  // The server does not know the visitor's theme, so it renders the "switch
  // to dark" label; the client, once it has read localStorage, may already be
  // dark. Reading the theme only after mount keeps the first client render
  // identical to the server's and stops the hydration warning on every page.
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  const isDark = mounted && resolvedTheme === 'dark'

  return (
    <button
      type="button"
      className={cn(HEADER_HIT_AREA, headerIconColorClass(overHero, sticky))}
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      aria-label={isDark ? lightModeLabel : darkModeLabel}
    >
      <Icon icon={'solar:sun-bold'} width={24} height={24} aria-hidden className="block h-6 w-6 dark:hidden md:h-7 md:w-7" />
      <Icon icon={'solar:moon-bold'} width={24} height={24} aria-hidden className="hidden h-6 w-6 dark:block md:h-7 md:w-7" />
    </button>
  )
}
