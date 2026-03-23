import { NextRequest } from 'next/server';
import { fetchFixerRates, type CurrencyRateEntry } from '@/lib/currency/fixer';
import { CURRENCY_SYMBOL_MAP } from '@/lib/currency/currencySymbolMap';
import { patchSiteSettingsCurrency } from '@/lib/sanity/writeClient';

function enrichWithSymbols(entries: CurrencyRateEntry[]): CurrencyRateEntry[] {
  return entries.map((e) => {
    const symbol = CURRENCY_SYMBOL_MAP[e.code];
    if (symbol) return { ...e, symbol };
    return e;
  });
}

function validateRates(entries: CurrencyRateEntry[]): boolean {
  if (!Array.isArray(entries) || entries.length === 0) return false;
  const hasEur = entries.some((e) => e.code === 'EUR' && e.rate === 1);
  if (!hasEur) return false;
  const allValid = entries.every(
    (e) => typeof e.code === 'string' && typeof e.rate === 'number' && Number.isFinite(e.rate),
  );
  return allValid;
}

// Auth uses query param ?secret= because Vercel cron does NOT support custom headers.
// Set CRON_SECRET in Vercel env; vercel.json path must use the same value in ?secret=
export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const secret = url.searchParams.get('secret');
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret || secret !== cronSecret) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const fixerKey = process.env.FIXER_API_KEY;
  if (!fixerKey) {
    return Response.json({ error: 'Fixer API key not configured' }, { status: 500 });
  }

  let entries: CurrencyRateEntry[];
  try {
    entries = await fetchFixerRates(fixerKey);
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Fixer fetch failed';
    return Response.json({ error: 'Fixer error', detail: msg }, { status: 500 });
  }

  if (!validateRates(entries)) {
    return Response.json(
      { error: 'Invalid Fixer payload', detail: 'Rates validation failed' },
      { status: 500 },
    );
  }

  const enriched = enrichWithSymbols(entries);
  const syncedAt = new Date().toISOString();

  const ok = await patchSiteSettingsCurrency(enriched, syncedAt);
  if (!ok) {
    return Response.json(
      { error: 'Sanity patch failed', detail: 'Write client or patch error' },
      { status: 500 },
    );
  }

  return Response.json({
    ok: true,
    syncedCount: enriched.length,
    syncedAt,
  });
}
