"use client";

/**
 * Google Consent Mode v2 helpers.
 *
 * The default state (everything "denied") is set in the root layout BEFORE GTM
 * loads. A future cookie banner calls {@link grantAnalyticsConsent} /
 * {@link denyAnalyticsConsent} (or {@link updateConsent} for fine-grained
 * control) to update consent after the user chooses.
 */

type ConsentValue = "granted" | "denied";

export type ConsentSettings = {
  analytics_storage?: ConsentValue;
  ad_storage?: ConsentValue;
  ad_user_data?: ConsentValue;
  ad_personalization?: ConsentValue;
};

function pushConsentUpdate(settings: ConsentSettings): void {
  if (typeof window === "undefined") return;
  window.dataLayer = window.dataLayer || [];
  // Consent Mode requires the gtag() `arguments` object, not a plain array push.
  const gtag: (...args: unknown[]) => void =
    window.gtag ??
    function () {
      // eslint-disable-next-line prefer-rest-params
      window.dataLayer.push(arguments);
    };
  window.gtag = gtag;
  gtag("consent", "update", settings);
}

/** Update one or more consent signals (Consent Mode v2 + Clarity mirror). */
export function updateConsent(settings: ConsentSettings): void {
  pushConsentUpdate(settings);
  // Mirror analytics consent to Microsoft Clarity when it's loaded.
  if (typeof window !== "undefined" && typeof window.clarity === "function") {
    window.clarity("consent", settings.analytics_storage === "granted");
  }
}

/** User accepted analytics + marketing cookies. */
export function grantAnalyticsConsent(): void {
  updateConsent({
    analytics_storage: "granted",
    ad_storage: "granted",
    ad_user_data: "granted",
    ad_personalization: "granted",
  });
}

/** User rejected analytics + marketing cookies (explicit denial). */
export function denyAnalyticsConsent(): void {
  updateConsent({
    analytics_storage: "denied",
    ad_storage: "denied",
    ad_user_data: "denied",
    ad_personalization: "denied",
  });
}
