import { NextResponse } from 'next/server'
import { getSiteBaseUrl } from '@/lib/siteUrl'

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
 */
export const dynamic = 'force-static'
export const revalidate = 86400

function buildLlmsTxt(base: string): string {
  const u = (path: string) => `${base}${path}`
  return `# Domlivo

> Domlivo (domlivo.com) is a property marketplace for Albania: apartments, houses, villas, land and commercial space for sale, listed by owners and partner agencies, with asking prices on every listing. Most of the current inventory is in Durrës and along its coast (Golem, Plazh, Shkëmbi i Kavajës, Qerret, Mali i Robit). Alongside the listings the site publishes sourced research on prices, districts, taxes and the buying process for foreign buyers.

Every page exists in seven languages under its locale prefix: /en, /sq, /ru, /uk, /it, /pl, /de. The English URLs are listed here.

Figures on the price pages come from two places and are labelled as such: asking prices computed from the listings live on Domlivo (count, median price and median price per m² by district, refreshed hourly), and published market sources, each cited on the page with a link.

## Listings

- [Property for sale in Albania](${u('/en/sale')}): all sale listings with filters for city, district, type, price and area
- [Durrës: apartments and property for sale](${u('/en/albania/durres')}): the largest section, with links to each district and to one-bedroom, two-bedroom, near-the-sea, new-build and under €100k selections
- [Golem](${u('/en/albania/durres/golem-durres')}), [Plazh](${u('/en/albania/durres/plazh')}), [Durrës city centre](${u('/en/albania/durres/city-center-durres')}), [Shkëmbi i Kavajës](${u('/en/albania/durres/shkembi-durres')}), [Qerret](${u('/en/albania/durres/qerret')}): district listings
- [Cities](${u('/en/cities')}): Tirana, Durrës, Vlorë, Sarandë, Himarë, Shëngjin, Shkodër

## Prices and districts

- [Durrës: prices and districts](${u('/en/albania/durres/info')}): price per m² by zone with sources, a live table from current listings, district notes, FAQ
- [Tirana: prices and districts](${u('/en/albania/tirana/info')})
- [Vlorë: prices and districts](${u('/en/albania/vlore/info')})
- [Sarandë: prices and districts](${u('/en/albania/sarande/info')})

## Guides and comparisons

- [Guides](${u('/en/guides')}): buying property in Albania as a foreigner, the market overview, investment, and side-by-side comparisons
- [Durrës or Vlorë](${u('/en/guides/durres-vs-vlore')}), [Tirana or Durrës](${u('/en/guides/tirana-vs-durres')}), [Vlorë or Sarandë](${u('/en/guides/vlora-vs-saranda')}), [Sarandë or Ksamil](${u('/en/guides/saranda-vs-ksamil')}), [Golem or Plazh](${u('/en/guides/golem-vs-plazh')}): city and district comparisons
- [Albania or Montenegro](${u('/en/guides/albania-vs-montenegro')}), [Albania or Croatia](${u('/en/guides/albania-vs-croatia')}), [Albania or Greece](${u('/en/guides/albania-vs-greece')}): country comparisons for buyers
- [Blog](${u('/en/blog')}): legal steps, documents, taxes, rental income, district choice, market outlook
- [Knowledge base](${u('/en/knowledge')}): reference pages on utilities, tariffs, costs of owning

## About

- [About Domlivo and the team](${u('/en/about')})
- [Contacts](${u('/en/contacts')}): WhatsApp, Telegram, email hello@domlivo.com

## Sitemaps

- [Sitemap index](${u('/sitemap.xml')})
`
}

export function GET() {
  const base = getSiteBaseUrl().replace(/\/$/, '')
  return new NextResponse(buildLlmsTxt(base), {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=86400',
    },
  })
}
