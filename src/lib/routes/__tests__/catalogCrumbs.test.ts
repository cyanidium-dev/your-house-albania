import { describe, expect, it } from 'vitest';
import { buildCatalogCrumbs } from '../breadcrumbs';

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
