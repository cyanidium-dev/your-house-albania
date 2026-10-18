import { describe, expect, it } from 'vitest';
import { buildBlogCrumbs, buildCatalogCrumbs } from '../breadcrumbs';

const labels = { home: 'Home', properties: 'Properties', agents: 'Agents' };

/**
 * Only the agent level is asserted here. The other crumbs build their hrefs
 * through `catalogPath` / `agentFilterPath`, which read catalog configuration
 * that this environment does not provide, so their URLs are not meaningful
 * under test — the agent crumb's *absence* of an href is.
 */
describe('buildCatalogCrumbs — the Agents crumb', () => {
  it('carries no href, because there is no agents index to link to', () => {
    // `/{locale}/agent` calls notFound(); linking it put a 404 in the trail of
    // every agent page — 91 internal links in the crawl of 2026-09-10.
    const crumbs = buildCatalogCrumbs({
      locale: 'en',
      labels,
      agent: { slug: 'fedir', name: 'Fedir' },
    });
    const agents = crumbs.find((c) => c.label === 'Agents');
    expect(agents).toBeDefined();
    expect(agents?.href).toBeUndefined();
  });

  it('still names the level, so the trail keeps its shape', () => {
    const crumbs = buildCatalogCrumbs({
      locale: 'en',
      labels,
      agent: { slug: 'fedir', name: 'Fedir' },
    });
    expect(crumbs.map((c) => c.label)).toEqual(['Home', 'Agents', 'Fedir']);
  });

  it('never emits a crumb pointing at the bare agent segment', () => {
    const crumbs = buildCatalogCrumbs({
      locale: 'ru',
      labels,
      agent: { slug: 'fedir' },
      country: { slug: 'albania', label: 'Albania' },
      city: { slug: 'durres', label: 'Durrës' },
    });
    expect(crumbs.every((c) => c.href !== '/ru/agent')).toBe(true);
  });

  it('uses the Properties crumb instead when there is no agent', () => {
    const crumbs = buildCatalogCrumbs({ locale: 'en', labels });
    expect(crumbs.map((c) => c.label)).toEqual(['Home', 'Properties']);
  });
});

/**
 * Audit 2026-10-18, S-02: the trail went through `/catalog` (noindex) and gave
 * `/sale` a second name ("Albania"). With one country and one deal, the root
 * crumb is `/sale` itself and the levels that would repeat it go.
 */
describe('buildCatalogCrumbs — the sale root', () => {
  const sale = { home: 'Home', properties: 'Property for sale', agents: 'Agents' };

  it('links the root crumb to /sale, never to /catalog', () => {
    const crumbs = buildCatalogCrumbs({
      locale: 'en',
      labels: sale,
      city: { slug: 'durres', label: 'Durrës' },
      leaf: 'Flat',
    });
    expect(crumbs[1]).toEqual({ label: 'Property for sale', href: '/en/sale' });
    expect(crumbs.some((c) => c.href?.includes('/catalog'))).toBe(false);
  });

  it('drops a country crumb that links where the root does', () => {
    const crumbs = buildCatalogCrumbs({
      locale: 'en',
      labels: sale,
      country: { slug: 'albania', label: 'Albania', href: '/en/sale' },
      city: { slug: 'durres', label: 'Durrës' },
      leaf: 'Flat',
    });
    expect(crumbs.map((c) => c.label)).toEqual(['Home', 'Property for sale', 'Durrës', 'Flat']);
  });

  it('is Home → Property for sale on the sale hub itself', () => {
    const crumbs = buildCatalogCrumbs({
      locale: 'de',
      labels: sale,
      deal: { slug: 'sale', label: 'Sale' },
    });
    expect(crumbs.map((c) => c.label)).toEqual(['Home', 'Property for sale']);
    expect(crumbs[1].href).toBeUndefined();
  });
});

describe('buildBlogCrumbs', () => {
  const labels = { home: 'Home', blog: 'Blog' };

  // `/blog?category=` is noindex (S-09): a post's trail skips it.
  it('gives a post no category level', () => {
    const crumbs = buildBlogCrumbs({
      locale: 'en',
      labels,
      categorySlug: 'market-trends',
      categoryLabel: 'Market trends',
      postTitle: 'Durrës index',
    });
    expect(crumbs.map((c) => c.label)).toEqual(['Home', 'Blog', 'Durrës index']);
    expect(crumbs.some((c) => c.href?.includes('category='))).toBe(false);
  });

  it('keeps the category as the current page of a filtered index', () => {
    const crumbs = buildBlogCrumbs({ locale: 'en', labels, categorySlug: 'x', categoryLabel: 'X' });
    expect(crumbs.map((c) => c.label)).toEqual(['Home', 'Blog', 'X']);
  });
});
