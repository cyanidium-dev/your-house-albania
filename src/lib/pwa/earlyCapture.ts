/**
 * Inline script for the top of `<body>`: holds Chromium's install event until
 * React is ready to use it.
 *
 * `beforeinstallprompt` fires once per page load, as soon as the page meets
 * the install criteria, which can be before the client bundle has run. A
 * listener added in an effect would miss it, and Chrome would show its own
 * mini-infobar on arrival, which is exactly the ambush the engagement-gated
 * invitation exists to avoid. `lib/pwa/installStore` picks the event up from
 * here. Kept tiny and dependency-free: it is in the HTML of every page.
 */
export const PWA_INSTALL_CAPTURE_GLOBAL = "__domlivoInstallEvent";

export const PWA_EARLY_CAPTURE_SCRIPT = `window.addEventListener("beforeinstallprompt",function(e){e.preventDefault();window.${PWA_INSTALL_CAPTURE_GLOBAL}=e;window.dispatchEvent(new Event("domlivo:installable"))});`;
