import { getTranslations } from 'next-intl/server';
import { QuickLeadForm } from '@/components/shared/QuickLead/QuickLeadForm';
import { PANEL, SPLIT, SPLIT_ASIDE, SPLIT_MAIN } from '@/components/shared/layout';

/**
 * What a sold listing offers instead of its contact buttons: a one-field
 * request to be sent similar listings. Sits right under the gallery, so the
 * visitor who arrived from an old link sees the way forward before the
 * details of a flat they can no longer buy. Every "find a similar one" button
 * on the page points here (`#similar-request`).
 */
export async function SoldSimilarRequest({
  locale,
  propertySlug,
}: {
  locale: string;
  propertySlug: string;
}) {
  const t = await getTranslations('Shared.propertyDetail');
  return (
    <section id="similar-request" className={`${PANEL} mt-8 scroll-mt-28 p-6 sm:p-8`}>
      <div className={`${SPLIT} items-start`}>
        <div className={SPLIT_ASIDE}>
          <span className="inline-flex items-center rounded bg-red-600 px-2 py-1 text-xs font-semibold text-white">
            {t('sold')}
          </span>
          <h2 className="mt-3 text-2xl font-medium leading-tight tracking-tight text-dark text-balance dark:text-white">
            {t('soldLeadTitle')}
          </h2>
          <p className="mt-2 text-dark/70 dark:text-white/70">{t('soldLeadBody')}</p>
        </div>
        <div className={SPLIT_MAIN}>
          <QuickLeadForm
            locale={locale}
            sourceLabel={`sold-similar:${propertySlug}`}
            placement="property"
            withName
            withMessage
            stacked
            submitLabel={t('soldFindSimilar')}
          />
        </div>
      </div>
    </section>
  );
}
