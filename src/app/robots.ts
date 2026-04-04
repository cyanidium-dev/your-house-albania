import type { MetadataRoute } from "next";
import { isIndexingEnabled } from "@/lib/seo/envSeo";
import { getSiteBaseUrl } from "@/lib/siteUrl";

export const revalidate = 3600;

export default function robots(): MetadataRoute.Robots {
  if (!isIndexingEnabled()) {
    return {
      rules: { userAgent: "*", disallow: "/" },
    };
  }
  const base = getSiteBaseUrl();
  return {
    rules: { userAgent: "*", allow: "/" },
    sitemap: [
      `${base}/sitemap.xml`,
      `${base}/sitemap-static.xml`,
      `${base}/sitemap-cities.xml`,
      `${base}/sitemap-types.xml`,
      `${base}/sitemap-properties.xml`,
      `${base}/sitemap-blog.xml`,
    ],
  };
}
