/**
 * The CMS phone field shipped with a placeholder ("+355 69 000 0000") and the
 * business has not given a real number yet. A placeholder is worse than no
 * number: it prints a line nobody answers and a `tel:` link that goes nowhere.
 * Everything that would print or dial a phone from settings asks here first.
 */

/** Values that stand for "no phone configured". Compared digits-only. */
const PLACEHOLDER_PHONES = ["+355 69 000 0000"];

function digits(value: string): string {
  return value.replace(/\D/g, "");
}

const PLACEHOLDER_DIGITS = new Set(PLACEHOLDER_PHONES.map(digits));

/** True only for a number a visitor could actually call. */
export function isRealPhone(value: unknown): value is string {
  if (typeof value !== "string") return false;
  const d = digits(value);
  // Shortest national numbers with a country code are well above six digits.
  if (d.length < 7) return false;
  if (PLACEHOLDER_DIGITS.has(d)) return false;
  // "000 0000", "0000000", "000-00-00": a run of seven zeros is filler.
  if (/0{7}/.test(d)) return false;
  // One repeated digit ("1111111") is filler too.
  if (/^(\d)\1+$/.test(d)) return false;
  return true;
}

/** The trimmed number, or an empty string when it is missing or a placeholder. */
export function realPhoneOrEmpty(value: unknown): string {
  return isRealPhone(value) ? value.trim() : "";
}
