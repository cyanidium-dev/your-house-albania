'use client'

import { useEffect, useState, useCallback } from 'react'
import { usePathname } from 'next/navigation'
import { isHomePathname } from '@/i18n/isHomePathname'

export type HeaderVisualStateProps = {
  sticky: boolean
  /**
   * The header is floating over a full-bleed photograph, so it renders
   * light-on-dark until the page scrolls. True on the homepage and on any page
   * whose hero sets the `data-photo-hero` flag (see `PhotoHeroFlag`).
   */
  overHero: boolean
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
  // Photo heroes set data-photo-hero the same way, for the same reason: the
  // header cannot know from the pathname which CMS landings open on a picture.
  const [photoHero, setPhotoHero] = useState(false)

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
    const read = () => {
      setIsCatalog(document.documentElement.dataset.catalog === '1')
      setPhotoHero(document.documentElement.dataset.photoHero === '1')
    }
    read()
    const observer = new MutationObserver(read)
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-catalog', 'data-photo-hero'],
    })
    return () => observer.disconnect()
  }, [pathname])

  const overHero = isHomePathname(pathname) || photoHero

  return <>{children({ sticky, overHero, isCatalog })}</>
}
