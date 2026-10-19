'use client'

import { useEffect, useState } from 'react'
import { getFlagVariant, onFlagsChange } from './posthog'

/**
 * A PostHog multivariate flag's value for this visitor, `undefined` until
 * PostHog is consented, loaded and has its flags. Read once on mount and again
 * when flags arrive, so the exposure event fires when the variant is shown.
 * With `enabled` false the flag is not read at all, so a visitor who cannot
 * see the tested element is not counted as exposed.
 */
export function useFlagVariant(key: string, enabled = true): string | undefined {
  const [variant, setVariant] = useState<string | undefined>(undefined)
  useEffect(() => {
    if (!enabled) {
      setVariant(undefined)
      return
    }
    const read = () => setVariant(getFlagVariant(key))
    read()
    return onFlagsChange(read)
  }, [key, enabled])
  return variant
}
