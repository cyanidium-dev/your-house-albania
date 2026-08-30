/**
 * Idempotent: adds the Seo.listing namespace to messages/*.json.
 * Keyword-driven metadata templates for geo catalog pages, replacing the
 * generic "Discover inspiring designed homes." filler that leaked into
 * <title> on every city page without a CMS SEO document.
 *
 * Wording follows the Ahrefs research in seo-ahrefs-research.md: each locale
 * leads with the phrase that market actually searches for.
 *
 * Run with --dry to preview. Existing keys are never overwritten.
 */
const fs = require('node:fs')
const path = require('node:path')

const DRY = process.argv.includes('--dry')
const dirArg = process.argv.find((a) => a.startsWith('--dir='))
const dir = path.resolve(dirArg ? dirArg.slice('--dir='.length) : 'messages')

const T = {
  // sq: {city} receives the locative form, so "në {city}" reads "në Tiranë".
  sq: {
    cityTitle: 'Shtëpi dhe apartamente në shitje në {city}',
    cityDescription:
      'Prona të verifikuara në shitje në {city}: apartamente 1+1 dhe 2+1, shtëpi private dhe vila. Çmime aktuale, drejtpërdrejt nga pronarët dhe agjencitë.',
    countryTitle: 'Pasuri të paluajtshme në shitje në Shqipëri',
    countryDescription:
      'Apartamente, shtëpi dhe vila në shitje në Tiranë, Durrës, Vlorë dhe Sarandë. Prona të verifikuara me çmime aktuale, pa komision.',
    catalogTitle: 'Katalogu i pronave në shitje në Shqipëri',
    catalogDescription:
      'Të gjitha pronat në shitje në Shqipëri: apartamente, shtëpi, vila dhe tokë. Filtro sipas qytetit, çmimit dhe numrit të dhomave.',
  },
  en: {
    cityTitle: 'Property for Sale in {city}, Albania — Apartments & Houses',
    cityDescription:
      'Verified property for sale in {city}, Albania: apartments, houses and villas with current prices. Direct from owners and trusted agencies, no commission.',
    countryTitle: 'Albania Real Estate — Property for Sale',
    countryDescription:
      'Buy property in Albania: apartments, houses and beachfront villas in Tirana, Durres, Vlore and Saranda. Verified listings with real prices.',
    catalogTitle: 'Property for Sale in Albania — Full Catalogue',
    catalogDescription:
      'Browse every property for sale in Albania: apartments, houses, villas and land. Filter by city, price, area and number of bedrooms.',
  },
  ru: {
    cityTitle: 'Недвижимость в {city}, Албания — купить квартиру или дом',
    cityDescription:
      'Проверенные объекты в {city}: квартиры, дома и виллы с актуальными ценами. Напрямую от собственников и проверенных агентств, без комиссии.',
    countryTitle: 'Недвижимость в Албании — купить квартиру, дом или виллу',
    countryDescription:
      'Купить недвижимость в Албании: квартиры у моря, дома и виллы в Тиране, Дурресе, Влёре и Саранде. Проверенные объекты с реальными ценами.',
    catalogTitle: 'Каталог недвижимости в Албании — все объекты',
    catalogDescription:
      'Все объекты недвижимости в Албании: квартиры, дома, виллы и участки. Фильтры по городу, цене, площади и количеству комнат.',
  },
  uk: {
    cityTitle: 'Нерухомість в {city}, Албанія — купити квартиру чи будинок',
    cityDescription:
      'Перевірені обʼєкти в {city}: квартири, будинки та вілли з актуальними цінами. Напряму від власників і перевірених агентств, без комісії.',
    countryTitle: 'Нерухомість в Албанії — купити квартиру, будинок чи вілу',
    countryDescription:
      'Купити нерухомість в Албанії: квартири біля моря, будинки та вілли в Тирані, Дурресі, Влері та Саранді. Перевірені обʼєкти з реальними цінами.',
    catalogTitle: 'Каталог нерухомості в Албанії — усі обʼєкти',
    catalogDescription:
      'Усі обʼєкти нерухомості в Албанії: квартири, будинки, вілли та ділянки. Фільтри за містом, ціною, площею та кількістю кімнат.',
  },
  pl: {
    cityTitle: 'Nieruchomości w {city}, Albania — mieszkania i domy',
    cityDescription:
      'Sprawdzone nieruchomości na sprzedaż w {city}: mieszkania, domy i wille z aktualnymi cenami. Bezpośrednio od właścicieli i zaufanych agencji.',
    countryTitle: 'Nieruchomości w Albanii — mieszkania i domy na sprzedaż',
    countryDescription:
      'Kup nieruchomość w Albanii: mieszkania nad morzem, domy i wille w Tiranie, Durres, Wlorze i Sarandzie. Sprawdzone oferty z realnymi cenami.',
    catalogTitle: 'Nieruchomości w Albanii na sprzedaż — pełny katalog',
    catalogDescription:
      'Wszystkie nieruchomości na sprzedaż w Albanii: mieszkania, domy, wille i działki. Filtruj według miasta, ceny, metrażu i liczby pokoi.',
  },
  it: {
    cityTitle: 'Case in vendita a {city}, Albania — appartamenti e ville',
    cityDescription:
      'Immobili verificati in vendita a {city}: appartamenti, case e ville con prezzi aggiornati. Direttamente da proprietari e agenzie affidabili.',
    countryTitle: 'Case in vendita in Albania — immobili fronte mare',
    countryDescription:
      'Comprare casa in Albania: appartamenti fronte mare, case e ville a Tirana, Durazzo, Valona e Saranda. Immobili verificati con prezzi reali.',
    catalogTitle: 'Immobili in vendita in Albania — catalogo completo',
    catalogDescription:
      'Tutti gli immobili in vendita in Albania: appartamenti, case, ville e terreni. Filtra per città, prezzo, superficie e numero di camere.',
  },
}

let touched = 0
for (const [locale, listing] of Object.entries(T)) {
  const file = path.join(dir, `${locale}.json`)
  if (!fs.existsSync(file)) {
    console.log(`skip ${locale}.json — not present in this working tree`)
    continue
  }
  const json = JSON.parse(fs.readFileSync(file, 'utf8'))
  json.Seo = json.Seo || {}
  if (json.Seo.listing) {
    console.log(`keep ${locale}.Seo.listing — already defined`)
    continue
  }
  json.Seo.listing = listing
  console.log(`add  ${locale}.Seo.listing`)
  if (!DRY) {
    fs.writeFileSync(file, JSON.stringify(json, null, 2) + '\n', 'utf8')
    touched++
  }
}
console.log(DRY ? '\n(dry run — nothing written)' : `\nwrote ${touched} file(s)`)
