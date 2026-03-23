export type CurrencyRateEntry = {
  code: string;
  rate: number;
  name?: string;
  symbol?: string;
};

type FixerRatesResponse = {
  success?: boolean;
  base?: string;
  rates?: Record<string, number>;
};

/**
 * Fetches latest exchange rates from Fixer (EUR base).
 * Returns array in Sanity schema shape.
 */
export async function fetchFixerRates(apiKey: string): Promise<CurrencyRateEntry[]> {
  const url = `https://data.fixer.io/api/latest?access_key=${encodeURIComponent(apiKey)}`;
  const res = await fetch(url, { next: { revalidate: 0 } });

  if (!res.ok) {
    throw new Error(`Fixer HTTP ${res.status}`);
  }

  const json = (await res.json()) as FixerRatesResponse;
  if (!json?.success || typeof json.rates !== 'object') {
    const info = json && typeof json === 'object' && 'error' in json ? (json as { error?: { info?: string } }).error?.info : undefined;
    throw new Error(info ?? 'Fixer response invalid');
  }

  const rates = { ...json.rates } as Record<string, number>;
  if (typeof rates.EUR !== 'number' || !Number.isFinite(rates.EUR)) {
    rates.EUR = 1;
  }

  return Object.entries(rates)
    .filter(([, v]) => typeof v === 'number' && Number.isFinite(v))
    .map(([code, rate]) => ({ code, rate }));
}
