/**
 * Entry animations as a React-hoisted <style href precedence> tag rather than
 * a CSS module: the consent components are reachable from the root layout, so
 * module CSS would become a render-blocking stylesheet on every page. A
 * hoisted style is deduped by React, SSR-inlined into <head> only when a
 * consent surface renders, and costs no network request. Layout/colors remain
 * Tailwind classes in classes.ts.
 */

export const consentBannerInClass = "dl-consent-banner-in";
export const consentDialogInClass = "dl-consent-dialog-in";

const CONSENT_ENTRY_CSS = `
.dl-consent-banner-in{animation:dl-consent-slide-up .35s cubic-bezier(.22,1,.36,1) both}
.dl-consent-dialog-in{animation:dl-consent-fade-scale .25s ease-out both}
@keyframes dl-consent-slide-up{from{transform:translateY(24px);opacity:0}to{transform:translateY(0);opacity:1}}
@keyframes dl-consent-fade-scale{from{transform:scale(.97);opacity:0}to{transform:scale(1);opacity:1}}
@media (prefers-reduced-motion:reduce){.dl-consent-banner-in,.dl-consent-dialog-in{animation:none}}
`;

export function ConsentEntryCss() {
  return (
    <style href="dl-consent" precedence="dl">
      {CONSENT_ENTRY_CSS}
    </style>
  );
}
