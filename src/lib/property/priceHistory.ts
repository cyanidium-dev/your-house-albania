/**
 * A listing's asking prices on record — the one fact about a partner listing
 * that no other site holds, because it accrues here from the day the listing
 * was first imported. Written by the partner imports in domlivo-admin
 * (`priceHistory` on the property document), read here.
 */
export type PriceHistoryEntry = {
  /** ISO date, `YYYY-MM-DD`. */
  date: string;
  price: number;
  /** `per-sqm` when `price` is a rate, else a total. */
  priceUnit?: string | null;
};

export type PriceHistoryStep = PriceHistoryEntry & {
  /** Percent change against the previous entry; absent on the first. */
  changePct?: number;
};

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

/**
 * The entries worth showing, oldest first: dated, priced above zero, and
 * each differing from the one before it. Two entries with the same price
 * on different days say nothing a buyer needs. Entries of mixed units are
 * kept but not compared.
 */
export function priceHistorySteps(raw: readonly (Partial<PriceHistoryEntry> | null | undefined)[] | null | undefined): PriceHistoryStep[] {
  if (!Array.isArray(raw)) return [];
  const entries = raw
    .filter((e): e is PriceHistoryEntry => Boolean(e && typeof e.date === "string" && ISO_DATE.test(e.date) && typeof e.price === "number" && e.price > 0))
    .sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
  const steps: PriceHistoryStep[] = [];
  for (const entry of entries) {
    const prev = steps[steps.length - 1];
    if (prev && prev.price === entry.price && (prev.priceUnit ?? "total") === (entry.priceUnit ?? "total")) continue;
    const comparable = prev && (prev.priceUnit ?? "total") === (entry.priceUnit ?? "total");
    steps.push({
      ...entry,
      ...(comparable ? { changePct: Math.round(((entry.price - prev.price) / prev.price) * 1000) / 10 } : {}),
    });
  }
  return steps;
}
