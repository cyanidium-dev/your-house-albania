/**
 * Central analytics configuration.
 *
 * Analytics (GTM, GA4 via GTM, Microsoft Clarity) only loads when
 * `NEXT_PUBLIC_ENABLE_ANALYTICS` is explicitly "true". Any other value or a
 * missing env → analytics is disabled (local/dev/preview stay clean).
 */
export const GTM_ID = "GTM-T27ZZ289";
export const CLARITY_ID = "x4l0dctgle";

export const analyticsEnabled =
  process.env.NEXT_PUBLIC_ENABLE_ANALYTICS === "true";
