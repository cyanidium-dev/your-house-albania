'use client'

import { useEffect, useState } from 'react'
import { useFlagVariant } from '@/lib/analytics/useFlagVariant'
import { bootVariant } from '@/lib/experiments/bootFlags'

type Props = {
  /** A flag from `BOOT_FLAGS`. */
  flag: string
  /** Counted only up to this viewport width, where the tested layout differs. */
  maxWidth?: number
}

/**
 * Records the exposure of a boot-applied experiment (see `bootFlags.ts`) on a
 * page where the tested element is: reads the flag once PostHog has its flags,
 * which sends `$feature_flag_called`. Only when the variant was on `<html>` at
 * load and the viewport is within `maxWidth`, so a visitor who saw the default
 * layout is never counted. Renders nothing.
 */
export function ExperimentExposure({ flag, maxWidth }: Props) {
  const [eligible, setEligible] = useState(false)
  useEffect(() => {
    const narrowEnough = maxWidth === undefined || window.matchMedia(`(max-width: ${maxWidth}px)`).matches
    setEligible(narrowEnough && bootVariant(flag) !== null)
  }, [flag, maxWidth])
  useFlagVariant(flag, eligible)
  return null
}
