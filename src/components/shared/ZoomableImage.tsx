'use client'

import { useState, type ReactNode } from 'react'
import dynamic from 'next/dynamic'
import { cn } from '@/lib/utils'

/** The viewer is code most readers never need: it loads on the first click. */
const ImageLightbox = dynamic(() => import('@/components/shared/ImageLightbox').then((m) => m.ImageLightbox), {
  ssr: false,
})

/**
 * Wraps a server-rendered image in a button that opens it full screen
 * (Escape, the ✕ or a click on the backdrop closes it). Readers clicked the
 * article covers and got nothing — Clarity's dead clicks on the protest
 * articles (audit 2026-10-18). The image itself stays the server's, so the
 * LCP of an article is untouched.
 */
export function ZoomableImage({
  url,
  alt,
  label,
  className,
  children,
}: {
  url: string
  alt: string
  /** Accessible name of the button ("View image full screen"). */
  label: string
  className?: string
  children: ReactNode
}) {
  const [open, setOpen] = useState(false)
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={label}
        className={cn(
          'block w-full cursor-zoom-in text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50',
          className,
        )}
      >
        {children}
      </button>
      {open ? <ImageLightbox url={url} alt={alt} isOpen onClose={() => setOpen(false)} /> : null}
    </>
  )
}
