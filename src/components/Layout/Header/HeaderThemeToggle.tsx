'use client'

import { Icon } from '@iconify/react'
import { useTheme } from 'next-themes'

type HeaderThemeToggleProps = {
  isHomepage: boolean
  sticky: boolean
}

export default function HeaderThemeToggle({
  isHomepage,
  sticky,
}: HeaderThemeToggleProps) {
  const { theme, setTheme } = useTheme()

  return (
    <button
      className='hover:cursor-pointer transition-colors duration-300 ease-out p-1 md:p-0'
      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
      aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      <Icon
        icon={'solar:sun-bold'}
        width={24}
        height={24}
        className={`dark:hidden block w-6 h-6 md:w-8 md:h-8 ${isHomepage
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
