'use client'

import { useEffect, useState } from 'react'
import { Icon } from "@/components/shared/Icon";
import { useTheme } from 'next-themes'

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
      className='hover:cursor-pointer transition-colors duration-300 ease-out p-1 md:p-0'
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      aria-label={isDark ? lightModeLabel : darkModeLabel}
    >
      <Icon
        icon={'solar:sun-bold'}
        width={24}
        height={24}
        className={`dark:hidden block w-6 h-6 md:w-8 md:h-8 ${overHero
          ? sticky
            ? 'text-dark'
            : 'text-white'
          : 'text-dark'
          }`}
      />
      <Icon
        icon={'solar:moon-bold'}
        width={24}
        height={24}
        className='dark:block hidden text-white w-6 h-6 md:w-8 md:h-8'
      />
    </button>
  )
}
