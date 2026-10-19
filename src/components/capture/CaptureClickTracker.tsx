'use client'

import type { ReactNode } from 'react'
import { track } from '@/lib/analytics/track'
import type { LeadPlacement } from '@/lib/leads/types'

/**
 * Records a click on any link inside a capture block (the price neighbours of
 * a listing, the budget chips of a district) as `capture_click`, so GA4 and
 * Clarity show which of the new blocks people use. One listener on the block,
 * nothing per link.
 */
export function CaptureClickTracker({
  block,
  placement,
  className,
  children,
}: {
  block: 'price-neighbours' | 'district-budget'
  placement: LeadPlacement
  className?: string
  children: ReactNode
}) {
  return (
    <div
      className={className}
      data-lead-placement={placement}
      onClickCapture={(e) => {
        const a = (e.target as HTMLElement | null)?.closest?.('a[href]')
        if (!a) return
        track({ event: 'capture_click', block, placement, target: a.getAttribute('href') ?? '' })
      }}
    >
      {children}
    </div>
  )
}
