/**
 * The photographs of Albania that ship with the frontend.
 *
 * Every hero on the site used to fall back to the theme's stock banner — a
 * rendered villa in a desert, on a site about the Albanian coast. These files
 * replace it. They are project static under `/images/`, which CONTENT-OPS
 * allows as the one exception to "all content images from cdn.sanity.io":
 * a fallback cannot depend on the CMS, because the case it exists for is the
 * CMS having nothing.
 *
 * Every file is a free-licence photograph from Wikimedia Commons, and every
 * entry carries the attribution its licence requires. `/image-credits` renders
 * this table next to the CMS credits, which is what makes the CC BY / CC BY-SA
 * entries usable at all — see `fetchImageCredits`.
 *
 * Alt text is NOT stored here: it goes through next-intl like every other
 * string on the site (`AlbaniaPhotos.<key>` in `messages/*.json`), so a Russian
 * reader does not get an English description of the picture.
 */

export type AlbaniaPhoto = {
  /** Key into the `AlbaniaPhotos` message namespace, and the file's basename. */
  key: AlbaniaPhotoKey;
  /** Path under `/public`. */
  src: string;
  /** What the photograph shows, in English. Shown on `/image-credits`. */
  title: string;
  author: string;
  /** One of the values the `imageCredit` schema allows, so both credit tables read the same. */
  licence: string;
  licenceUrl: string;
  /** The Commons file page. */
  sourceUrl: string;
};

const PHOTOS = {
  tirana: {
    src: '/images/albania/tirana.jpg',
    title: 'Tirana seen from above',
    author: 'mikestuartwood',
    licence: 'pd',
    licenceUrl: 'https://en.wikipedia.org/wiki/Public_domain',
    sourceUrl: 'https://commons.wikimedia.org/wiki/File:Tirana_from_Above_2016.jpg',
  },
  durres: {
    src: '/images/albania/durres.jpg',
    title: 'The beach at Durrës, Albania',
    author: 'Shkelzen A. Rexha',
    licence: 'cc0',
    licenceUrl: 'https://creativecommons.org/publicdomain/zero/1.0/',
    sourceUrl: 'https://commons.wikimedia.org/wiki/File:Plazhi_i_Durr%C3%ABsit_04.jpg',
  },
  vlore: {
    src: '/images/albania/vlore.jpg',
    title: 'The cove at Uji i Ftohtë, Vlorë',
    author: 'Leeturtle',
    licence: 'cc-by-sa-4.0',
    licenceUrl: 'https://creativecommons.org/licenses/by-sa/4.0/',
    sourceUrl:
      'https://commons.wikimedia.org/wiki/File:Beach_near_Uji_i_Ftoht%C3%AB%2C_Vlor%C3%AB%2C_Albania.jpg',
  },
  sarande: {
    src: '/images/albania/sarande.jpg',
    title: 'The bay and town of Sarandë, Albania',
    author: 'Rvplpr',
    licence: 'cc-by-sa-4.0',
    licenceUrl: 'https://creativecommons.org/licenses/by-sa/4.0/',
    sourceUrl: 'https://commons.wikimedia.org/wiki/File:Saranda_bay_and_town.jpg',
  },
  shkoder: {
    src: '/images/albania/shkoder.jpg',
    title: 'Panorama of Shkodër, Albania',
    author: 'Arianit Dobroshi',
    licence: 'cc-by-sa-4.0',
    licenceUrl: 'https://creativecommons.org/licenses/by-sa/4.0/',
    sourceUrl: 'https://commons.wikimedia.org/wiki/File:Shkodra_Studenti_St._panorama.jpg',
  },
  shengjin: {
    src: '/images/albania/shengjin.jpg',
    title: 'Shëngjin seen from the air',
    author: 'Albinfo',
    licence: 'cc-by-4.0',
    licenceUrl: 'https://creativecommons.org/licenses/by/4.0/',
    sourceUrl: 'https://commons.wikimedia.org/wiki/File:Sh%C3%ABngjin_2020_aerial_view.jpg',
  },
  himare: {
    src: '/images/albania/himare.jpg',
    title: 'The beach at Dhërmi, Himarë',
    author: 'Sietske2',
    licence: 'cc-by-sa-3.0',
    licenceUrl: 'https://creativecommons.org/licenses/by-sa/3.0/',
    sourceUrl: 'https://commons.wikimedia.org/wiki/File:Dh%C3%ABrmi_-_Beach.JPG',
  },
  ksamil: {
    src: '/images/albania/ksamil.jpg',
    title: 'The bay and islands at Ksamil, Albania',
    author: 'Pudelek',
    licence: 'cc-by-sa-4.0',
    licenceUrl: 'https://creativecommons.org/licenses/by-sa/4.0/',
    sourceUrl: 'https://commons.wikimedia.org/wiki/File:Ksamil%2C_Albania_%28by_Pudelek%29.JPG',
  },
  coast: {
    src: '/images/albania/coast.jpg',
    title: 'Gjipe beach on the Albanian Riviera',
    author: 'Pudelek',
    licence: 'cc-by-sa-3.0',
    licenceUrl: 'https://creativecommons.org/licenses/by-sa/3.0/',
    sourceUrl: 'https://commons.wikimedia.org/wiki/File:Gjipe_beach%2C_Albania.JPG',
  },
  apartments: {
    src: '/images/albania/apartments.jpg',
    title: 'Lake View Residences, Tirana',
    author: 'BBB2021',
    licence: 'cc-by-sa-4.0',
    licenceUrl: 'https://creativecommons.org/licenses/by-sa/4.0/',
    sourceUrl: 'https://commons.wikimedia.org/wiki/File:Lake_View_Residences_Tirana_Zoo.jpg',
  },
  houses: {
    src: '/images/albania/houses.jpg',
    title: 'Residential houses on the coast near Durrës',
    author: 'Jan Pešula',
    licence: 'cc0',
    licenceUrl: 'https://creativecommons.org/publicdomain/zero/1.0/',
    sourceUrl: 'https://commons.wikimedia.org/wiki/File:Albania_residential_houses_near_Durres.JPG',
  },
  villas: {
    src: '/images/albania/villas.jpg',
    title: 'A house above the sea at Vuno, Himarë',
    author: 'Marie Čcheidzeová',
    licence: 'cc-by-sa-4.0',
    licenceUrl: 'https://creativecommons.org/licenses/by-sa/4.0/',
    sourceUrl: 'https://commons.wikimedia.org/wiki/File:Vuno_2012_%2812%29.jpg',
  },
  offices: {
    src: '/images/albania/offices.jpg',
    title: 'The Book Building on Skanderbeg Square, Tirana',
    author: 'BBB2021',
    licence: 'cc-by-sa-4.0',
    licenceUrl: 'https://creativecommons.org/licenses/by-sa/4.0/',
    sourceUrl: 'https://commons.wikimedia.org/wiki/File:Book_Building_2024.jpg',
  },
} as const;

export type AlbaniaPhotoKey = keyof typeof PHOTOS;

export const ALBANIA_PHOTOS: Record<AlbaniaPhotoKey, AlbaniaPhoto> = Object.fromEntries(
  (Object.keys(PHOTOS) as AlbaniaPhotoKey[]).map((key) => [key, { key, ...PHOTOS[key] }]),
) as Record<AlbaniaPhotoKey, AlbaniaPhoto>;

/** Every photograph, in a stable order, for the credits page. */
export const ALBANIA_PHOTO_LIST: AlbaniaPhoto[] = (Object.keys(PHOTOS) as AlbaniaPhotoKey[])
  .map((key) => ALBANIA_PHOTOS[key])
  .sort((a, b) => a.title.localeCompare(b.title));

/** Where the site has no photo of a place at all. The coast is what it sells. */
export const DEFAULT_ALBANIA_PHOTO = ALBANIA_PHOTOS.coast;

/** City slugs that have their own photograph. Anything else falls through. */
const CITY_KEYS: Record<string, AlbaniaPhotoKey> = {
  tirana: 'tirana',
  durres: 'durres',
  vlore: 'vlore',
  sarande: 'sarande',
  shkoder: 'shkoder',
  shengjin: 'shengjin',
  himare: 'himare',
  ksamil: 'ksamil',
};

function normalize(value: string | null | undefined): string {
  return typeof value === 'string' ? value.trim().toLowerCase() : '';
}

/** The photograph for a city, or null when the site has none of that city. */
export function photoForCity(citySlug: string | null | undefined): AlbaniaPhoto | null {
  const key = CITY_KEYS[normalize(citySlug)];
  return key ? ALBANIA_PHOTOS[key] : null;
}

/**
 * Property-type slugs to a photograph. Deliberately partial: a type with no
 * honest picture is better served by the city photo of the page it sits on.
 */
const TYPE_KEYS: Record<string, AlbaniaPhotoKey> = {
  apartment: 'apartments',
  studio: 'apartments',
  penthouse: 'apartments',
  house: 'houses',
  'residential-homes': 'houses',
  villa: 'villas',
  'luxury-villa': 'villas',
  office: 'offices',
  'office-spaces': 'offices',
  'commercial-space': 'offices',
  commercial: 'offices',
  land: 'coast',
};

export function photoForPropertyType(typeSlug: string | null | undefined): AlbaniaPhoto | null {
  const key = TYPE_KEYS[normalize(typeSlug)];
  return key ? ALBANIA_PHOTOS[key] : null;
}

/** Deal routes: renting short-term is a coast business, buying is a city one. */
const DEAL_KEYS: Record<string, AlbaniaPhotoKey> = {
  'short-term-rent': 'ksamil',
  'short-term': 'ksamil',
  rent: 'apartments',
  'long-term-rent': 'apartments',
  sale: 'coast',
};

export function photoForDeal(dealSegment: string | null | undefined): AlbaniaPhoto | null {
  const key = DEAL_KEYS[normalize(dealSegment)];
  return key ? ALBANIA_PHOTOS[key] : null;
}

/**
 * Pick a hero photograph from whatever the page knows about itself.
 *
 * Order matters: the city is the strongest signal a reader recognises, so a
 * page about Durrës gets Durrës even when its slug also says "apartment".
 * Deal and type only decide pages with no place attached.
 */
export function heroPhotoFor(context: {
  citySlug?: string | null;
  propertyType?: string | null;
  deal?: string | null;
  /** Landing slug or document id — matched loosely, so `apartment-tirana` works. */
  slug?: string | null;
}): AlbaniaPhoto {
  const byCity = photoForCity(context.citySlug);
  if (byCity) return byCity;

  const slug = normalize(context.slug);
  for (const [citySlug, key] of Object.entries(CITY_KEYS)) {
    if (slug === citySlug || slug.includes(`-${citySlug}`) || slug.startsWith(`${citySlug}-`)) {
      return ALBANIA_PHOTOS[key];
    }
  }

  const byType = photoForPropertyType(context.propertyType);
  if (byType) return byType;

  const byDeal = photoForDeal(context.deal);
  if (byDeal) return byDeal;

  for (const [typeSlug, key] of Object.entries(TYPE_KEYS)) {
    if (slug === typeSlug || slug.startsWith(`${typeSlug}-`)) return ALBANIA_PHOTOS[key];
  }
  for (const [dealSlug, key] of Object.entries(DEAL_KEYS)) {
    if (slug === dealSlug) return ALBANIA_PHOTOS[key];
  }

  return DEFAULT_ALBANIA_PHOTO;
}
