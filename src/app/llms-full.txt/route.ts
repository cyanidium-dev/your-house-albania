import { NextResponse } from 'next/server'
import { getSiteBaseUrl } from '@/lib/siteUrl'
import { fetchPriceIndexSnapshot } from '@/lib/sanity/client'
import { llmsFullText, type MethodologyCopy } from '@/lib/priceIndex/llmsText'
import en from '../../../messages/en.json'

/**
 * `/llms-full.txt`: the long companion of `/llms.txt` — the Domlivo Price
 * Index methodology in full and every city's district table as markdown, so
 * an assistant can quote a figure with its sample, date and method without
 * rendering a page. English copy from `messages/en.json`, the figures from the
 * same hourly snapshot as the `/info` pages.
 */
export const revalidate = 3600

export async function GET() {
  const snapshot = await fetchPriceIndexSnapshot()
  if (!snapshot) {
    return new NextResponse('The price index is unavailable right now.\n', {
      status: 503,
      headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Retry-After': '600' },
    })
  }
  const copy = en.PriceIndex.methodology as MethodologyCopy
  return new NextResponse(llmsFullText(snapshot, getSiteBaseUrl(), copy), {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
    },
  })
}
