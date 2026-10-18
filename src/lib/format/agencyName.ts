/**
 * An agency name as people write it. Partner feeds ship some names in
 * capitals ("FIND ALL PROPERTIES"), and "Listed by FIND ALL PROPERTIES" on a
 * listing read like a placeholder (visual audit 2026-10-18 L3). A name with no
 * lowercase letters is title-cased; a name that already mixes cases is the
 * agency's own spelling and is left alone. Words with digits or symbols
 * ("RE/MAX", "A1") and a lone short acronym ("ERA") keep their capitals.
 */
export function displayAgencyName(name: string): string {
  const trimmed = name.trim()
  if (!/\p{Lu}/u.test(trimmed) || /\p{Ll}/u.test(trimmed)) return trimmed
  const words = trimmed.split(/(\s+)/)
  const wordCount = words.filter((w) => /\S/.test(w)).length
  if (wordCount === 1 && trimmed.length <= 4) return trimmed
  return words
    .map((w) =>
      /^\p{L}+$/u.test(w) ? w.charAt(0) + w.slice(1).toLocaleLowerCase() : w
    )
    .join('')
}
