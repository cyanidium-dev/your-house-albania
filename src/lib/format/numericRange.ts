/**
 * Reads a price cell back into numbers: "1,900–2,800" → [1900, 2800],
 * "1 110" → [1110, 1110], "56.500" → [56500, 56500].
 *
 * The zone tables arrive as display strings (formatted per locale by
 * `formatMetric`), and the range bar beside them needs the numbers. Only
 * whole numbers with a thousands separator of exactly three digits count, so
 * a decimal ("5.5"), a percentage or a sum in millions ("€1.5–3m") is not
 * misread as a price: it returns null and the table simply draws no bar.
 */
const NUM = String.raw`\d{1,3}(?:[ ,.\u00a0\u202f]\d{3})+|\d+`;
const RANGE = new RegExp(
  String.raw`^\s*(?:€|\$|£|lek)?\s*(${NUM})\s*(?:[–—-]\s*(?:€|\$|£)?\s*(${NUM}))?\s*(?:€|lek)?\s*(?:\/\s*m(?:²|2))?\s*$`,
  "i",
);

const toInt = (raw: string) => Number.parseInt(raw.replace(/\D/g, ""), 10);

export function parseNumericRange(text: string | null | undefined): [number, number] | null {
  if (typeof text !== "string") return null;
  const m = RANGE.exec(text);
  if (!m) return null;
  const a = toInt(m[1]);
  const b = m[2] ? toInt(m[2]) : a;
  if (!Number.isFinite(a) || !Number.isFinite(b)) return null;
  return a <= b ? [a, b] : [b, a];
}

export type RangeScale = { lo: number; hi: number };

/**
 * The shared axis for a column of ranges, or null when fewer than two rows
 * have a number or every row says the same thing (a bar would carry nothing).
 */
export function rangeScale(ranges: Array<[number, number] | null>): RangeScale | null {
  const present = ranges.filter((r): r is [number, number] => r !== null);
  if (present.length < 2) return null;
  const lo = Math.min(...present.map((r) => r[0]));
  const hi = Math.max(...present.map((r) => r[1]));
  if (!(hi > lo)) return null;
  return { lo, hi };
}

/** Left offset and width of a range on the scale, in percent. */
export function rangePosition(range: [number, number], scale: RangeScale): { left: number; width: number } {
  const span = scale.hi - scale.lo;
  const left = ((range[0] - scale.lo) / span) * 100;
  const width = ((range[1] - range[0]) / span) * 100;
  return { left: Math.max(0, Math.min(100, left)), width: Math.max(0, Math.min(100 - left, width)) };
}
