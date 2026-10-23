import { getTranslations } from 'next-intl/server'
import Link from '@/components/shared/Link'
import { QuickLeadForm } from '@/components/shared/QuickLead/QuickLeadForm'
import { CaptureClickTracker } from '@/components/capture/CaptureClickTracker'
import { PANEL, Section, SPLIT, SPLIT_ASIDE, SPLIT_MAIN, SECTION_TITLE } from '@/components/shared/layout'
import { fetchDistrictSalePrices } from '@/lib/sanity/queries/catalog'
import { budgetBandQuery, liveBudgetBands } from '@/lib/catalog/budgetBands'
import { buildListingUrl } from '@/lib/routes/catalog'

/**
 * "Find one in this district": budget chips into the district's catalogue and
 * the quick lead form — district pages are where the form leads come from.
 * A chip appears only for a band the district has listings in today, so none
 * opens an empty catalogue; the count on it is the catalogue's own.
 * Server-rendered below the hero.
 */
export async function DistrictFindBlock({
  locale,
  countrySlug,
  citySlug,
  districtSlug,
}: {
  locale: string
  countrySlug: string
  citySlug: string
  districtSlug: string
}) {
  const [t, tQuick, rows] = await Promise.all([
    getTranslations({ locale, namespace: 'Capture.district' }),
    getTranslations({ locale, namespace: 'QuickLead' }),
    fetchDistrictSalePrices(citySlug, districtSlug),
  ])
  const bands = liveBudgetBands(rows)
  return (
    <Section aria-labelledby="district-find">
      <div className={`${SPLIT} items-start`}>
        <div className={SPLIT_ASIDE}>
          <h2 id="district-find" className={SECTION_TITLE}>
            {t('title')}
          </h2>
          {bands.length > 0 ? (
            <CaptureClickTracker block="district-budget" placement="catalog" className="mt-6">
              <ul className="flex flex-wrap gap-2.5" aria-label={t('budgetLabel')}>
                {bands.map((band) => (
                  <li key={band.key}>
                    <Link
                      href={buildListingUrl({
                        scope: 'catalog',
                        locale,
                        country: countrySlug,
                        city: citySlug,
                        district: districtSlug,
                        dealQuery: 'sale',
                        query: budgetBandQuery(band),
                      })}
                      className="inline-flex min-h-11 items-center gap-2 rounded-full border border-dark/15 px-4 text-sm font-medium text-dark transition-colors hover:border-primary hover:text-primary dark:border-white/20 dark:text-white"
                    >
                      {t(`bands.${band.key}`)}
                      <span className="text-dark/50 tabular-nums dark:text-white/50">{band.count}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </CaptureClickTracker>
          ) : null}
        </div>
        <div className={`${SPLIT_MAIN} ${PANEL} p-4 sm:p-8`} data-lead-placement="catalog">
          <p className="text-xl font-medium text-dark dark:text-white">{tQuick('heading')}</p>
          <p className="mt-2 text-sm text-dark/70 dark:text-white/70">{tQuick('body')}</p>
          <QuickLeadForm
            locale={locale}
            sourceLabel={`district:${districtSlug}`}
            placement="catalog"
            stacked
            className="mt-5"
          />
        </div>
      </div>
    </Section>
  )
}
