import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { indexNowKey, indexNowKeyLocation, localizedUrls, submitUrlsToIndexNow } from '../indexNow';

const ORIGINAL = { ...process.env };

beforeEach(() => {
  process.env.NEXT_PUBLIC_ENABLE_INDEXING = 'true';
});

afterEach(() => {
  process.env = { ...ORIGINAL };
  vi.unstubAllGlobals();
});

describe('indexNowKey', () => {
  it('accepts a hexadecimal key of a legal length', () => {
    process.env.INDEXNOW_KEY = 'a'.repeat(32);
    expect(indexNowKey()).toBe('a'.repeat(32));
  });

  it('refuses anything that is not a key, rather than sending it', () => {
    // A rejected key means the API refuses every submission; failing closed
    // here makes that a local, visible condition instead of a remote one.
    for (const bad of ['', '   ', 'short', 'not-hex-zzzz1234', 'f'.repeat(200)]) {
      process.env.INDEXNOW_KEY = bad;
      expect(indexNowKey()).toBeNull();
    }
  });

  it('is absent when the variable is unset', () => {
    delete process.env.INDEXNOW_KEY;
    expect(indexNowKey()).toBeNull();
  });
});

describe('indexNowKeyLocation', () => {
  it('points at a .txt URL on the site host', () => {
    const url = indexNowKeyLocation('abc123def456');
    expect(url).toMatch(/^https?:\/\//);
    expect(url.endsWith('/indexnow-abc123def456.txt')).toBe(true);
  });
});

describe('localizedUrls', () => {
  it('returns the page in every locale', () => {
    const urls = localizedUrls('albania/durres/info');
    expect(urls).toHaveLength(6);
    expect(urls.some((u) => u.endsWith('/ru/albania/durres/info'))).toBe(true);
    expect(urls.some((u) => u.endsWith('/sq/albania/durres/info'))).toBe(true);
  });

  it('handles the locale root without a trailing slash', () => {
    expect(localizedUrls('').every((u) => !u.endsWith('/'))).toBe(true);
  });

  it('tolerates a leading slash on the path', () => {
    expect(localizedUrls('/blog')).toEqual(localizedUrls('blog'));
  });
});

describe('submitUrlsToIndexNow', () => {
  it('stays silent without a key, so deploying does not announce anything', async () => {
    delete process.env.INDEXNOW_KEY;
    const fetchSpy = vi.fn();
    vi.stubGlobal('fetch', fetchSpy);
    await expect(submitUrlsToIndexNow(['https://www.domlivo.com/en'])).resolves.toEqual({
      submitted: false,
      reason: 'no-key',
    });
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('stays silent when indexing is off, so a preview never speaks for production', async () => {
    process.env.NEXT_PUBLIC_ENABLE_INDEXING = 'false';
    process.env.INDEXNOW_KEY = 'a'.repeat(32);
    const fetchSpy = vi.fn();
    vi.stubGlobal('fetch', fetchSpy);
    await expect(submitUrlsToIndexNow(['https://www.domlivo.com/en'])).resolves.toEqual({
      submitted: false,
      reason: 'indexing-disabled',
    });
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('drops URLs that are not on this site and de-duplicates the rest', async () => {
    process.env.INDEXNOW_KEY = 'a'.repeat(32);
    const fetchSpy = vi.fn().mockResolvedValue({ status: 200 });
    vi.stubGlobal('fetch', fetchSpy);

    const own = localizedUrls('blog')[0];
    const result = await submitUrlsToIndexNow([own, own, 'https://example.com/elsewhere']);

    expect(result).toEqual({ submitted: true, count: 1, status: 200 });
    const body = JSON.parse(fetchSpy.mock.calls[0][1].body as string);
    expect(body.urlList).toEqual([own]);
    expect(body.key).toBe('a'.repeat(32));
    expect(body.keyLocation.endsWith(`/indexnow-${'a'.repeat(32)}.txt`)).toBe(true);
  });

  it('reports rather than throws when the endpoint fails', async () => {
    // A search-engine ping is not a reason for a content webhook to 500.
    process.env.INDEXNOW_KEY = 'a'.repeat(32);
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('network down')));
    const result = await submitUrlsToIndexNow(localizedUrls('blog'));
    expect(result.submitted).toBe(false);
    expect(result).toMatchObject({ reason: 'error' });
  });

  it('does not call out when there is nothing to submit', async () => {
    process.env.INDEXNOW_KEY = 'a'.repeat(32);
    const fetchSpy = vi.fn();
    vi.stubGlobal('fetch', fetchSpy);
    await expect(submitUrlsToIndexNow([])).resolves.toEqual({
      submitted: false,
      reason: 'no-urls',
    });
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});
