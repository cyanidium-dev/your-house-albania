'use client'

import { useEffect, useState, useCallback } from 'react'
import { usePathname } from 'next/navigation'

export type HeaderVisualStateProps = {
  sticky: boolean
  isHomepage: boolean
  isCatalog: boolean
}

type HeaderVisualStateComponentProps = {
  children: (props: HeaderVisualStateProps) => React.ReactNode
}

export default function HeaderVisualState({ children }: HeaderVisualStateComponentProps) {
  const pathname = usePathname()
  const [sticky, setSticky] = useState(false)
  // Catalog/listing routes set data-catalog on <html> while their filter bar is
  // mounted. Mirror it into state so the header can shrink there (and nowhere else).
  const [isCatalog, setIsCatalog] = useState(false)

  const handleScroll = useCallback(() => {
    setSticky(window.scrollY >= 50)
  }, [])

  useEffect(() => {
    window.addEventListener('scroll', handleScroll)
    return () => {
      window.removeEventListener('scroll', handleScroll)
    }
  }, [handleScroll])

  useEffect(() => {
    const read = () => setIsCatalog(document.documentElement.dataset.catalog === '1')
    read()
    const observer = new MutationObserver(read)
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-catalog'],
    })
    return () => observer.disconnect()
  }, [pathname])

  const isHomepage = pathname === '/' || /^\/(en|uk|ru|al|it)\/?$/.test(pathname)

  return <>{children({ sticky, isHomepage, isCatalog })}</>
}
