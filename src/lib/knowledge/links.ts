/**
 * Which knowledge-base question pages each existing page links to.
 *
 * Blog posts carry no topic tags, so the match is written by hand: two or three
 * questions a reader of that post is likely to ask next. Every question page
 * gets at least two incoming links from here (pinned by the test next to this
 * file), plus the footer link to the /knowledge index. A slug that is not
 * published is simply not rendered, so a page can be unpublished without
 * touching this map.
 */

export const KNOWLEDGE_SLUGS = {
  foreigners: "can-foreigners-buy-property-in-albania",
  germany: "can-a-german-citizen-buy-property-in-albania",
  poland: "can-a-polish-citizen-buy-property-in-albania",
  italy: "can-an-italian-citizen-buy-property-in-albania",
  ukraine: "can-a-ukrainian-citizen-buy-property-in-albania",
  uk: "can-a-british-citizen-buy-property-in-albania",
  land: "can-a-foreigner-buy-land-in-albania",
  documents: "documents-to-buy-property-in-albania-as-a-foreigner",
  powerOfAttorney: "buy-property-in-albania-with-power-of-attorney",
  residence: "does-buying-property-in-albania-give-residence",
  transferTax: "is-there-a-transfer-tax-when-buying-property-in-albania",
  notary: "notary-fees-buying-property-albania",
  ashk: "ashk-property-registration-fee-albania",
  vat: "is-there-vat-on-new-build-apartments-in-albania",
  rentalTax: "rental-income-tax-albania",
  propertyTax: "annual-property-tax-albania",
  payment: "how-to-pay-for-property-in-albania-money-transfer-aml",
  utilities: "utility-costs-apartment-albania-by-city",
  management: "rental-management-fees-albania",
  yields: "rental-yield-durres-by-district",
  steps: "steps-to-buy-property-in-albania",
  timeline: "how-long-does-buying-property-in-albania-take",
  legalisation: "how-to-check-if-a-property-in-albania-is-legalised",
  informal: "buying-an-informal-house-without-permit-albania",
  offPlan: "off-plan-property-albania-risks-escrow",
  developer: "how-to-check-a-developer-in-albania",
  tiranaDurres: "tirana-or-durres-where-to-buy",
  durresVlore: "durres-or-vlore-where-to-buy",
  plazhGolem: "plazh-or-golem-durres-where-to-buy",
  seaCentre: "durres-seafront-or-city-centre-prices",
} as const;

const K = KNOWLEDGE_SLUGS;

/** Blog post slug → question pages, most relevant first. */
export const KNOWLEDGE_LINKS_BY_BLOG_POST: Record<string, readonly string[]> = {
  "can-foreigners-buy-real-estate-albania": [K.foreigners, K.land, K.residence],
  "buying-property-albania": [K.steps, K.documents, K.transferTax],
  "buying-property-albania-from-germany-2026": [K.germany, K.powerOfAttorney, K.transferTax],
  "albania-property-taxes-german-owners": [K.germany, K.rentalTax, K.propertyTax],
  "retiring-to-albania-from-germany": [K.residence, K.germany, K.utilities],
  "albania-property-for-polish-buyers-2026": [K.poland, K.rentalTax, K.notary],
  "albania-montenegro-croatia-property-comparison": [K.germany, K.land],
  "albania-bulgaria-montenegro-seaside-flat": [K.poland, K.durresVlore],
  "legal-guide-buyers": [K.propertyTax, K.rentalTax, K.transferTax],
  "notary-fees-albania-2026": [K.notary, K.ashk, K.transferTax],
  "legalized-property-albania-how-to-check": [K.legalisation, K.informal, K.ashk],
  "durres-documents-checklist": [K.documents, K.steps, K.powerOfAttorney],
  "utilities-in-albania-monthly-costs": [K.utilities, K.propertyTax],
  "retiring-to-albania-property-costs": [K.utilities, K.propertyTax, K.residence],
  "albania-rental-yield-for-investors": [K.yields, K.management, K.rentalTax],
  "durres-rental-investment-2026": [K.yields, K.plazhGolem, K.management],
  "short-term-rental-albanian-riviera": [K.management, K.rentalTax],
  "how-to-choose-tirana-durres-vlore": [K.tiranaDurres, K.durresVlore],
  "durres-beach-vs-center": [K.seaCentre, K.plazhGolem],
  "albania-property-types-investment-risk": [K.offPlan, K.developer, K.informal],
  "durres-choose-area-2026": [K.plazhGolem, K.seaCentre, K.developer],
  "tirana-buy-without-agent": [K.steps, K.timeline, K.developer],
  "moving-to-albania-with-family": [K.residence, K.utilities, K.ukraine],
  "investment-albania": [K.payment, K.uk, K.ukraine],
  "living-albanian-riviera": [K.uk, K.residence],
  "market-outlook-2026": [K.vat, K.offPlan, K.timeline],
  "albania-seaside-property-prices-by-town-2026": [K.durresVlore, K.italy],
  "property-investment-potential-vlore-sarande": [K.durresVlore, K.italy],
  "price-per-square-metre-albania-cities-2026": [K.tiranaDurres, K.durresVlore, K.seaCentre],
  "albania-property-market-h1-2026": [K.foreigners, K.tiranaDurres],
  "tirana-apartment-prices-2026": [K.tiranaDurres],
  "golem-sewage-buying-2026": [K.plazhGolem],
  "durres-marina-eagle-hills-2026": [K.offPlan, K.vat, K.developer],
  "where-not-to-buy-albania-2026": [K.informal, K.legalisation],
  "eu-accession-albania-property-prices": [K.land, K.payment],
};

/** City slug → question pages shown on its /info page. */
export const KNOWLEDGE_LINKS_BY_CITY: Record<string, readonly string[]> = {
  durres: [K.yields, K.plazhGolem, K.seaCentre],
  tirana: [K.tiranaDurres],
  vlore: [K.durresVlore],
};

/** Pages built on the price index, linked from /methodology. */
export const KNOWLEDGE_LINKS_ON_METHODOLOGY: readonly string[] = [K.yields, K.seaCentre, K.plazhGolem];
