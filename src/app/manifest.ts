import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Domlivo — Real estate in Albania",
    short_name: "Domlivo",
    description:
      "Apartments, villas, and commercial property in Albania. Verified listings, current prices, no commission.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#078660",
    orientation: "portrait",
    lang: "en",
    categories: ["real-estate", "lifestyle", "business"],
    icons: [
      { src: "/icon", sizes: "256x256", type: "image/png", purpose: "any" },
      { src: "/apple-icon", sizes: "180x180", type: "image/png", purpose: "any" },
      { src: "/icon", sizes: "256x256", type: "image/png", purpose: "maskable" },
    ],
  };
}
