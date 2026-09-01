'use client'

import { useEffect } from 'react'

/**
 * Marks the page as opening on a full-bleed photograph.
 *
 * The header is fixed and transparent until you scroll, so on a page that
 * starts with a photo it floats over the picture and needs its light-on-dark
 * variant — the dark logo and icons disappear against a bright sky. The
 * homepage always did this, keyed off the pathname; every hero that now carries
 * a photograph needs the same treatment, and pathname matching would not scale
 * to CMS-driven landings.
 *
 * Same mechanism as the `data-catalog` flag the filter bar sets: an attribute
 * on `<html>` that lives exactly as long as the component that owns it.
 */
export function PhotoHeroFlag() {
  useEffect(() => {
    document.documentElement.dataset.photoHero = '1'
    return () => {
      delete document.documentElement.dataset.photoHero
    }
  }, [])
  return null
}
