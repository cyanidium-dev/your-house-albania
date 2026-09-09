import { describe, expect, it } from 'vitest';
import { buildMetadata } from '@/lib/sanity/socialMetadataResolution';
import { listingOpenGraph } from '@/lib/seo/listingTitle';

/**
 * Open Graph requires four properties: og:title, og:type, og:image, og:url.
 * The 2026-09-10 crawl found 735 pages missing at least one — every one of
 * them missing og:url, because no caller passed it and nothing defaulted it.
 */
describe('buildMetadata — Open Graph completeness', () => {
  it('defaults og:url to the canonical', () => {
    const meta = buildMetadata({
      title: 'T',
      ogTitle: 'T',
      ogDescription: 'D',
      ogImageUrl: 'https://example.com/a.png',
      canonical: 'https://www.domlivo.com/en/thing',
    });
    expect(meta.openGraph?.url).toBe('https://www.domlivo.com/en/thing');
  });

  it('lets an explicit ogUrl win over the canonical', () => {
    const meta = buildMetadata({
      title: 'T',
      ogTitle: 'T',
      ogDescription: 'D',
      canonical: 'https://www.domlivo.com/en/canonical',
      ogUrl: 'https://www.domlivo.com/en/explicit',
    });
    expect(meta.openGraph?.url).toBe('https://www.domlivo.com/en/explicit');
  });

  it('leaves og:url off when there is no canonical', () => {
    // Indexing disabled: no canonical is emitted, and a page that should not be
    // indexed does not need to advertise its address either.
    const meta = buildMetadata({ title: 'T', ogTitle: 'T', ogDescription: 'D' });
    expect(meta.openGraph?.url).toBeUndefined();
  });

  it('always sets og:type', () => {
    const meta = buildMetadata({ title: 'T', ogTitle: 'T', ogDescription: 'D' });
    expect((meta.openGraph as { type?: string })?.type).toBe('website');
  });
});

describe('listingOpenGraph', () => {
  it('restates og:type, which the root layout no longer supplies', () => {
    // Setting `openGraph` on a page replaces the parent object instead of
    // merging into it, so 114 listing pages shipped with no og:type.
    const og = listingOpenGraph('T', 'D', 'https://example.com/a.png');
    expect((og as { type?: string }).type).toBe('website');
  });

  it('carries og:url when given the canonical', () => {
    const og = listingOpenGraph('T', 'D', undefined, 'https://www.domlivo.com/en/albania/durres');
    expect((og as { url?: string }).url).toBe('https://www.domlivo.com/en/albania/durres');
  });

  it('omits og:url rather than inventing one', () => {
    const og = listingOpenGraph('T', 'D');
    expect((og as { url?: string }).url).toBeUndefined();
  });
});
