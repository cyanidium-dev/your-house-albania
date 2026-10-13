import Link from '@/components/shared/Link'
import { redirect } from 'next/navigation'
import { getEditorSession } from '@/features/editor/auth/getEditorSession'
import { EditorIndexHeader } from '@/features/editor/components/EditorIndexHeader'
import { parseDays, RANGE_OPTIONS } from '@/features/editor/analytics/aggregate'
import {
  LandingSection,
  PopularitySection,
  QueriesSection,
  SourcesSection,
  StatusSection,
  UtmSection,
  WeeklySection,
} from '@/features/editor/analytics/AnalyticsSections'
import { loadAnalytics } from '@/features/editor/analytics/loadAnalytics'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Analytics · Domlivo Editor',
  robots: { index: false, follow: false },
}

/**
 * Private analytics panel: which sources, landing pages and search queries
 * bring visits and leads. Visits come from our own store
 * (`src/lib/analyticsStore`), leads from Sanity, queries from the nightly
 * Search Console import. Behind the editor password like every /editor page.
 */
export default async function EditorAnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<{ days?: string | string[] }>
}) {
  const session = await getEditorSession()
  if (!session.authenticated) {
    redirect('/editor/login?next=/editor/analytics')
  }

  const { days: daysParam } = await searchParams
  const days = parseDays(daysParam)
  const data = await loadAnalytics(days)

  return (
    <>
      <EditorIndexHeader title="Analytics" />
      <main className="mx-auto flex w-full max-w-7xl flex-col gap-5 px-4 py-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Analytics</h1>
            <p className="mt-1 text-sm text-neutral-500">
              {data.from} to {data.today} (UTC) · {data.totals ? `${data.totals.visits.toLocaleString('en-US')} visits · ` : ''}
              {data.totals ? `${data.totals.pageviews.toLocaleString('en-US')} page views · ` : ''}
              {data.leadsTotal.toLocaleString('en-US')} leads ({data.formsTotal.toLocaleString('en-US')} forms)
            </p>
          </div>
          <nav aria-label="Range" className="inline-flex rounded-full border border-neutral-200 bg-white p-0.5 text-sm">
            {RANGE_OPTIONS.map((d) => (
              <Link
                key={d}
                href={`/editor/analytics?days=${d}`}
                aria-current={d === days ? 'page' : undefined}
                className={`rounded-full px-3 py-1 font-medium transition ${
                  d === days ? 'bg-neutral-900 text-white' : 'text-neutral-600 hover:bg-neutral-100'
                }`}
              >
                {d} days
              </Link>
            ))}
          </nav>
        </div>

        <SourcesSection data={data} />
        <LandingSection data={data} />
        <QueriesSection data={data} />
        <WeeklySection data={data} />
        <PopularitySection data={data} />
        <UtmSection />
        <StatusSection data={data} />
      </main>
    </>
  )
}
