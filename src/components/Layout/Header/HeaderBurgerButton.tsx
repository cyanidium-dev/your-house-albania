'use client'

import { Icon } from '@iconify/react'

type HeaderBurgerButtonProps = {
  onClick: () => void
  isHomepage: boolean
  sticky: boolean
  menuLabel: string
}

export default function HeaderBurgerButton({
  onClick,
  isHomepage,
  sticky,
  menuLabel,
}: HeaderBurgerButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 md:gap-3 p-1.5 sm:px-5 sm:py-3 rounded-full font-semibold hover:cursor-pointer border transition-colors duration-300 ease-out text-sm md:text-base ${isHomepage
        ? sticky
          ? 'text-white bg-dark dark:bg-white dark:text-dark dark:hover:text-white dark:hover:bg-dark hover:text-dark hover:bg-white border-dark dark:border-white'
          : 'text-dark bg-white dark:text-dark hover:bg-transparent hover:text-white border-white'
        : 'bg-dark text-white hover:bg-transparent hover:text-dark dark:bg-white dark:text-dark dark:hover:bg-transparent dark:hover:text-white duration-300'
        }`}
      aria-label='Toggle mobile menu'
    >
      <span>
        <Icon icon={'ph:list'} width={24} height={24} className="w-5 h-5 md:w-6 md:h-6" />
      </span>
      <span className='hidden lg:block'>{menuLabel}</span>
    </button>
  )
}
