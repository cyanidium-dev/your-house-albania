import { CATEGORY_GCM_SIGNALS, CONSENT_UPDATE_EVENT } from "../config";
import type { ConsentChoices, GcmSignal, GcmState, TogglableCategory } from "../types";

/** Pure: category choices → full GCM v2 signal map. */
export function choicesToGcm(choices: ConsentChoices): GcmState {
  const state: GcmState = {
    ad_storage: "denied",
    ad_user_data: "denied",
    ad_personalization: "denied",
    analytics_storage: "denied",
    functionality_storage: "denied",
    personalization_storage: "denied",
    security_storage: "granted",
  };
  for (const [category, signals] of Object.entries(CATEGORY_GCM_SIGNALS) as Array<
    [TogglableCategory, GcmSignal[]]
  >) {
    if (choices[category]) {
      for (const signal of signals) state[signal] = "granted";
    }
  }
  return state;
}

/**
 * Push the visitor's choice to GTM. The consent API only recognises
 * `arguments` objects (what gtag.js pushes) — a plain array is silently
 * ignored, hence the `function` + cast dance. Also emits a named event so
 * GTM custom-event triggers can react, and mirrors the analytics choice to
 * Microsoft Clarity (which has its own consent API).
 */
export function pushConsentUpdate(choices: ConsentChoices): void {
  const dl = (window.dataLayer = window.dataLayer ?? []);
  function gtag() {
    // eslint-disable-next-line prefer-rest-params
    dl.push(arguments);
  }
  (gtag as unknown as (...args: unknown[]) => void)("consent", "update", choicesToGcm(choices));
  dl.push({ event: CONSENT_UPDATE_EVENT, consent: choices });

  if (typeof window.clarity === "function") {
    window.clarity("consent", choices.analytics);
  }
}
