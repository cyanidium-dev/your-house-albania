/**
 * Alt text for listing photographs, composed at render time in the page locale.
 *
 * Measured on production on 2026-09-20: the gallery read its alt from the
 * `gallery[].alt` field in the CMS, which is a plain string in whatever
 * language the agent typed — so /en and /de pages described their photos in
 * Russian or Albanian, with the same sentence on every photo of the listing.
 * That field is no longer read: a string of unknown language is worse than a
 * composed one, and a composed one covers every listing with no backfill.
 *
 * Grammar: Russian, Ukrainian and Polish decline place names after a
 * preposition ("в Дурресе", "w Durrës" → "w Durrësie"), and the CMS stores the
 * nominative only. Every locale except English and German therefore lists its
 * parts with commas — "Квартира 1+1, Плаж, Дуррес" — which is correct for any
 * name. English and German take "in" with a bare name.
 *
 * Pure on purpose: the gallery is a client component, so the page composes the
 * strings on the server and hands them down.
 */

export type PropertyImageAltLocale = "en" | "sq" | "ru" | "uk" | "it" | "pl" | "de";

export type PropertyImageFeature = "seaView" | "nearSea" | "newBuild";

type Dictionary = {
  property: string;
  areaUnit: string;
  sale: string;
  rent: string;
  features: Record<PropertyImageFeature, string>;
  /** "photo 3 of 14" */
  photo: (n: number, total: number) => string;
  /** The preposition before a bare place name; null where the place joins with a comma. */
  inWord: string | null;
  /** Noun and room notation: "1+1 apartment" in English, "Квартира 1+1" elsewhere. */
  head: (type: string, rooms: string) => string;
};

const typeThenRooms = (type: string, rooms: string) => `${type} ${rooms}`;

const DICTIONARY: Record<PropertyImageAltLocale, Dictionary> = {
  en: {
    property: "Property",
    areaUnit: "m²",
    sale: "for sale",
    rent: "for rent",
    features: { seaView: "sea view", nearSea: "near the sea", newBuild: "new build" },
    photo: (n, total) => `photo ${n} of ${total}`,
    inWord: "in",
    head: (type, rooms) => `${rooms} ${type.toLowerCase()}`,
  },
  de: {
    property: "Immobilie",
    areaUnit: "m²",
    sale: "zum Kauf",
    rent: "zur Miete",
    features: { seaView: "Meerblick", nearSea: "nah am Meer", newBuild: "Neubau" },
    photo: (n, total) => `Foto ${n} von ${total}`,
    inWord: "in",
    head: typeThenRooms,
  },
  sq: {
    property: "Pronë",
    areaUnit: "m²",
    sale: "në shitje",
    rent: "me qira",
    features: { seaView: "pamje nga deti", nearSea: "pranë detit", newBuild: "ndërtim i ri" },
    photo: (n, total) => `foto ${n} nga ${total}`,
    inWord: null,
    head: typeThenRooms,
  },
  ru: {
    property: "Недвижимость",
    areaUnit: "м²",
    sale: "продажа",
    rent: "аренда",
    features: { seaView: "вид на море", nearSea: "рядом с морем", newBuild: "новостройка" },
    photo: (n, total) => `фото ${n} из ${total}`,
    inWord: null,
    head: typeThenRooms,
  },
  uk: {
    property: "Нерухомість",
    areaUnit: "м²",
    sale: "продаж",
    rent: "оренда",
    features: { seaView: "вид на море", nearSea: "поруч із морем", newBuild: "новобудова" },
    photo: (n, total) => `фото ${n} з ${total}`,
    inWord: null,
    head: typeThenRooms,
  },
  it: {
    property: "Immobile",
    areaUnit: "m²",
    sale: "in vendita",
    rent: "in affitto",
    features: { seaView: "vista mare", nearSea: "vicino al mare", newBuild: "nuova costruzione" },
    photo: (n, total) => `foto ${n} di ${total}`,
    inWord: null,
    head: typeThenRooms,
  },
  pl: {
    property: "Nieruchomość",
    areaUnit: "m²",
    sale: "sprzedaż",
    rent: "wynajem",
    features: { seaView: "widok na morze", nearSea: "blisko morza", newBuild: "nowe budownictwo" },
    photo: (n, total) => `zdjęcie ${n} z ${total}`,
    inWord: null,
    head: typeThenRooms,
  },
};

function dictionaryFor(locale: string): Dictionary {
  return DICTIONARY[(locale in DICTIONARY ? locale : "en") as PropertyImageAltLocale];
}

function capitalise(s: string): string {
  return s ? s.charAt(0).toLocaleUpperCase() + s.slice(1) : s;
}

export type PropertyImageAltInput = {
  locale: string;
  /** 0-based position of the photo in the gallery. */
  index: number;
  total: number;
  /** Localised type noun from the CMS: "Apartment", "Квартира". */
  typeLabel?: string | null;
  typeSlug?: string | null;
  bedrooms?: number | null;
  areaM2?: number | null;
  district?: string | null;
  city?: string | null;
  /** Deal type as stored: "sale" | "rent" | "short-term". */
  deal?: string | null;
  /** At most the first one is used — an alt is a description, not a tag list. */
  features?: PropertyImageFeature[];
};

/** The `N+1` notation, which only flats carry (see lib/catalog/listingFacets). */
function roomsNotation(typeSlug?: string | null, bedrooms?: number | null): string {
  return typeSlug === "apartment" && typeof bedrooms === "number" && Number.isInteger(bedrooms) && bedrooms >= 1
    ? `${bedrooms}+1`
    : "";
}

function dealWord(deal: string | null | undefined, d: Dictionary): string {
  const key = (deal ?? "").toLowerCase().trim();
  if (key === "sale") return d.sale;
  if (key === "rent" || key === "short-term" || key === "long-term") return d.rent;
  return "";
}

/**
 * en: "1+1 apartment for sale in Plazh, Durrës, 61 m², sea view — photo 3 of 14"
 * ru: "Квартира 1+1, продажа, Плаж, Дуррес, 61 м², вид на море — фото 3 из 14"
 */
export function buildPropertyImageAlt(input: PropertyImageAltInput): string {
  const d = dictionaryFor(input.locale);
  const type = (input.typeLabel ?? "").trim() || d.property;
  const rooms = roomsNotation(input.typeSlug, input.bedrooms);
  const deal = dealWord(input.deal, d);

  let head = rooms ? d.head(type, rooms) : type;
  // "for sale" reads as part of the noun phrase where the place follows "in";
  // in the comma locales it is one more item of the list.
  if (deal) head = d.inWord ? `${head} ${deal}` : `${head}, ${deal}`;

  const district = (input.district ?? "").trim();
  const city = (input.city ?? "").trim();
  const place = [district, district.toLowerCase() === city.toLowerCase() ? "" : city].filter(Boolean).join(", ");
  if (place) head = d.inWord ? `${head} ${d.inWord} ${place}` : `${head}, ${place}`;

  const area =
    typeof input.areaM2 === "number" && Number.isFinite(input.areaM2) && input.areaM2 > 0
      ? `${Math.round(input.areaM2 * 10) / 10} ${d.areaUnit}`
      : "";
  const feature = input.features?.[0] ? d.features[input.features[0]] : "";

  const description = capitalise([head, area, feature].filter(Boolean).join(", "));
  const n = Math.max(1, Math.floor(input.index) + 1);
  const counter = input.total > 1 ? d.photo(n, input.total) : "";
  return counter ? `${description} — ${counter}` : description;
}

/**
 * Features in the order an alt should prefer them. "Near the sea" uses the
 * same 300 m the catalogue facet does, passed in so this file stays free of
 * imports the client bundle would drag along.
 */
export function propertyImageFeatures(input: {
  amenitySlugs?: Array<string | null | undefined>;
  beachfront?: boolean | null;
  seaDistanceMeters?: number | null;
  nearSeaMaxMeters: number;
  constructionStage?: string | null;
}): PropertyImageFeature[] {
  const out: PropertyImageFeature[] = [];
  if (input.amenitySlugs?.includes("sea-view")) out.push("seaView");
  if (
    input.beachfront === true ||
    (typeof input.seaDistanceMeters === "number" && input.seaDistanceMeters <= input.nearSeaMaxMeters)
  ) {
    out.push("nearSea");
  }
  if (input.constructionStage === "off-plan" || input.constructionStage === "under-construction") {
    out.push("newBuild");
  }
  return out;
}
