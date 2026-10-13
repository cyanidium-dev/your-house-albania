'use client'

import * as React from 'react'
import { classifyTraffic } from '@/lib/analytics/trafficSource'
import { buildUtmLink, slugCampaign, UTM_PRESETS, type UtmPreset } from './utm'

const PRESET_KEYS = Object.keys(UTM_PRESETS) as UtmPreset[]

/**
 * Builds a tagged link for a post or a message, so the visits and leads it
 * brings show up under their own source in the tables above.
 */
export function UtmBuilder() {
  const [url, setUrl] = React.useState('https://www.domlivo.com/en')
  const [preset, setPreset] = React.useState<UtmPreset>('telegram')
  const [campaign, setCampaign] = React.useState('')
  const [copied, setCopied] = React.useState(false)

  const result = buildUtmLink(url, preset, campaign)
  const { source, medium } = UTM_PRESETS[preset]
  const name = slugCampaign(campaign)
  const arrival = classifyTraffic({
    referrerHost: '',
    selfHost: 'www.domlivo.com',
    utmSource: source,
    utmMedium: medium,
    utmCampaign: name || undefined,
    hasGclid: false,
  })

  async function copy() {
    if (!('url' in result)) return
    try {
      await navigator.clipboard.writeText(result.url)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1500)
    } catch {
      setCopied(false)
    }
  }

  const field =
    'w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 outline-none focus:border-neutral-900 focus:ring-2 focus:ring-neutral-900/10'

  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-1 gap-3 md:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)]">
        <label className="flex flex-col gap-1 text-xs font-medium text-neutral-600">
          Page on domlivo.com
          <input className={field} value={url} onChange={(e) => setUrl(e.target.value)} spellCheck={false} />
        </label>
        <label className="flex flex-col gap-1 text-xs font-medium text-neutral-600">
          Channel
          <select className={field} value={preset} onChange={(e) => setPreset(e.target.value as UtmPreset)}>
            {PRESET_KEYS.map((k) => (
              <option key={k} value={k}>
                {UTM_PRESETS[k].label}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-xs font-medium text-neutral-600">
          Campaign
          <input
            className={field}
            value={campaign}
            onChange={(e) => setCampaign(e.target.value)}
            placeholder="e.g. durres-sea-view-october"
            spellCheck={false}
          />
        </label>
      </div>

      {'error' in result ? (
        <p className="text-sm text-red-600">{result.error}</p>
      ) : (
        <>
          <div className="flex gap-2">
            <input readOnly value={result.url} className={`${field} font-mono text-xs`} onFocus={(e) => e.target.select()} />
            <button
              type="button"
              onClick={copy}
              className="inline-flex h-9 shrink-0 items-center rounded-full bg-neutral-900 px-4 text-xs font-semibold text-white transition hover:bg-neutral-700"
            >
              {copied ? 'Copied' : 'Copy'}
            </button>
          </div>
          <p className="text-xs text-neutral-500">
            Arrives as source <code className="font-mono">{arrival.source}</code> / medium{' '}
            <code className="font-mono">{arrival.medium}</code>, channel{' '}
            <code className="font-mono">{arrival.channel}</code>
            {arrival.campaign ? (
              <>
                , campaign <code className="font-mono">{arrival.campaign}</code>
              </>
            ) : null}
            .
          </p>
          {result.warning ? <p className="text-xs text-amber-700">{result.warning}</p> : null}
        </>
      )}
    </div>
  )
}
