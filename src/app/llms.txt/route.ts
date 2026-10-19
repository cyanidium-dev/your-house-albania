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
export const revalidate = 3600

function buildLlmsTxt(base: string, snapshot: PriceIndexSnapshot | null, knowledge: KnowledgeArticle[]): string {
  const u = (path: string) => `${base}${path}`
  return `# Domlivo

> Domlivo (domlivo.com) is a property marketplace for Albania: apartments, houses, villas, land and commercial space for sale, listed by owners and partner agencies, with asking prices on every listing. Most of the current inventory is in Durrës and along its coast (Golem, Plazh, Shkëmbi i Kavajës, Qerret, Mali i Robit). Alongside the listings the site publishes sourced research on prices, districts, taxes and the buying process for foreign buyers.

The idea behind it: an analytical marketplace that no single agency owns. Owners and many partner agencies publish on it, each listing names who listed it, and an AI assistant on the site searches the listings in the visitor's own words and answers questions about utilities, buying costs and rental income from Domlivo's own sourced research, with citations.

Every page exists in seven languages under its locale prefix: /en, /sq, /ru, /uk, /it, /pl, /de. The English URLs are listed here.

Figures on the price pages come from two places and are labelled as such: the Domlivo Price Index, asking prices computed from the listings live on Domlivo (median and 20th–80th percentile price per m², sample size, by city and district, refreshed hourly, CC BY 4.0, method at ${u('/en/methodology')}), and published market research, each cited on the page with a link.

${snapshot ? `${keyFiguresMarkdown(snapshot, base)}\n\n` : ''}${knowledge.length ? `${referenceFactsMarkdown(knowledge, base)}\n\n` : ''}## Listings

- [Property for sale in Albania](${u('/en/sale')}): all sale listings with filters for city, district, type, price and area
- [Durrës: apartments and property for sale](${u('/en/albania/durres')}): the largest section, with links to each district and to one-bedroom, two-bedroom, near-the-sea, new-build and under €100k selections
- [Golem](${u('/en/albania/durres/golem-durres')}), [Plazh](${u('/en/albania/durres/plazh')}), [Durrës city centre](${u('/en/albania/durres/city-center-durres')}), [Shkëmbi i Kavajës](${u('/en/albania/durres/shkembi-durres')}), [Qerret](${u('/en/albania/durres/qerret')}): district listings
- [Cities](${u('/en/cities')}): Tirana, Durrës, Vlorë, Sarandë, Himarë, Shëngjin, Shkodër

## Prices and districts

- [Durrës: prices and districts](${u('/en/albania/durres/info')}): price per m² by zone with sources, a live table from current listings, district notes, FAQ
- [Tirana: prices and districts](${u('/en/albania/tirana/info')})
- [Vlorë: prices and districts](${u('/en/albania/vlore/info')})
- [Sarandë: prices and districts](${u('/en/albania/sarande/info')})
- [Price index methodology](${u('/en/methodology')}): what an asking price is, the sample, filters, the 30-flat threshold, how to cite, licence
- [Price index data (JSON)](${u('/data/prices/index.json')}) and one CSV per city at ${u('/data/prices/<city>.csv')}
- [Full text for language models](${u('/llms-full.txt')}): the methodology and every city's district table

## Guides and comparisons

- [Guides](${u('/en/guides')}): buying property in Albania as a foreigner, the market overview, investment, and side-by-side comparisons
- [Durrës or Vlorë](${u('/en/guides/durres-vs-vlore')}), [Tirana or Durrës](${u('/en/guides/tirana-vs-durres')}), [Vlorë or Sarandë](${u('/en/guides/vlora-vs-saranda')}), [Sarandë or Ksamil](${u('/en/guides/saranda-vs-ksamil')}), [Golem or Plazh](${u('/en/guides/golem-vs-plazh')}): city and district comparisons
- [Albania or Montenegro](${u('/en/guides/albania-vs-montenegro')}), [Albania or Croatia](${u('/en/guides/albania-vs-croatia')}), [Albania or Greece](${u('/en/guides/albania-vs-greece')}): country comparisons for buyers
- [Blog](${u('/en/blog')}): legal steps, documents, taxes, rental income, district choice, market outlook
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
