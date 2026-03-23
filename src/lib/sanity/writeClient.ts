import { createClient } from '@sanity/client';

/** Sanity array item shape for currencyRates — includes _key and _type required by Studio. */
export type SanityCurrencyRateItem = {
  _key: string;
  _type: 'currencyRate';
  code: string;
  rate: number;
  name?: string;
  symbol?: string;
};

const projectId =
  process.env.SANITY_PROJECT_ID ?? process.env.NEXT_PUBLIC_SANITY_PROJECT_ID ?? '';
const dataset = process.env.SANITY_DATASET ?? process.env.NEXT_PUBLIC_SANITY_DATASET ?? 'production';
const apiVersion = process.env.SANITY_API_VERSION ?? '2024-01-01';
const token = process.env.SANITY_API_TOKEN ?? process.env.SANITY_WRITE_TOKEN;

/**
 * Create a Sanity client with write access for cron/backend use.
 */
export function getWriteClient() {
  if (!projectId || !token) return null;
  return createClient({
    projectId,
    dataset,
    apiVersion,
    token,
    useCdn: false,
  });
}

/**
 * Patches siteSettings singleton with currencyRates and currencyLastSyncedAt only.
 * Does NOT modify displayCurrencies.
 */
export async function patchSiteSettingsCurrency(
  currencyRates: SanityCurrencyRateItem[],
  currencyLastSyncedAt: string,
): Promise<boolean> {
  const client = getWriteClient();
  if (!client) return false;
  try {
    await client
      .patch('siteSettings')
      .set({ currencyRates, currencyLastSyncedAt })
      .commit();
    return true;
  } catch {
    return false;
  }
}
