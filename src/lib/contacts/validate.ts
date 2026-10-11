/**
 * Contact-field checks shared by the forms and the API. Deliberately loose:
 * they stop "abc" or "abcde" as a phone and "foo@bar" as an e-mail (QA
 * 2026-10-11), not real numbers in any country format.
 */
export function isPlausiblePhone(value: string): boolean {
  const v = value.trim()
  if (!/^[+\d\s().\-/]+$/.test(v)) return false
  const digits = v.replace(/\D/g, '')
  return digits.length >= 7 && digits.length <= 15
}

export function isPlausibleEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value.trim())
}
