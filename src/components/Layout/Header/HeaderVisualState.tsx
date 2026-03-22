'use client'

import { useEffect, useState, useCallback } from 'react'
import { usePathname } from 'next/navigation'

export type HeaderVisualStateProps = {
  sticky: boolean
  isHomepage: boolean
}

type HeaderVisualStateComponentProps = {
  children: (props: HeaderVisualStateProps) => React.ReactNode
}

export default function HeaderVisualState({ children }: HeaderVisualStateComponentProps) {
  const pathname = usePathname()
  const [sticky, setSticky] = useState(false)

  const handleScroll = useCallback(() => {
    setSticky(window.scrollY >= 50)
  }, [])

  useEffect(() => {
    window.addEventListener('scroll', handleScroll)
    return () => {
      window.removeEventListener('scroll', handleScroll)
    }
  }, [handleScroll])

  const isHomepage = pathname === '/' || /^\/(en|uk|ru|al|it)\/?$/.test(pathname)

  return <>{children({ sticky, isHomepage })}</>
}
