/**
 * `ImageObject` licence metadata for the photographs on /image-credits.
 *
 * Only for images whose licence is on record — the `imageCredit` documents and
 * the frontend photo registry, both of which carry an author, a licence URL
 * and the source page. Listing photographs get none of this: they belong to
 * agents and owners, no licence is recorded for them, and inventing one would
 * be a false statement in structured data.
 */
export type ImageCreditForJsonLd = {
  title?: string | null;
  author?: string | null;
  licenceUrl?: string | null;
  sourceUrl?: string | null;
  imageUrl?: string | null;
};

function isHttpUrl(value: string | null | undefined): value is string {
  return typeof value === "string" && /^https?:\/\/\S+$/i.test(value.trim());
}

/** Absolute URL of the file itself: a CDN address loses its resize query, a /public path gains the origin. */
function contentUrl(imageUrl: string, baseUrl: string): string | null {
  const url = imageUrl.trim();
  if (/^https?:\/\//i.test(url)) return url.split("?")[0];
  const base = baseUrl.replace(/\/$/, "");
  if (!base || !url.startsWith("/")) return null;
  return `${base}${url}`;
}

export function buildImageCreditsJsonLd(credits: ImageCreditForJsonLd[], baseUrl: string): object | null {
  const seen = new Set<string>();
  const graph: object[] = [];
  for (const credit of credits) {
    const author = credit.author?.trim();
    // Without an author and a licence there is nothing true to declare.
    if (!author || !isHttpUrl(credit.licenceUrl) || !credit.imageUrl) continue;
    const url = contentUrl(credit.imageUrl, baseUrl);
    if (!url || seen.has(url)) continue;
    seen.add(url);
    graph.push({
      "@type": "ImageObject",
      contentUrl: url,
      ...(credit.title?.trim() ? { name: credit.title.trim() } : {}),
      license: credit.licenceUrl.trim(),
      // The source page is where the licence terms and the original live.
      ...(isHttpUrl(credit.sourceUrl) ? { acquireLicensePage: credit.sourceUrl.trim() } : {}),
      creditText: author,
      creator: { "@type": "Person", name: author },
    });
  }
  if (graph.length === 0) return null;
  return { "@context": "https://schema.org", "@graph": graph };
}

/** Alt for a credited photograph: what it shows, and whose it is. */
export function imageCreditAlt(credit: { title?: string | null; author?: string | null }): string {
  const title = credit.title?.trim() ?? "";
  const author = credit.author?.trim() ?? "";
  if (title && author) return `${title} — ${author}`;
  return title || author;
}
