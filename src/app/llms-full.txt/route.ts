import { NextResponse } from 'next/server'
import { getSiteBaseUrl } from '@/lib/siteUrl'
import { fetchPriceIndexSnapshot } from '@/lib/sanity/client'
import { llmsFullText, type MethodologyCopy } from '@/lib/priceIndex/llmsText'
import { interpolatePriceIndexTokens } from '@/lib/priceIndex/tokens'
import { fetchKnowledgeQuestionPages } from '@/lib/sanity/queries/knowledge'
import { knowledgeFullText } from '@/lib/knowledge/llmsText'
import en from '../../../messages/en.json'

/**
 * `/llms-full.txt`: the long companion of `/llms.txt` — the Domlivo Price
 * Index methodology in full and every city's district table as markdown, so
 * an assistant can quote a figure with its sample, date and method without
 * rendering a page. English copy from `messages/en.json`, the figures from the
 * same hourly snapshot as the `/info` pages. After it, every knowledge-base
 * question page in full (lib/knowledge/llmsText).
 */
export const revalidate = 3600

export async function GET() {
  const [snapshot, pages] = await Promise.all([fetchPriceIndexSnapshot(), fetchKnowledgeQuestionPages('en')])
  if (!snapshot) {
    return new NextResponse('The price index is unavailable right now.\n', {
      status: 503,
      headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Retry-After': '600' },
    })
  }
  const copy = en.PriceIndex.methodology as MethodologyCopy
  const priceIndexText = llmsFullText(snapshot, getSiteBaseUrl(), copy)
  const knowledge = knowledgeFullText(interpolatePriceIndexTokens(pages, snapshot, 'en'), getSiteBaseUrl())
  const body = knowledge ? `${priceIndexText.trimEnd()}\n\n${knowledge}` : priceIndexText
  return new NextResponse(body, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
    },
  })
}
