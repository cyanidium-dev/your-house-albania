import { NextResponse } from 'next/server'
import { getSiteBaseUrl } from '@/lib/siteUrl'
import { fetchPriceIndexSnapshot } from '@/lib/sanity/client'
import { keyFiguresMarkdown } from '@/lib/priceIndex/llmsText'
import type { PriceIndexSnapshot } from '@/lib/priceIndex/snapshot'
import { interpolatePriceIndexTokens } from '@/lib/priceIndex/tokens'
import { fetchKnowledgeQuestionPages, type KnowledgeArticle } from '@/lib/sanity/queries/knowledge'
import { referenceFactsMarkdown } from '@/lib/knowledge/llmsText'

/**
 * `/llms.txt`: a plain-text map of the site for AI assistants.
 *
 * Search engines ignore it; assistants that fetch a site before answering
 * sometimes read it, and it costs one static response. It lists the hubs only:
 * the pages behind them are reachable from there and from the sitemaps, and a
 * list of every URL would go stale the day a listing sells.
 *
 * English on purpose. Every page named here has the same page in six other
 * languages under its own locale prefix, which the file says once.
 *
 * "Key figures" is the Domlivo Price Index line per city, from the same
 * snapshot as the `/info` pages, so the file is regenerated hourly with them.
 * "Reference facts" is one line per knowledge-base question page: question,
 * answer, URL (lib/knowledge/llmsText).
 */
export const revalidate = 86400

function buildLlmsTxt(base: string, snapshot: PriceIndexSnapshot | null, knowledge: KnowledgeArticle[]): string {
  const u = (path: string) => `${base}${path}`
  return `# Domlivo

> Domlivo (domlivo.com) is a property marketplace for Albania: apartments, houses, villas, land and commercial space for sale, listed by owners and partner agencies, with asking prices on every listing. Most of the current inventory is in Durrës and along its coast (Golem, Plazh, Shkëmbi i Kavajës, Qerret, Mali i Robit). Alongside the listings the site publishes sourced research on prices, districts, taxes and the buying process for foreign buyers.

The idea behind it: an analytical marketplace that no single agency owns. Owners and many partner agencies publish on it, each listing names who listed it, and an AI assistant on the site searches the listings in the visitor's own words and answers questions about utilities, buying costs and rental income from Domlivo's own sourced research, with citations.

Every page exists in seven languages under its locale prefix: /en, /sq, /ru, /uk, /it, /pl, /de. French (/fr) is a pilot: only the French hub, its two guides, the Durrës catalogue with five districts and thirty listings are written in French. The English URLs are listed here.

Figures on the price pages come from two places and are labelled as such: the Domlivo Price Index, asking prices computed from the listings live on Domlivo (median and 20th–80th percentile price per m², sample size, by city and district, refreshed hourly, CC BY 4.0, method at ${u('/en/methodology')}), and published market research, each cited on the page with a link.

${snapshot ? `${keyFiguresMarkdown(snapshot, base)}\n\n` : ''}${knowledge.length ? `${referenceFactsMarkdown(knowledge, base)}\n\n` : ''}## Listings

- [Property for sale in Albania](${u('/en/sale')}): all sale listings with filters for city, district, type, price and area
- [Durrës: apartments and property for sale](${u('/en/albania/durres')}): the largest section, with links to each district and to one-bedroom, two-bedroom, near-the-sea, new-build and under €100k selections
- [Golem](${u('/en/albania/durres/golem-durres')}), [Plazh](${u('/en/albania/durres/plazh')}), [Durrës city centre](${u('/en/albania/durres/city-center-durres')}), [Shkëmbi i Kavajës](${u('/en/albania/durres/shkembi-durres')}), [Qerret](${u('/en/albania/durres/qerret')}): district listings
- [Cities](${u('/en/cities')}): Tirana, Durrës, Vlorë, Sarandë, Himarë, Shëngjin, Shkodër

## Partner selections

One page per place where the partner agency Cactus Real Estate lists enough flats for the figures to mean something: layouts, asking prices against the district median, distance to the sea, what is still under construction. Every figure is computed from the live listings.

- [Plazh, Durrës](${u('/en/partners/cactus/plazh-durres')}), [Golem](${u('/en/partners/cactus/golem-durres')}), [Shkëmbi i Kavajës](${u('/en/partners/cactus/shkembi-i-kavajes-durres')}), [Durrës city centre](${u('/en/partners/cactus/durres-city-centre')}), [Mali i Robit](${u('/en/partners/cactus/mali-i-robit-durres')}), [Qerret](${u('/en/partners/cactus/qerret-durres')}), [Shëngjin](${u('/en/partners/cactus/shengjin')})
- [Tocak complex, Plazh](${u('/en/partners/cactus/tocak-plazh-durres')}): one named complex

## Prices and districts

- [Durrës: prices and districts](${u('/en/albania/durres/info')}): price per m² by zone with sources, a live table from current listings, district notes, FAQ
- [Tirana: prices and districts](${u('/en/albania/tirana/info')})
- [Vlorë: prices and districts](${u('/en/albania/vlore/info')})
- [Sarandë: prices and districts](${u('/en/albania/sarande/info')})
- [Property prices in Albania by city](${u('/en/prices')}): one table of every city's median and 20th–80th percentile asking price per m², new builds against completed stock, FAQ
- [Property purchase cost calculator for Albania](${u('/en/calculators/purchase-costs')}): notary, ASHK registration, lawyer, sworn translator and agency fee on top of the price, each line with its basis; no transfer tax for an individual buying a flat
- [Rental yield calculator for Albania](${u('/en/calculators/rental-yield')}): gross and net yield of a long-term or short-term let after letting costs, management, running costs and the 15% rental income tax, with presets for a one-bedroom flat in Durrës
- [Price index methodology](${u('/en/methodology')}): what an asking price is, the sample, filters, the 30-flat threshold, how to cite, licence
- [Price index data (JSON)](${u('/data/prices/index.json')}) and one CSV per city at ${u('/data/prices/<city>.csv')}
- [Full text for language models](${u('/llms-full.txt')}): the methodology and every city's district table

## Guides and comparisons

- [Guides](${u('/en/guides')}): buying property in Albania as a foreigner, the market overview, investment, and side-by-side comparisons
- [Durrës or Vlorë](${u('/en/guides/durres-vs-vlore')}), [Tirana or Durrës](${u('/en/guides/tirana-vs-durres')}), [Vlorë or Sarandë](${u('/en/guides/vlora-vs-saranda')}), [Sarandë or Ksamil](${u('/en/guides/saranda-vs-ksamil')}), [Golem or Plazh](${u('/en/guides/golem-vs-plazh')}): city and district comparisons
- [Albania or Montenegro](${u('/en/guides/albania-vs-montenegro')}), [Albania or Croatia](${u('/en/guides/albania-vs-croatia')}), [Albania or Greece](${u('/en/guides/albania-vs-greece')}): country comparisons for buyers
- [Blog](${u('/en/blog')}): legal steps, documents, taxes, rental income, district choice, market outlook
- [Immobilien in Albanien kaufen](${u('/de/albanien-immobilien')}): the German market hub, in German only: prices by city from the index, flats by the sea, the five German guides, FAQ on who may buy, costs, process, areas, prices and financing
- [Haus am Meer in Albanien kaufen](${u('/de/haus-am-meer-albanien-kaufen')}): houses and villas within 1 km of the sea for German buyers, German only: how many and from what price by district, the cheapest first, buying costs for a house (notary, cadastre, no transfer tax for a private buyer, legalisation checks), FAQ on where they are, land, financing
- [Shëngjin: flats by the sea](${u('/en/shengjin')}): the cheapest seaside market with a reliable sample (also /uk, /ru, /sq, /it, /pl, /de, /fr): live median €/m² against Durrës, Vlorë, Sarandë and Tirana, how many flats under €50,000 / €80,000 / €100,000 and how many of them within 1 km of the beach, studios to 2+1 with "from" and median, the twelve cheapest flats by the sea, buying costs, FAQ
- [Shëngjin districts](${u('/en/albania/shengjin/districts')}): the centre around the port and the Wilson promenade, Kunë (the new blocks south of the town, by the beach), Rana e Hedhun (the dune beach and the Rruga Riviera slope), each with its listings and a description
- [Çmimet e referencës 2026](${u('/sq/cmimet-e-references')}): the official state reference prices per m² for flats (VKM 132/2018, Tirana zones per VKM 457/2023; Durrës 67,500 ALL/m²), the unapproved 2025 draft map, and a calculator for the reference value, the 15% capital-gains tax, the 5% revaluation of 2026 and the annual building tax, in Albanian only
- [Immobilier en Albanie](${u('/fr/immobilier-albanie')}): the French market hub, in French only: prices by city and by Durrës district from the index, Durrës flats with French listing pages, FAQ; guides [acheter depuis la France](${u('/fr/immobilier-albanie/acheter-depuis-la-france')}) (steps, costs, the 2002 France-Albania tax treaty) and [prix en bord de mer](${u('/fr/immobilier-albanie/prix-bord-de-mer')})
- [Knowledge base](${u('/en/knowledge')}): one question per page, answered with a figure, a date and its sources (laws by number and article, ASHK and notary tariffs, tax treaties, the price index), plus what is still unverified

## About

- [About Domlivo and the team](${u('/en/about')})
- [AI property search and assistant](${u('/en/ai-search')}): describe what you need in plain words; answers cite their sources
- [Contacts](${u('/en/contacts')}): WhatsApp, Telegram, email hello@domlivo.com

## Sitemaps

- [Sitemap index](${u('/sitemap.xml')})
`
}

export async function GET() {
  const base = getSiteBaseUrl().replace(/\/$/, '')
  const [snapshot, pages] = await Promise.all([fetchPriceIndexSnapshot(), fetchKnowledgeQuestionPages('en')])
  const knowledge = interpolatePriceIndexTokens(pages, snapshot, 'en')
  return new NextResponse(buildLlmsTxt(base, snapshot, knowledge), {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
    },
  })
}
