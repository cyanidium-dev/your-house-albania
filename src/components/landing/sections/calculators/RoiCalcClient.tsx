'use client'

import * as React from 'react'
import { useTranslations } from 'next-intl'
import { calculateRoi } from '@/lib/calculators/roi'
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
      className={
        'rounded-full px-4 py-2 text-sm font-semibold transition-colors ' +
        (rentalType === value
          ? 'bg-primary text-white'
          : 'ring-1 ring-dark/15 text-dark/70 hover:text-dark dark:ring-white/15 dark:text-white/70 dark:hover:text-white')
      }
    >
      {label}
    </button>
  )

  const inputs = (
    <>
      {presets.length > 0 ? (
        <label className="block">
          <span className="mb-1 flex items-center gap-2 text-xs font-medium text-dark/70 dark:text-white/80">
            {t('presetLabel')}
            {confidence ? (
              <ConfidenceDot level={confidence} label={confidenceLabel(confidence)} />
            ) : null}
          </span>
          <select
            value={presetKey}
            onChange={(e) => setPresetKey(e.target.value)}
            className="h-11 w-full rounded-full border border-black/10 px-5 text-sm outline-primary focus:outline dark:border-white/10 bg-transparent text-dark dark:text-white dark:[&>option]:bg-dark"
          >
            {presets.map((p) => (
              <option key={p.key} value={p.key}>
                {p.label}
              </option>
            ))}
            <option value="">{t('manualMode')}</option>
          </select>
        </label>
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
        valueDisplay={`€${new Intl.NumberFormat(locale).format(Math.min(Math.max(priceNum, PRICE_MIN), PRICE_MAX))}`}
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
                  <CalcBreakdownRow
                    label={`${t('managementCost')} (${formatPct(effective.mgmtFeePct, locale, 0)})`}
                  >
                    −<CalcMoney amountEur={result.mgmtFeeEur} locale={locale} />
                  </CalcBreakdownRow>
                  <CalcBreakdownRow label={`${t('taxCost')} (${formatPct(taxRatePct, locale, 0)})`}>
                    −<CalcMoney amountEur={result.taxEur} locale={locale} />
                  </CalcBreakdownRow>
                  <CalcBreakdownRow label={t('netIncome')} strong>
                    <CalcMoney amountEur={result.netAnnualEur} locale={locale} />
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
