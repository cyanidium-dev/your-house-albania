/**
 * `?page=` values that do not name a later page.
 *
 * `/en/sale?page=1`, `?page=0` and `?page=abc` all rendered page one with
 * status 200 — three more addresses for the listing, each a crawlable
 * duplicate with a canonical pointing away (audit 2026-10-18, T L-4). Page one
 * has one address: the URL without the parameter. Only a whole number from 2
 * up survives; anything else is dropped with a permanent redirect.
 *
 * Edge-safe: no imports, the middleware bundles this file.
 */
const LATER_PAGE = /^[1-9]\d*$/;

/**
 * The search string with a meaningless `page` removed, or null when there is
 * nothing to remove (no `page`, or one that names page 2 or later).
 */
export function searchWithoutFirstPageParam(searchParams: URLSearchParams): string | null {
  const values = searchParams.getAll("page");
  if (values.length === 0) return null;
  const keep = values.length === 1 && LATER_PAGE.test(values[0]) && values[0] !== "1";
  if (keep) return null;
  const next = new URLSearchParams(searchParams);
  if (values.length === 1) {
    next.delete("page");
  } else {
    // Several `page` values: keep the first one that names a later page.
    const later = values.find((v) => LATER_PAGE.test(v) && v !== "1");
    next.delete("page");
    if (later) next.set("page", later);
  }
  const search = next.toString();
  return search ? `?${search}` : "";
}
