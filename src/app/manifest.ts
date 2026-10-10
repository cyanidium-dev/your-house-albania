import type { MetadataRoute } from "next";

/**
 * Web app manifest, served at `/manifest.webmanifest`.
 *
 * English, because a manifest is one document with no request behind it: the
 * browser fetches it outside any page, so there is no locale to read. The
 * installed app still opens in the visitor's language: `start_url` is the bare
 * root, which the middleware sends to the detected locale with the query kept.
 * The shortcuts are English URLs because their labels are.
 *
 * `id` is the install identity and must never change: a different `id` makes
 * browsers treat the app as a new one, and an installed icon stops updating.
 * `start_url` may change freely.
 *
 * No `orientation`: listing photos and the map are worth turning the phone for.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "Domlivo — Real estate in Albania",
    short_name: "Domlivo",
    description:
      "Apartments, villas, and commercial property in Albania. Verified listings, current prices, no commission.",
    lang: "en",
    dir: "ltr",
    // `?source=pwa` tells a home-screen launch apart from browser traffic
    // (lib/analytics/trafficSource). `source` is a tracking parameter
    // (lib/routes/listingQueryRewrite), so it never makes a cached page dynamic.
    start_url: "/?source=pwa",
    scope: "/",
    display: "standalone",
    display_override: ["standalone", "minimal-ui"],
    // The icon's green, so the splash screen and the icon are one surface
    // rather than a green square on a white flash.
    background_color: "#078660",
    theme_color: "#078660",
    categories: ["business", "lifestyle", "shopping"],
    // A second launch from the home screen reuses the open window.
    launch_handler: { client_mode: "navigate-existing" },
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      // Android crops icons to its own shape. The maskable art is full-bleed
      // green with the letter well inside the 80% safe circle.
      { src: "/icons/icon-maskable-192.png", sizes: "192x192", type: "image/png", purpose: "maskable" },
      { src: "/icons/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    shortcuts: [
      {
        name: "Property in Durrës",
        short_name: "Durrës",
        description: "Apartments and houses for sale in Durrës",
        url: "/en/albania/durres?source=pwa-shortcut",
        icons: [{ src: "/icons/shortcut-96.png", sizes: "96x96", type: "image/png" }],
      },
      {
        name: "Favorites",
        short_name: "Favorites",
        description: "Listings you saved on this device",
        url: "/en/favorites?source=pwa-shortcut",
        icons: [{ src: "/icons/shortcut-96.png", sizes: "96x96", type: "image/png" }],
      },
      {
        name: "AI assistant",
        short_name: "Assistant",
        description: "Ask about prices, districts and buying in Albania",
        url: "/en/ai-search?source=pwa-shortcut",
        icons: [{ src: "/icons/shortcut-96.png", sizes: "96x96", type: "image/png" }],
      },
    ],
  };
}
