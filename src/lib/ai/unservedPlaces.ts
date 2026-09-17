/**
 * Albanian towns people ask the assistant for and Domlivo has never listed.
 *
 * The system prompt already says to name a place we have nothing in before
 * offering another one, and the model still dropped it: a visitor asked for a
 * 2+1 in Korçë on 2026-09-05 and was shown Durrës flats with no mention of
 * Korçë at all (Clarity recording). Reading the place out of the message here
 * and telling the model, in its own turn, which town it just read is what makes
 * the rule fire — a note about this message beats a rule buried in a long
 * prompt.
 *
 * Only towns with no stock belong here. A city that has listings, however few,
 * is answered from the catalogue as usual.
 */

/** Latin, Albanian, Russian and Ukrainian spellings of one town. */
type UnservedPlace = {
  /** How the assistant should name it back to the visitor. */
  label: string;
  /** Lowercase, diacritics already folded; matched on word boundaries. */
  spellings: readonly string[];
};

export const UNSERVED_PLACES: readonly UnservedPlace[] = [
  { label: "Korçë", spellings: ["korce", "korca", "korche", "korcha", "korça", "korchi", "korchu", "korchoy"] },
  { label: "Berat", spellings: ["berat", "berati", "berate", "berata"] },
  { label: "Elbasan", spellings: ["elbasan", "elbasani", "elbasane", "elbasana"] },
  { label: "Fier", spellings: ["fier", "fieri", "fiere", "fiera"] },
  { label: "Lezhë", spellings: ["lezhe", "lezha", "lezhi", "lezhu"] },
  { label: "Gjirokastër", spellings: ["gjirokaster", "gjirokastra", "girokastra", "girokastre", "girokaster"] },
  { label: "Pogradec", spellings: ["pogradec", "pogradeci", "pogradets", "pogradece", "pogradeca"] },
  { label: "Kukës", spellings: ["kukes", "kukesi", "kukesa"] },
  { label: "Ksamil", spellings: ["ksamil", "ksamili", "ksamile", "ksamilya", "ksamila"] },
  { label: "Velipojë", spellings: ["velipoje", "velipoja", "velipoya", "velipoyu"] },
  { label: "Himarë", spellings: ["himare", "himara", "himary", "himaru", "khimara", "khimare"] },
  { label: "Shkodër", spellings: ["shkoder", "shkodra", "shkodre", "shkodru", "shkodery", "skadar"] },
];

const CYRILLIC_TO_LATIN: Record<string, string> = {
  а: "a", б: "b", в: "v", г: "g", ґ: "g", д: "d", е: "e", є: "e", ё: "e", ж: "zh",
  з: "z", и: "i", і: "i", ї: "i", й: "y", к: "k", л: "l", м: "m", н: "n", о: "o",
  п: "p", р: "r", с: "s", т: "t", у: "u", ф: "f", х: "kh", ц: "ts", ч: "ch",
  ш: "sh", щ: "shch", ъ: "", ы: "y", ь: "", э: "e", ю: "yu", я: "ya",
};

/** Lowercase, strip diacritics, transliterate Cyrillic — "Ко́рче" and "Korçë" become comparable. */
function fold(text: string): string {
  const lower = text.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
  let out = "";
  for (const char of lower) {
    out += char in CYRILLIC_TO_LATIN ? CYRILLIC_TO_LATIN[char] : char;
  }
  return out;
}

/**
 * Towns the message names that the catalogue has nothing in, in the order they
 * were written. Empty for every ordinary message, which is the common case.
 */
export function detectUnservedPlaces(message: string): string[] {
  if (!message) return [];
  const folded = fold(message);
  const found: Array<{ label: string; at: number }> = [];
  for (const place of UNSERVED_PLACES) {
    let best = -1;
    for (const spelling of place.spellings) {
      // Word boundaries on the folded text: "berat" must not match "beratene".
      const at = new RegExp(`(^|[^a-z0-9])${spelling}($|[^a-z0-9])`).exec(folded)?.index ?? -1;
      if (at >= 0 && (best < 0 || at < best)) best = at;
    }
    if (best >= 0) found.push({ label: place.label, at: best });
  }
  return found.sort((a, b) => a.at - b.at).map((f) => f.label);
}

/** The note handed to the model for this turn, or `null` when the message names no such town. */
export function unservedPlacesNote(message: string): string | null {
  const places = detectUnservedPlaces(message);
  if (places.length === 0) return null;
  const list = places.join(", ");
  return [
    `The visitor's message names ${list}. The catalog has no listings there at all — not few, none.`,
    `Open your answer by saying so and naming the place. Only then offer the nearest city that does have stock,`,
    `named as a different place, and offer to pass the request to an agent. Do not show ${list} listings, because there are none.`,
  ].join(" ");
}
