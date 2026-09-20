import { resolveLocalizedStringStrict } from "@/lib/sanity/localized";

export type ListingFaqItem = {
  key: string;
  question: string;
  /** Portable Text blocks when the editor wrote rich text, a string otherwise. */
  answer: unknown[] | string;
};

type RawItem = { _key?: string; question?: unknown; answer?: unknown };

/**
 * A place's CMS questions in exactly this locale. No English fallback: an
 * English answer under a Polish heading reads as a broken page, so an item
 * that is not written in the visitor's language is dropped.
 */
export function resolveListingFaqItems(items: readonly RawItem[], locale: string): ListingFaqItem[] {
  const out: ListingFaqItem[] = [];
  items.forEach((item, index) => {
    const question = resolveLocalizedStringStrict(item?.question as never, locale);
    const raw = item?.answer && typeof item.answer === "object" ? (item.answer as Record<string, unknown>)[locale] : undefined;
    const answer = Array.isArray(raw) ? (raw.length ? raw : "") : typeof raw === "string" ? raw.trim() : "";
    if (!question || !answer) return;
    out.push({ key: item._key || `faq-${index}`, question, answer });
  });
  return out;
}
