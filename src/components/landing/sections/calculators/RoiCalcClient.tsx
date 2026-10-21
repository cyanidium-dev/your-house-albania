'use client'

import * as React from 'react'
import { formatNumber } from '@/lib/currency/format'
import { segmentedItemClass } from '@/components/shared/Segmented'
import { useTranslations } from 'next-intl'
import { calculateRoi } from '@/lib/calculators/roi'
import { FilterSelect } from '@/components/catalog/FilterSelect'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import {
  asConfidenceLevel,
  ConfidenceDot,
  type ConfidenceLevel,
} from '@/components/landing/sections/impl/ConfidenceDot'
import {
  CalcBreakdownRow,
  CalcEmptyState,
  CalcLayout,
  CalcMoney,
  CalcNumberInput,
  CalcResultsCard,
  CalcResultStat,
  CalcSliderField,
  formatPct,
} from './CalcUi'

const PRICE_MIN = 20_000
const PRICE_MAX = 2_000_000
const PRICE_STEP = 5_000
/** Listbox value of the manual-input row (the state keeps '' for it). */
const MANUAL_KEY = '__manual'

export type RoiPreset = {
  key: string
  /** Already localized on the server. */
  label: string
  rentalType: 'ltr' | 'str'
  monthlyRentEur?: number
  adrEur?: number
  occupancyPct?: number
  seasonNightsCap?: number
  mgmtFeePct?: number
  confidence?: string
}

export function RoiCalcClient({
  locale,
  presets,
  taxRatePct,
}: {
  locale: string
  presets: RoiPreset[]
  taxRatePct: number
}) {
  const t = useTranslations('Calculators')
  const tLanding = useTranslations('Landing')

  // '' = manual mode; otherwise a preset key.
  const [presetKey, setPresetKey] = React.useState<string>(presets[0]?.key ?? '')
  const activePreset = presets.find((p) => p.key === presetKey) ?? null

  const [price, setPrice] = React.useState<number | ''>(120_000)
  const [rentalType, setRentalType] = React.useState<'ltr' | 'str'>(
    activePreset?.rentalType ?? 'ltr',
  )
  const [monthlyRent, setMonthlyRent] = React.useState<number | ''>(600)
  const [adr, setAdr] = React.useState<number | ''>(80)
  const [occupancy, setOccupancy] = React.useState<number>(60)
  const [nightsCap, setNightsCap] = React.useState<number | ''>('')
  const [mgmtFee, setMgmtFee] = React.useState<number>(20)

  // Preset selection overrides manual fields (manual mode keeps user values).
  const effective = activePreset
    ? {
        rentalType: activePreset.rentalType,
        monthlyRentEur: activePreset.monthlyRentEur ?? 0,
        adrEur: activePreset.adrEur ?? 0,
        occupancyPct: activePreset.occupancyPct ?? 0,
        seasonNightsCap: activePreset.seasonNightsCap,
        mgmtFeePct: activePreset.mgmtFeePct ?? 20,
      }
    : {
        rentalType,
        monthlyRentEur: typeof monthlyRent === 'number' ? monthlyRent : 0,
        adrEur: typeof adr === 'number' ? adr : 0,
        occupancyPct: occupancy,
        seasonNightsCap: typeof nightsCap === 'number' ? nightsCap : undefined,
        mgmtFeePct: mgmtFee,
      }

  const priceNum = typeof price === 'number' ? price : 0
  const result =
    priceNum > 0
      ? calculateRoi({
          priceEur: priceNum,
          rentalType: effective.rentalType,
          monthlyRentEur: effective.monthlyRentEur,
          adrEur: effective.adrEur,
          occupancyPct: effective.occupancyPct,
          seasonNightsCap: effective.seasonNightsCap,
          mgmtFeePct: effective.mgmtFeePct,
          taxRatePct,
        })
      : null

  const confidence: ConfidenceLevel | null = asConfidenceLevel(activePreset?.confidence)
  const confidenceLabel = (level: ConfidenceLevel) =>
    level === 'high'
      ? tLanding('confidenceHigh')
      : level === 'medium'
        ? tLanding('confidenceMedium')
        : tLanding('confidenceLow')

  const typeButton = (value: 'ltr' | 'str', label: string) => (
    <button
      type="button"
      onClick={() => setRentalType(value)}
      aria-pressed={rentalType === value}
      className={segmentedItemClass(rentalType === value)}
    >
      {label}
    </button>
  )

  const inputs = (
    <>
      {presets.length > 0 ? (
        // The site's own listbox, not a native <select>: the OS draws that
        // popup (white list, system font) over the dark theme.
        <FilterSelect
          label={t('presetLabel')}
          labelExtra={
            confidence ? <ConfidenceDot level={confidence} label={confidenceLabel(confidence)} /> : null
          }
          value={presetKey === '' ? MANUAL_KEY : presetKey}
          onValueChange={(v) => setPresetKey(v === MANUAL_KEY ? '' : v)}
          options={[
            ...presets.map((p) => ({ value: p.key, label: p.label })),
            { value: MANUAL_KEY, label: t('manualMode') },
          ]}
          includeAnyOption={false}
          anyLabel={t('manualMode')}
          radius="full"
          className="h-11 px-5"
        />
      ) : null}

      <CalcNumberInput
        label={t('propertyPrice')}
        value={price}
        onChange={setPrice}
        locale={locale}
        min={0}
        suffix="€"
      />
      <CalcSliderField
        label={t('propertyPrice')}
        valueDisplay={`€${formatNumber(Math.min(Math.max(priceNum, PRICE_MIN), PRICE_MAX), locale)}`}
        min={PRICE_MIN}
        max={PRICE_MAX}
        step={PRICE_STEP}
        value={Math.min(Math.max(priceNum || PRICE_MIN, PRICE_MIN), PRICE_MAX)}
        onValueChange={(v) => setPrice(v)}
      />

      {!activePreset ? (
        <>
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-dark/70 dark:text-white/80">
              {t('rentalType')}:
            </span>
            {typeButton('ltr', t('ltr'))}
            {typeButton('str', t('str'))}
          </div>
          {rentalType === 'ltr' ? (
            <CalcNumberInput
              label={t('monthlyRent')}
              value={monthlyRent}
              onChange={setMonthlyRent}
              locale={locale}
              min={0}
              suffix="€"
            />
          ) : (
            <>
              <CalcNumberInput
                label={t('adr')}
                value={adr}
                onChange={setAdr}
                locale={locale}
                min={0}
                suffix="€"
              />
              <CalcSliderField
                label={t('occupancy')}
                valueDisplay={formatPct(occupancy, locale, 0)}
                min={0}
                max={100}
                step={1}
                value={occupancy}
                onValueChange={setOccupancy}
              />
              <CalcNumberInput
                label={t('nightsCap')}
                value={nightsCap}
                onChange={setNightsCap}
                locale={locale}
                min={1}
                max={365}
              />
            </>
          )}
          <CalcSliderField
            label={t('mgmtFee')}
            valueDisplay={formatPct(mgmtFee, locale, 0)}
            min={0}
            max={50}
            step={1}
            value={mgmtFee}
            onValueChange={setMgmtFee}
          />
        </>
      ) : null}
    </>
  )

  const results = (
    <CalcResultsCard>
      {result ? (
        <>
          <CalcResultStat
            primary
            animateKey={result.netYieldPct.toFixed(2)}
            value={formatPct(result.netYieldPct, locale, 2)}
            label={t('netYield')}
          />
          <div className="grid grid-cols-2 gap-4 border-t border-dark/10 dark:border-white/10 pt-4">
            <CalcResultStat
              animateKey={result.grossYieldPct.toFixed(2)}
              value={formatPct(result.grossYieldPct, locale, 2)}
              label={t('grossYield')}
            />
            <CalcResultStat
              animateKey={Math.round(result.netAnnualEur)}
              value={<CalcMoney amountEur={result.netAnnualEur} locale={locale} />}
              label={t('netIncomePerYear')}
            />
          </div>
          <Accordion type="single" collapsible>
            <AccordionItem value="breakdown">
              <AccordionTrigger className="p-3 text-sm bg-transparent dark:bg-transparent ring-1 ring-dark/10 dark:ring-white/10">
                {t('breakdown')}
              </AccordionTrigger>
              <AccordionContent className="px-0 pt-2">
                <dl className="flex flex-col text-sm">
                  <CalcBreakdownRow label={t('grossIncome')}>
                    <CalcMoney amountEur={result.grossAnnualEur} locale={locale} />
                  </CalcBreakdownRow>
                  {result.nightsUsed !== undefined ? (
                    <CalcBreakdownRow label={t('nightsUsed')}>{result.nightsUsed}</CalcBreakdownRow>
                  ) : null}
                  <CalcBreakdownRow label={effective.rentalType === 'str' ? t('letCostsStr') : t('letCostsLtr')}>
                    −<CalcMoney amountEur={result.letCostsEur} locale={locale} />
                  </CalcBreakdownRow>
                  {result.mgmtFeeEur > 0 ? (
                    <CalcBreakdownRow
                      label={`${t('managementCost')} (${formatPct(effective.mgmtFeePct, locale, 0)})`}
                    >
                      −<CalcMoney amountEur={result.mgmtFeeEur} locale={locale} />
                    </CalcBreakdownRow>
                  ) : null}
                  <CalcBreakdownRow
                    label={effective.rentalType === 'str' ? t('runningCostsStr') : t('runningCostsLtr')}
                  >
                    −<CalcMoney amountEur={result.runningCostsEur} locale={locale} />
                  </CalcBreakdownRow>
                  <CalcBreakdownRow label={`${t('taxCost')} (${formatPct(taxRatePct, locale, 0)})`}>
                    −<CalcMoney amountEur={result.taxEur} locale={locale} />
                  </CalcBreakdownRow>
                  <CalcBreakdownRow label={t('netIncome')} strong>
                    <CalcMoney amountEur={result.netAnnualEur} locale={locale} />
                  </CalcBreakdownRow>
                  <CalcBreakdownRow label={t('totalInvested')}>
                    <CalcMoney amountEur={result.totalInvestedEur} locale={locale} />
                  </CalcBreakdownRow>
                </dl>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </>
      ) : (
        <CalcEmptyState text={t('enterPrice')} />
      )}
    </CalcResultsCard>
  )

  return <CalcLayout inputs={inputs} results={results} />
}
