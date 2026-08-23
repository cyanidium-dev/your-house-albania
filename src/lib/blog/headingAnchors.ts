/**
 * The anchors in the table of contents and the `id` attributes stamped on the
 * article's own headings must come from one function, or the links point
 * nowhere. Both callers live in this repo — the TOC component and the Portable
 * Text serializer — so this is where they share.
 *
 * Deliberately not an ASCII slugifier. Four of the five locales are Cyrillic or
 * carry Albanian diacritics, and a `[^a-z0-9]` strip turns "Цены на квартиры"
 * into an empty string: every Russian heading in the article would collapse
 * onto the same anchor and the contents list would scroll to one place.
 */
export function anchorSlug(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/^-+|-+$/g, "");
}

export type Heading = { id: string; text: string; level: 2 | 3; blockKey: string };

function blockText(block: unknown): string {
  const children = (block as { children?: unknown } | null)?.children;
  if (!Array.isArray(children)) return "";
  return children
    .map((c) =>
      typeof (c as { text?: unknown } | null)?.text === "string"
        ? (c as { text: string }).text
        : ""
    )
    .join("")
    .trim();
}

/**
 * Walks the resolved Portable Text for one locale and returns its h2/h3
 * headings in document order, each with the id the renderer must stamp.
 *
 * Two headings with the same text get `-2`, `-3` suffixes. The counter has to
 * advance in the same order the renderer walks the blocks, or the suffixes
 * drift apart and the later links break — which is why both sides call this.
 */
export function collectHeadings(blocks: unknown[]): Heading[] {
  const out: Heading[] = [];
  const seen = new Map<string, number>();
  for (const block of blocks ?? []) {
    const style = (block as { style?: unknown } | null)?.style;
    if (style !== "h2" && style !== "h3") continue;
    const text = blockText(block);
    const base = anchorSlug(text);
    if (!base) continue;
    // Without a _key the renderer has nothing to look the id up by, so the
    // anchor would point at a heading that never carries it.
    const blockKey = (block as { _key?: unknown } | null)?._key;
    if (typeof blockKey !== "string" || !blockKey) continue;
    const n = (seen.get(base) ?? 0) + 1;
    seen.set(base, n);
    out.push({
      id: n === 1 ? base : `${base}-${n}`,
      text,
      level: style === "h2" ? 2 : 3,
      blockKey,
    });
  }
  return out;
}
