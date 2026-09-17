import { CATEGORY_GCM_SIGNALS, CONSENT_COOKIE, CONSENT_VERSION } from "../config";
import type { GcmSignal, TogglableCategory } from "../types";

/** Same key `src/lib/analytics/attribution.ts` writes; kept literal so this module stays dependency-free. */
const INTERNAL_STORAGE_KEY = "domlivo:internal";

/**
 * Vanilla-JS bootstrap that MUST execute before GTM and Clarity:
 *
 * 1. Pushes GCM v2 `default = denied` (all storage except security) so
 *    GA4/ad tags inside GTM stay gated for first-time visitors.
 * 2. Stubs the Clarity queue and defaults its consent to false.
 * 3. Synchronously re-applies a returning visitor's stored choice, so GTM
 *    and Clarity boot with the correct state without waiting for React
 *    hydration.
 * 4. Marks our own browsers (`?domlivo_internal=1`, remembered in
 *    localStorage by `attribution.ts`) as `traffic_type: internal` before GTM
 *    reads the data layer. Pushed any later, the Google tag has already sent
 *    its page_view without it and GA4's internal-traffic filter misses it.
 *
 * Returned as a string (rendered via dangerouslySetInnerHTML) so unit tests
 * can assert its shape. The category→signal mapping is generated from
 * CATEGORY_GCM_SIGNALS — one source of truth with consent-mode.ts.
 */
export function buildBootstrapScript(): string {
  const updateEntries = (
    Object.entries(CATEGORY_GCM_SIGNALS) as Array<[TogglableCategory, GcmSignal[]]>
  )
    .flatMap(([category, signals]) => signals.map((s) => `${s}:g(c.${category})`))
    .join(",");

  return (
    `window.dataLayer=window.dataLayer||[];` +
    `function gtag(){dataLayer.push(arguments);}` +
    `gtag("consent","default",{ad_storage:"denied",ad_user_data:"denied",ad_personalization:"denied",analytics_storage:"denied",functionality_storage:"denied",personalization_storage:"denied",security_storage:"granted",wait_for_update:2000});` +
    `gtag("set","ads_data_redaction",true);` +
    `gtag("set","url_passthrough",true);` +
    `window.clarity=window.clarity||function(){(window.clarity.q=window.clarity.q||[]).push(arguments)};` +
    `window.clarity("consent",false);` +
    `(function(){try{` +
    `var q=/[?&]domlivo_internal=([01])/.exec(location.search),i=q?q[1]==="1":localStorage.getItem("${INTERNAL_STORAGE_KEY}")==="1";` +
    `if(i){dataLayer.push({traffic_type:"internal"});window.clarity("set","internal","1");}` +
    `}catch(e){}})();` +
    `(function(){try{` +
    `var m=document.cookie.match(/(?:^|; )${CONSENT_COOKIE}=([^;]*)/);if(!m)return;` +
    `var s=JSON.parse(decodeURIComponent(m[1]));` +
    `if(!s||s.v!==${CONSENT_VERSION}||!s.choices)return;` +
    `var c=s.choices,g=function(b){return b?"granted":"denied"};` +
    `gtag("consent","update",{${updateEntries},security_storage:"granted"});` +
    `if(c.analytics)window.clarity("consent",true);` +
    `}catch(e){}})();`
  );
}
