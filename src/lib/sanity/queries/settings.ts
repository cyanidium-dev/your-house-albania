import { getClient, sanityCache, SANITY_TAGS } from './_core';

const cachedFetchSiteSettings = sanityCache(
  async () => {
    const client = getClient();
    if (!client) return null;
    const query = `*[_type == "siteSettings" && _id == "siteSettings"][0] {
      _id,
      _type,
      logo { asset-> { _id, url } },
      siteName,
      siteTagline,
      contactPhone,
      contactEmail,
      contactsManagerPhoto { alt, asset-> { url } },
      companyAddress,
      footerIntro,
      footerTelegramUrl,
      footerWhatsappUrl,
      // Schema stores appStoreUrl / googlePlayUrl; the frontend has always read
      // iosUrl / androidUrl, so alias them here rather than rename either side.
      footerApp {
        enabled,
        "iosUrl": appStoreUrl,
        "androidUrl": googlePlayUrl
      },
      socialLinks[] {
        _key,
        platform,
        url,
        channel
      },
      policyLinks[] {
        _key,
        href,
        label
      },
      defaultSeo {
        metaTitle,
        metaDescription,
        noIndex,
        noFollow,
        ogImage { asset-> { url } }
      },
      // Catalog defaults live under propertySettings.catalogDefaults in the
      // schema; they were previously read from the document root and so were
      // always undefined. Aliased back to the flat names the consumers expect.
      "similarPropertiesCount": propertySettings.catalogDefaults.similarPropertiesCount,
      "priceRange": propertySettings.catalogDefaults.priceRange { from, to },
      "areaRange": propertySettings.catalogDefaults.areaRange { from, to },
      "currencyRates": currencyRates[code in ^.displayCurrencies]{
        code,
        rate,
        symbol
      },
      displayCurrencies,
      currencyLastSyncedAt,
      howToPublishVideoUrl
    }`;
    try {
      const result = await client.fetch(query);
      if (process.env.NODE_ENV === 'development' && result) {
        const s = result as Record<string, unknown>;
        const sl = Array.isArray(s?.socialLinks) ? (s.socialLinks as unknown[]).length : 0;
        console.log('[Sanity] fetchSiteSettings OK:', {
          hasSocialLinks: sl > 0,
          hasContactEmail: !!s?.contactEmail,
          hasPhone: !!s?.contactPhone,
          hasFooterIntro: !!s?.footerIntro,
        });
      }
      return result;
    } catch (err) {
      console.warn('[Sanity] fetchSiteSettings failed:', err);
      return null;
    }
  },
  ['sanity-site-settings'],
  { revalidate: 60, tags: [SANITY_TAGS.siteSettings] }
);

/** Fetch siteSettings singleton. Returns null if not found or client not configured. */
export async function fetchSiteSettings(): Promise<unknown | null> {
  return cachedFetchSiteSettings();
}

