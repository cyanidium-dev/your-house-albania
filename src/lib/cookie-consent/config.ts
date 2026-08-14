import type { ConsentChoices, GcmSignal, TogglableCategory } from "./types";

/**
 * Project-specific tuning. This is the ONLY file to edit when reusing the
 * module in another project. (Ported from code-site-workspace cookie-consent;
 * Domlivo additions: Microsoft Clarity mirror, CMS-provided policy link via
 * ConsentProvider prop instead of a hardcoded path.)
 */

/** First-party cookie holding the visitor's choice. */
export const CONSENT_COOKIE = "dl-consent";

/**
 * Bump to force every visitor to re-consent (new category, new tracker,
 * changed policy substance). Stored consent with a different `v` is ignored.
 */
export const CONSENT_VERSION = 1;

/** Days the choice is remembered (GDPR guidance: re-ask at most yearly). */
export const CONSENT_TTL_DAYS = 365;

/** GCM v2 signals controlled by each togglable category. */
export const CATEGORY_GCM_SIGNALS: Record<TogglableCategory, GcmSignal[]> = {
  functional: ["functionality_storage", "personalization_storage"],
  analytics: ["analytics_storage"],
  marketing: ["ad_storage", "ad_user_data", "ad_personalization"],
};

export const ALL_DENIED: ConsentChoices = {
  functional: false,
  analytics: false,
  marketing: false,
};

export const ALL_GRANTED: ConsentChoices = {
  functional: true,
  analytics: true,
  marketing: true,
};

/** dataLayer event pushed on every choice — usable as a GTM custom-event trigger. */
export const CONSENT_UPDATE_EVENT = "dl_consent_update";
