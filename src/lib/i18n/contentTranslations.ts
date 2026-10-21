import fr from "@/data/contentTranslations/fr.json";

/**
 * Translations of Sanity text that live in the repository instead of Sanity.
 *
 * Every localized field in Sanity stores one value per language as an object
 * (`{ en, ru, ... }`), so a new language adds a new attribute path to every
 * such field, and the dataset is at its plan's cap (2026/2000 paths on
 * 2026-10-20, docs/HANDOVER.md). A language added after that point keeps its
 * translations here instead: one entry per English source text.
 *
 * The lookup is by the English text itself, not by document id, so it works
 * wherever a field is resolved, including projections that carry no `_id`
 * (amenity names, district names inside a card). When the English source is
 * edited in Sanity the entry no longer matches and the page falls back to
 * English, which is the honest result for a translation that is now stale;
 * `scripts/contentTranslationsCoverage.ts` lists such entries.
 *
 * Only the pages a locale's pilot indexes need entries (see
 * `PARTIAL_LOCALE_PATHS` in `lib/seo/localeIndexing.ts`); everything else
 * under that locale is `noindex` and may show English.
 */
export type ContentTranslationEntry = {
  /** Sanity document the text came from, for review and the coverage report. */
  doc: string;
  /** Field path inside that document, for the same reason. */
  field: string;
  en: string;
  text: string;
  /** Who checked the translation and when; empty while it is a machine draft. */
  reviewed?: string;
};

type TranslationFile = { locale: string; entries: ContentTranslationEntry[] };

/** Locales whose content translations live in the repository. */
const FILES: readonly TranslationFile[] = [fr as TranslationFile];

/** The lookup key: whitespace runs collapsed, so a re-saved line break does not orphan an entry. */
export function contentTranslationKey(en: string): string {
  return en.replace(/\s+/g, " ").trim();
}

const TABLES = new Map<string, Map<string, string>>(
  FILES.map((file) => [
    file.locale,
    new Map(file.entries.filter((e) => e.text.trim()).map((e) => [contentTranslationKey(e.en), e.text])),
  ]),
);

/** Whether this locale's Sanity text is translated in the repository. */
export function hasRepoContentTranslations(locale: string): boolean {
  return TABLES.has(locale);
}

/** The repository translation of an English Sanity text, or `null` when there is none. */
export function translateContent(locale: string, en: string | null | undefined): string | null {
  if (typeof en !== "string" || !en.trim()) return null;
  return TABLES.get(locale)?.get(contentTranslationKey(en)) ?? null;
}
