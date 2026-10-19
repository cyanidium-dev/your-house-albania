/** Keeps the chosen currency in the URL, so a shared link opens in it. */
export function persistCurrencyInUrl(code: string) {
  if (typeof window === 'undefined') return
  const params = new URLSearchParams(window.location.search)
  params.set('currency', code)
  window.history.replaceState(null, '', `${window.location.pathname}?${params.toString()}`)
}
