import { describe, expect, it } from 'vitest';
import { isPublicDealRouteSegment } from '@/lib/catalog/publicDealTypes';

/**
 * `sitemap-static.xml` decides what to emit from the landing path alone. The
 * route's own filters are inlined there (it pulls from Sanity, so it has no
 * test harness of its own); this pins the two rules a live crawl caught it
 * breaking, against the same predicate the route uses.
 */
function shouldEmit(path: string): boolean {
  if (path.startsWith('cities/')) return false;
  if (path.startsWith('guides/')) return false;
  const segment = path.startsWith('investment/') ? path.slice('investment/'.length) : null;
  if (segment !== null && !isPublicDealRouteSegment(segment)) return false;
  return true;
}

describe('sitemap-static landing filters', () => {
  it('leaves guides to sitemap-landings, which scopes them by locale', () => {
    // Emitted from both sitemaps, this listed all 123 guide URLs twice and put
    // the nine Polish-only guides under all six locales — 45 of them 404.
    expect(shouldEmit('guides/mieszkania-w-albanii')).toBe(false);
    expect(shouldEmit('guides/albania-market')).toBe(false);
  });

  it('drops investment paths whose page is noindex', () => {
    expect(shouldEmit('investment/rent')).toBe(false);
    expect(shouldEmit('investment/short-term-rent')).toBe(false);
  });

  it('keeps the investment path that is indexable', () => {
    expect(shouldEmit('investment/sale')).toBe(true);
  });

  it('still leaves city listing shorthands to sitemap-cities', () => {
    expect(shouldEmit('cities/durres')).toBe(false);
  });

  it('keeps ordinary landing paths', () => {
    expect(shouldEmit('albania/durres/info')).toBe(true);
    expect(shouldEmit('for-realtors')).toBe(true);
  });
});
