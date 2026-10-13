import type { ReactNode } from 'react'
import type { PageQueryStat, TopQuery } from '@/lib/analyticsStore/reports'
import { isoWeekNumber, type LandingRow, type SourceRow, type WeekRow } from './aggregate'
import type { PanelData, PopularListing } from './loadAnalytics'
import { UtmBuilder } from './UtmBuilder'

/*
 * Server-rendered sections of /editor/analytics. Internal tool: dense tables,
 * numbers right-aligned in tabular figures, "—" wherever a source is not
 * connected (as opposed to 0, which is a real zero).
 */

const DASH = '—'

function n(v: number | null | undefined): string {
  return typeof v === 'number' ? v.toLocaleString('en-US') : DASH
}

function pct(v: number | null | undefined): string {
  return typeof v === 'number' && Number.isFinite(v) ? `${(v * 100).toFixed(1)}%` : DASH
}

function pos(v: number | null | undefined): string {
  return typeof v === 'number' && Number.isFinite(v) ? v.toFixed(1) : DASH
}

function bytes(v: number): string {
  if (v >= 1024 * 1024) return `${(v / (1024 * 1024)).toFixed(1)} MB`
  return `${Math.round(v / 1024)} KB`
}

export function Card({ id, title, note, children }: { id: string; title: string; note?: ReactNode; children: ReactNode }) {
  return (
    <section id={id} className="rounded-2xl border border-neutral-200 bg-white p-5">
      <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-base font-semibold tracking-tight">{title}</h2>
        {note ? <p className="text-xs text-neutral-500">{note}</p> : null}
      </div>
      {children}
    </section>
  )
}

export function Notice({ tone = 'amber', children }: { tone?: 'amber' | 'neutral' | 'red'; children: ReactNode }) {
  const cls =
    tone === 'red'
      ? 'border-red-200 bg-red-50 text-red-800'
      : tone === 'neutral'
        ? 'border-neutral-200 bg-neutral-50 text-neutral-600'
        : 'border-amber-200 bg-amber-50 text-amber-800'
  return <div className={`rounded-lg border p-3 text-sm ${cls}`}>{children}</div>
}

const TH = 'px-2 py-1.5 text-left text-[11px] font-semibold uppercase tracking-wide text-neutral-500'
const THN = `${TH} text-right`
const TD = 'px-2 py-1.5 align-top'
const TDN = `${TD} text-right tabular-nums whitespace-nowrap`

function Table({ head, children }: { head: ReactNode; children: ReactNode }) {
  return (
    <div className="-mx-2 overflow-x-auto">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b border-neutral-200">{head}</tr>
        </thead>
        <tbody className="[&>tr]:border-t [&>tr]:border-neutral-100">{children}</tbody>
      </table>
    </div>
  )
}

function PathLink({ path }: { path: string }) {
  if (!path.startsWith('/')) return <span className="text-neutral-400">{path}</span>
  return (
    <a href={path} target="_blank" rel="noreferrer" className="break-all font-mono text-xs text-neutral-800 hover:underline">
      {decodePath(path)}
    </a>
  )
}

function decodePath(path: string): string {
  try {
    return decodeURI(path)
  } catch {
    return path
  }
}

function DbMissing({ data, what }: { data: PanelData; what: string }) {
  if (data.db.error) return <Notice tone="red">Database error, {what} unavailable: {data.db.error}</Notice>
  return <Notice>Database not connected yet, so no {what}. See the status box below.</Notice>
}

// ---------------------------------------------------------------------------
// a. Sources → leads
// ---------------------------------------------------------------------------

export function SourcesSection({ data }: { data: PanelData }) {
  const rows: SourceRow[] = data.sources.slice(0, 40)
  return (
    <Card
      id="sources"
      title="Sources → leads"
      note="Visits: our own counter (first page of each visit). Leads: Sanity, test and spam excluded."
    >
      {!data.db.ok ? (
        <div className="mb-3">
          <DbMissing data={data} what="visits" />
        </div>
      ) : null}
      {!data.sanity.ok ? (
        <div className="mb-3">
          <Notice tone="red">Leads unavailable: {data.sanity.error}</Notice>
        </div>
      ) : null}
      {rows.length === 0 ? (
        <Notice tone="neutral">No visits or leads in this range.</Notice>
      ) : (
        <Table
          head={
            <>
              <th className={TH}>Source / medium</th>
              <th className={THN}>Visits</th>
              <th className={THN}>Leads</th>
              <th className={THN}>of which forms</th>
              <th className={THN}>Leads / visit</th>
            </>
          }
        >
          {rows.map((r) => (
            <tr key={`${r.source}/${r.medium}`}>
              <td className={TD}>
                <span className="font-medium">{r.source}</span>
                <span className="text-neutral-400"> / {r.medium}</span>
              </td>
              <td className={TDN}>{n(r.visits)}</td>
              <td className={TDN}>{r.leads ? n(r.leads) : <span className="text-neutral-300">0</span>}</td>
              <td className={TDN}>{r.forms ? n(r.forms) : <span className="text-neutral-300">0</span>}</td>
              <td className={TDN}>{pct(r.conversion)}</td>
            </tr>
          ))}
          <tr className="font-semibold">
            <td className={TD}>Total</td>
            <td className={TDN}>{n(data.totals?.visits)}</td>
            <td className={TDN}>{n(data.leadsTotal)}</td>
            <td className={TDN}>{n(data.formsTotal)}</td>
            <td className={TDN}>{pct(data.totals?.visits ? data.leadsTotal / data.totals.visits : null)}</td>
          </tr>
        </Table>
      )}
    </Card>
  )
}

// ---------------------------------------------------------------------------
// b. Landing pages → leads → queries
// ---------------------------------------------------------------------------

function QueryList({ queries }: { queries: PageQueryStat[] | null }) {
  if (queries === null) return <span className="text-neutral-300">{DASH}</span>
  if (queries.length === 0) return <span className="text-xs text-neutral-300">no Search Console rows</span>
  return (
    <ul className="space-y-0.5 text-xs">
      {queries.map((q) => (
        <li key={q.query} className="flex gap-2">
          <span className="min-w-0 flex-1 truncate" title={q.query}>
            {q.query}
          </span>
          <span className="shrink-0 tabular-nums text-neutral-500">
            {n(q.clicks)} cl · {n(q.impressions)} imp · pos {pos(q.position)}
          </span>
        </li>
      ))}
    </ul>
  )
}

function LandingTable({ rows }: { rows: LandingRow[] }) {
  return (
    <Table
      head={
        <>
          <th className={TH}>Landing page</th>
          <th className={THN}>Visits</th>
          <th className={THN}>Leads</th>
          <th className={`${TH} w-[42%]`}>Top Search Console queries</th>
        </>
      }
    >
      {rows.map((r) => (
        <tr key={r.path}>
          <td className={`${TD} max-w-[22rem]`}>
            <PathLink path={r.path} />
          </td>
          <td className={TDN}>{n(r.visits)}</td>
          <td className={TDN}>
            {r.leads ? (
              <>
                {n(r.leads)}
                {r.forms ? <span className="text-neutral-400"> ({r.forms} f)</span> : null}
              </>
            ) : (
              <span className="text-neutral-300">0</span>
            )}
          </td>
          <td className={TD}>
            <QueryList queries={r.queries} />
          </td>
        </tr>
      ))}
    </Table>
  )
}

export function LandingSection({ data }: { data: PanelData }) {
  return (
    <Card
      id="landings"
      title="Landing pages → leads → queries"
      note="A lead counts for the page its visit started on. (n f) = form leads."
    >
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <div>
          <h3 className="mb-2 text-sm font-semibold text-neutral-700">Top by visits</h3>
          {data.landingByVisits === null ? (
            <DbMissing data={data} what="visits" />
          ) : data.landingByVisits.length === 0 ? (
            <Notice tone="neutral">No visits recorded in this range yet.</Notice>
          ) : (
            <LandingTable rows={data.landingByVisits} />
          )}
        </div>
        <div>
          <h3 className="mb-2 text-sm font-semibold text-neutral-700">Top by leads</h3>
          {data.landingByLeads.length === 0 ? (
            <Notice tone="neutral">No leads in this range.</Notice>
          ) : (
            <LandingTable rows={data.landingByLeads} />
          )}
        </div>
      </div>
    </Card>
  )
}

// ---------------------------------------------------------------------------
// c. Search queries
// ---------------------------------------------------------------------------

function QueryTable({ rows }: { rows: TopQuery[] }) {
  return (
    <Table
      head={
        <>
          <th className={TH}>Query</th>
          <th className={THN}>Clicks</th>
          <th className={THN}>Impr.</th>
          <th className={THN}>CTR</th>
          <th className={THN}>Pos.</th>
          <th className={TH}>Best page</th>
        </>
      }
    >
      {rows.map((q) => (
        <tr key={q.query}>
          <td className={`${TD} max-w-[16rem]`}>
            <span className="block truncate" title={q.query}>
              {q.query}
            </span>
          </td>
          <td className={TDN}>{n(q.clicks)}</td>
          <td className={TDN}>{n(q.impressions)}</td>
          <td className={TDN}>{pct(q.impressions ? q.clicks / q.impressions : null)}</td>
          <td className={TDN}>{pos(q.position)}</td>
          <td className={`${TD} max-w-[16rem]`}>{q.bestPage ? <PathLink path={q.bestPage} /> : DASH}</td>
        </tr>
      ))}
    </Table>
  )
}

export function QueriesSection({ data }: { data: PanelData }) {
  let body: ReactNode
  if (!data.db.ok) body = <DbMissing data={data} what="Search Console queries" />
  else if (!data.gsc.hasData)
    body = data.gsc.configured ? (
      <Notice tone="neutral">
        No Search Console rows yet. The import runs nightly at 03:30 UTC; the first nights backfill 16 months, newest
        first.
      </Notice>
    ) : (
      <Notice>Search Console import not configured yet. See the status box below.</Notice>
    )
  else
    body = (
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <div>
          <h3 className="mb-2 text-sm font-semibold text-neutral-700">By clicks</h3>
          <QueryTable rows={data.queriesByClicks ?? []} />
        </div>
        <div>
          <h3 className="mb-2 text-sm font-semibold text-neutral-700">By impressions</h3>
          <QueryTable rows={data.queriesByImpressions ?? []} />
        </div>
      </div>
    )
  return (
    <Card
      id="queries"
      title="Search queries"
      note="Google Search Console, web search. The last 2–3 days are always missing (Google publishes with a lag)."
    >
      {body}
    </Card>
  )
}

// ---------------------------------------------------------------------------
// d. Weekly trend
// ---------------------------------------------------------------------------

export function WeeklySection({ data }: { data: PanelData }) {
  const rows: WeekRow[] = data.weeks
  return (
    <Card id="weekly" title="Weekly trend" note="ISO weeks, Monday to Sunday, UTC. The first and last week may be partial.">
      {!data.db.ok ? (
        <div className="mb-3">
          <DbMissing data={data} what="visits and Search Console clicks" />
        </div>
      ) : null}
      <Table
        head={
          <>
            <th className={TH}>Week</th>
            <th className={THN}>Visits</th>
            <th className={THN}>Leads</th>
            <th className={THN}>Leads / visit</th>
            <th className={THN}>GSC clicks</th>
            <th className={THN}>GSC impressions</th>
          </>
        }
      >
        {rows.map((w) => (
          <tr key={w.week}>
            <td className={`${TD} whitespace-nowrap`}>
              <span className="font-medium">W{isoWeekNumber(w.week)}</span>
              <span className="text-neutral-400"> · from {w.week}</span>
            </td>
            <td className={TDN}>{n(w.visits)}</td>
            <td className={TDN}>{n(w.leads)}</td>
            <td className={TDN}>{pct(w.visits ? w.leads / w.visits : null)}</td>
            <td className={TDN}>{n(w.clicks)}</td>
            <td className={TDN}>{n(w.impressions)}</td>
          </tr>
        ))}
      </Table>
    </Card>
  )
}

// ---------------------------------------------------------------------------
// e. Listings by popularity
// ---------------------------------------------------------------------------

function PopularTable({
  rows,
  metric,
  label,
}: {
  rows: PopularListing[]
  metric: (r: PopularListing) => number | null
  label: string
}) {
  if (rows.length === 0) return <Notice tone="neutral">Nothing counted yet.</Notice>
  return (
    <Table
      head={
        <>
          <th className={THN}>#</th>
          <th className={TH}>Listing</th>
          <th className={THN}>{label}</th>
        </>
      }
    >
      {rows.map((r, i) => (
        <tr key={r.slug}>
          <td className={`${TDN} text-neutral-400`}>{i + 1}</td>
          <td className={`${TD} max-w-[18rem]`}>
            <a
              href={`/en/property/${encodeURIComponent(r.slug)}`}
              target="_blank"
              rel="noreferrer"
              className="block truncate hover:underline"
              title={r.title ?? r.slug}
            >
              {r.title ?? r.slug}
            </a>
            <span className="block truncate font-mono text-[11px] text-neutral-400">{r.slug}</span>
          </td>
          <td className={TDN}>{n(metric(r))}</td>
        </tr>
      ))}
    </Table>
  )
}

export function PopularitySection({ data }: { data: PanelData }) {
  const p = data.popularity
  return (
    <Card
      id="popularity"
      title="Listings by popularity"
      note="Server-side view counters in Sanity (people, not crawlers). Not limited by the range above."
    >
      {!p ? (
        <Notice tone="red">View counters unavailable (Sanity token missing or the query failed).</Notice>
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div>
            <h3 className="mb-2 text-sm font-semibold text-neutral-700">Last 7 days</h3>
            {p.hasRolling ? (
              <PopularTable rows={p.by7d} metric={(r) => r.views7d} label="7 days" />
            ) : (
              <Notice tone="neutral">Rolling 7-day counts are not recorded yet.</Notice>
            )}
          </div>
          <div>
            <h3 className="mb-2 text-sm font-semibold text-neutral-700">All time</h3>
            <PopularTable rows={p.byAllTime} metric={(r) => r.allTime} label="Views" />
          </div>
          <div>
            <h3 className="mb-2 text-sm font-semibold text-neutral-700">Likes</h3>
            {p.hasLikes ? (
              <PopularTable rows={p.byLikes} metric={(r) => r.likes} label="Likes" />
            ) : (
              <Notice tone="neutral">Likes are not recorded yet.</Notice>
            )}
          </div>
        </div>
      )}
    </Card>
  )
}

// ---------------------------------------------------------------------------
// f. UTM link builder
// ---------------------------------------------------------------------------

export function UtmSection() {
  return (
    <Card id="utm" title="Campaign link builder" note="Tag every link you post, so its visits and leads get their own row.">
      <UtmBuilder />
    </Card>
  )
}

// ---------------------------------------------------------------------------
// g. Status
// ---------------------------------------------------------------------------

function StatusLine({ ok, label, children }: { ok: boolean; label: string; children: ReactNode }) {
  return (
    <li className="flex gap-3">
      <span
        className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${ok ? 'bg-emerald-500' : 'bg-amber-500'}`}
        aria-hidden
      />
      <div className="min-w-0">
        <span className="font-medium">{label}</span> <span className="text-neutral-600">{children}</span>
      </div>
    </li>
  )
}

export function StatusSection({ data }: { data: PanelData }) {
  const s = data.status
  return (
    <Card id="status" title="Status">
      <ul className="space-y-2 text-sm">
        <StatusLine ok={data.db.ok} label="Database:">
          {data.db.ok ? (
            <>
              connected. {n(s?.visitRows)} visit rows, {n(s?.pageviewRows)} page-view rows, {n(s?.gscRows)} Search
              Console rows{s ? `, ${bytes(s.databaseBytes)} in total` : ''}.
            </>
          ) : data.db.configured ? (
            <>configured, but it does not answer: {data.db.error}</>
          ) : (
            <>
              not connected. Vercel → Storage → Create Database → Neon (free) → connect it to this project; that sets{' '}
              <code className="font-mono">DATABASE_URL</code>. Redeploy afterwards.
            </>
          )}
        </StatusLine>
        <StatusLine ok={data.gsc.configured} label="Search Console:">
          {data.gsc.configured ? (
            <>
              key present for <code className="font-mono">{data.gsc.siteUrl}</code>
              {s?.gscFirstDay ? `; data from ${s.gscFirstDay} to ${s.gscLastDay}` : '; no rows imported yet'}.
            </>
          ) : (
            <>
              not configured. Add the service-account JSON key as{' '}
              <code className="font-mono">GSC_SERVICE_ACCOUNT_JSON</code> (steps in docs/analytics/OWN-ANALYTICS.md).
            </>
          )}
        </StatusLine>
        <StatusLine ok={data.sanity.ok} label="Leads (Sanity):">
          {data.sanity.ok ? `${n(data.leadsTotal)} in this range.` : data.sanity.error}
        </StatusLine>
      </ul>
      <p className="mt-3 text-xs text-neutral-500">
        Your own browsing counts as visits unless this browser is flagged: open the site once with{' '}
        <code className="font-mono">?domlivo_internal=1</code>.
      </p>

      {s && s.log.length > 0 ? (
        <div className="mt-4">
          <h3 className="mb-2 text-sm font-semibold text-neutral-700">Last imports</h3>
          <Table
            head={
              <>
                <th className={TH}>When (UTC)</th>
                <th className={TH}>Job</th>
                <th className={TH}>Result</th>
                <th className={TH}>Detail</th>
              </>
            }
          >
            {s.log.map((l, i) => (
              <tr key={`${l.ranAt}-${l.job}-${i}`}>
                <td className={`${TD} whitespace-nowrap tabular-nums`}>{l.ranAt}</td>
                <td className={TD}>{l.job}</td>
                <td className={TD}>
                  {l.ok ? <span className="text-emerald-700">ok</span> : <span className="text-red-700">failed</span>}
                </td>
                <td className={`${TD} max-w-[40rem]`}>
                  <span className="block truncate font-mono text-[11px] text-neutral-500" title={l.detail}>
                    {l.detail}
                  </span>
                </td>
              </tr>
            ))}
          </Table>
        </div>
      ) : data.db.ok ? (
        <p className="mt-3 text-xs text-neutral-500">No imports logged yet.</p>
      ) : null}
    </Card>
  )
}
