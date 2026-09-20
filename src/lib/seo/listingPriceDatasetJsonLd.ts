/**
 * `Dataset` JSON-LD for the live asking-price table on a city's `/info` page.
 *
 * The table is the one set of figures on the site nobody else can publish: it
 * is computed from the listings that are live on Domlivo. Marking it up as a
 * dataset with a date, a sample size and the method gives an assistant or a
 * journalist something they can cite as a point-in-time fact ("median asking
 * price of a flat in Durrës, n = 268, 20 Sep 2026") instead of "refreshed
 * hourly", which names no moment at all.
 *
 * Asking prices only, and the description says so: nothing here claims to be a
 * sale price or an official index.
 */

export type ListingPriceDatasetInput = {
  baseUrl: string
  /** Absolute or site-relative URL of the page that shows the table. */
  pageUrl: string
  locale: string
  cityName: string
  /** Sale listings behind the whole-city row. */
  listingCount: number
  /** Districts that got a row of their own. */
  districtNames: string[]
  /** ISO date (YYYY-MM-DD) the figures were computed on. */
  asOf: string
  /** Minimum flats a district needs for a row, stated in the description. */
  minFlatsPerRow: number
}

function abs(baseUrl: string, path: string): string {
  const base = baseUrl.replace(/\/$/, '')
  if (path.startsWith('http://') || path.startsWith('https://')) return path
  return path.startsWith('/') ? `${base}${path}` : `${base}/${path}`
}

export function buildListingPriceDatasetJsonLd(input: ListingPriceDatasetInput): object {
  const { baseUrl, pageUrl, locale, cityName, listingCount, districtNames, asOf, minFlatsPerRow } = input
  const url = abs(baseUrl, pageUrl)

  return {
    '@context': 'https://schema.org',
    '@type': 'Dataset',
    '@id': `${url}#listing-price-index`,
    name: `Asking prices of flats for sale in ${cityName}, Albania, by district`,
    description:
      `Count of sale listings, lowest asking price, median asking price and median asking price per m² ` +
      `for flats and studios in ${cityName}, Albania, by district, computed from ${listingCount} sale listings ` +
      `live on Domlivo on ${asOf}. Asking prices, not completed sales. A district is reported once it has ` +
      `${minFlatsPerRow} flats. Price per m² is the total price divided by the area, or the stated rate where a listing is priced per m².`,
    url,
    inLanguage: locale,
    isAccessibleForFree: true,
    dateModified: asOf,
    temporalCoverage: asOf,
    creator: { '@id': `${abs(baseUrl, '/')}#organization` },
    publisher: { '@id': `${abs(baseUrl, '/')}#organization` },
    spatialCoverage: {
      '@type': 'Place',
      name: `${cityName}, Albania`,
      ...(districtNames.length > 0
        ? { containsPlace: districtNames.map((name) => ({ '@type': 'Place', name })) }
        : {}),
    },
    variableMeasured: [
      { '@type': 'PropertyValue', name: 'Sale listings', unitText: 'listings' },
      { '@type': 'PropertyValue', name: 'Lowest asking price of a flat', unitCode: 'EUR' },
      { '@type': 'PropertyValue', name: 'Median asking price of a flat', unitCode: 'EUR' },
      { '@type': 'PropertyValue', name: 'Median asking price per square metre', unitText: 'EUR per m²' },
    ],
    measurementTechnique:
      'Median over the sale listings published on domlivo.com at the time of computation; flats and studios only.',
  }
}
