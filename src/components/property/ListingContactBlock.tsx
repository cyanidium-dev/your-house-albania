'use client'

import { useEffect, useState, type ReactNode } from 'react'
import { useFlagVariant } from '@/lib/analytics/useFlagVariant'
import { contactOrderFromFlag, LISTING_CONTACT_ORDER_FLAG } from '@/lib/experiments/listingContactOrder'

/**
 * The inquiry button and the messenger buttons on a listing page, in the order
 * experiment E001 assigns (form first unless PostHog says otherwise). The
 * order changes in the DOM, not with CSS, so keyboard and screen-reader order
 * match what is on screen.
 *
 * Both blocks are desktop-only (phones get the sticky bar, which is not part
 * of the test), so the flag is read only at the `lg` width: a phone visitor
 * is never counted as exposed.
 */
/** Tailwind's `lg`, where the blocks are shown. */
const DESKTOP_QUERY = '(min-width: 1024px)'

function useMinWidth(query: string): boolean {
  const [matches, setMatches] = useState(false)
  useEffect(() => {
    const mql = window.matchMedia(query)
    const update = () => setMatches(mql.matches)
    update()
    mql.addEventListener('change', update)
    return () => mql.removeEventListener('change', update)
  }, [query])
  return matches
}

export function ListingContactBlock({
  form,
  messengers,
  className,
}: {
  form: ReactNode
  messengers: ReactNode
  className?: string
}) {
  const desktop = useMinWidth(DESKTOP_QUERY)
  const order = contactOrderFromFlag(useFlagVariant(LISTING_CONTACT_ORDER_FLAG, desktop))
  return (
    <div className={className} data-experiment-variant={order}>
      {order === 'messenger-first' ? (
        <>
          {messengers}
          {form}
        </>
      ) : (
        <>
          {form}
          {messengers}
        </>
      )}
    </div>
  )
}
