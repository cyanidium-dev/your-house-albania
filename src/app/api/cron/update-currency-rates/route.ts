import { NextRequest } from 'next/server';
import { fetchFixerRates, fetchFixerSymbols, type CurrencyRateEntry } from '@/lib/currency/fixer';
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

/** Build Sanity currencyRates payload with required _key and _type. */
function toSanityCurrencyRates(entries: CurrencyRateEntry[]) {
  return entries
    .filter((e) => typeof e.code === 'string' && e.code.trim() !== '')
    .map((e) => {
      const item: Record<string, unknown> = {
        _key: e.code.toLowerCase(),
        _type: 'currencyRate',
        code: e.code,
        rate: e.rate,
      };
      if (e.name) item.name = e.name;
      if (e.symbol) item.symbol = e.symbol;
      return item;
    });
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
    const [rates, namesByCode] = await Promise.all([
      fetchFixerRates(fixerKey),
      fetchFixerSymbols(fixerKey).catch(() => ({})),
    ]);
    entries = rates.map((e) => ({
      ...e,
      name: namesByCode[e.code] ?? e.name,
    }));
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
  const payload = toSanityCurrencyRates(enriched);
  const syncedAt = new Date().toISOString();

  const ok = await patchSiteSettingsCurrency(payload, syncedAt);
  if (!ok) {
    return Response.json(
      { error: 'Sanity patch failed', detail: 'Write client or patch error' },
      { status: 500 },
    );
  }

  return Response.json({
    ok: true,
    syncedCount: payload.length,
    syncedAt,
  });
}
