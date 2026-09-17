/**
 * Monthly running cost of an apartment in Albania — pure module, no React.
 *
 * A TypeScript port of the research repo's calculation engine
 * (`12-ai-database/data/calc_engine.py`, ROI-v1). Every default below is a
 * stored fact and carries its `dataId`, so an answer can show not just the
 * number but where each input came from; a visitor's own figure overrides the
 * default without changing the shape of the citation.
 *
 * Two things this model exists to get right, because both are easy to get
 * wrong by hand:
 *  - the electricity cliff at 700 kWh/month, which re-prices the *whole*
 *    month rather than the excess;
 *  - air conditioning, where the nameplate rating is roughly double what an
 *    inverter actually draws once the room is at temperature.
 */

/** Bank of Albania official fixing, 2026-09-09. Fact DATA-MACRO-FX-0001. */
export const ALL_PER_EUR = 92.02

/** ERE decision 322 of 15.12.2025, in force 1 Jan – 31 Dec 2026. */
export const ELECTRICITY = {
  /** lek/kWh incl. 20% VAT, monthly consumption ≤ 700 kWh. DATA-ELEC-0001/0003. */
  lowBandAll: 10.2,
  /** lek/kWh incl. VAT applied to the entire month once it reaches 701 kWh. DATA-ELEC-0002. */
  highBandAll: 11.4,
  /** The cliff, in kWh per month. DATA-ELEC-0002. */
  thresholdKwh: 700,
} as const

export type UtilityCity =
  | 'durres'
  | 'golem'
  | 'tirana'
  | 'vlore'
  | 'himare'
  | 'sarande'
  | 'shengjin'

/** ERRU-approved household tariffs in force 2026. DATA-WATER-0001…0009. */
const WATER_TARIFFS: Record<UtilityCity, { waterAll: number; sewerAll: number; fixedAll: number }> = {
  durres: { waterAll: 70, sewerAll: 50, fixedAll: 200 },
  golem: { waterAll: 50, sewerAll: 30, fixedAll: 200 },
  tirana: { waterAll: 65, sewerAll: 11, fixedAll: 200 },
  vlore: { waterAll: 60, sewerAll: 17, fixedAll: 200 },
  himare: { waterAll: 55, sewerAll: 30, fixedAll: 200 },
  sarande: { waterAll: 60, sewerAll: 25, fixedAll: 200 },
  shengjin: { waterAll: 65, sewerAll: 19, fixedAll: 200 },
}

/**
 * Municipal cleaning tariff per household per year, lek. Tirana and Vlorë are
 * sourced (DATA-WASTE-0001/0002); Durrës, Golem, Sarandë and Shëngjin are an
 * estimate by analogy (DATA-WASTE-CALC-0001) because those municipalities have
 * not published their 2026 package.
 */
const WASTE_YEAR_ALL: Record<UtilityCity, number> = {
  durres: 3500,
  golem: 3500,
  tirana: 5004,
  vlore: 3300,
  himare: 3500,
  sarande: 3600,
  shengjin: 3500,
}

const WASTE_IS_ESTIMATE: Record<UtilityCity, boolean> = {
  durres: true,
  golem: true,
  tirana: false,
  vlore: false,
  himare: true,
  sarande: true,
  shengjin: true,
}

/**
 * The facts each line is actually built from, per city.
 *
 * Citing a fixed list would point a Durrës answer at Tirana's water tariff and
 * at Tirana's waste package — the numbers would be right and the sources wrong,
 * which is worse than no citation at all, because it looks checked.
 */
const WATER_FACT_IDS: Record<UtilityCity, string[]> = {
  durres: ['DATA-WATER-0001', 'DATA-WATER-0002', 'DATA-WATER-0003'],
  golem: ['DATA-WATER-0005'],
  tirana: ['DATA-WATER-0006'],
  vlore: ['DATA-WATER-0007'],
  himare: ['DATA-WATER-0010'],
  sarande: ['DATA-WATER-0008'],
  shengjin: ['DATA-WATER-0009'],
}

const WASTE_FACT_IDS: Record<UtilityCity, string[]> = {
  tirana: ['DATA-WASTE-0001'],
  vlore: ['DATA-WASTE-0002'],
  sarande: ['DATA-WASTE-0004'],
  // No 2026 municipal package published for these; the model uses the estimate
  // by analogy and says so.
  durres: ['DATA-WASTE-CALC-0001'],
  himare: ['DATA-WASTE-CALC-0001'],
  golem: ['DATA-WASTE-CALC-0001'],
  shengjin: ['DATA-WASTE-CALC-0001'],
}

/** Heating and cooling months per city, for annualising a seasonal figure. */
export const SEASON_MONTHS: Record<UtilityCity, { heating: number; cooling: number }> = {
  durres: { heating: 4, cooling: 3.5 },
  golem: { heating: 4, cooling: 3.5 },
  tirana: { heating: 5, cooling: 4 },
  vlore: { heating: 3, cooling: 3.5 },
  himare: { heating: 3, cooling: 4 },
  sarande: { heating: 3, cooling: 4 },
  shengjin: { heating: 4.5, cooling: 3 },
}

/**
 * Rated electrical input by unit size, kW. Derived from the capacity on the
 * datasheets sold in Albania divided by a nominal EER 3.4 / COP 3.8, because
 * retailer pages print capacity and mislabel input (DATA-AC-0001, DATA-AC-CALC-0001/0002).
 */
const AC_INPUT_KW: Record<number, { cooling: number; heating: number }> = {
  9000: { cooling: 0.77, heating: 0.79 },
  12000: { cooling: 1.03, heating: 1.0 },
  18000: { cooling: 1.5, heating: 1.53 },
  24000: { cooling: 2.03, heating: 1.87 },
}

/**
 * Share of rated input an inverter actually draws over an operating hour once
 * the room is at temperature. Field studies put an inverter 36–49% below a
 * fixed-speed unit of the same size (DATA-AC-0005, DATA-AC-0006); heating draws
 * more because the outdoor coil is colder and defrost cycles cost.
 * DATA-AC-CALC-0003/0004.
 */
const AC_DRAW_FACTOR = { cooling: 0.5, heating: 0.6 } as const

/** Base load: fridge, lights, TV, washing, cooking. DATA-APPLIANCE-CALC-0001. */
const BASE_LOAD_KWH: Record<number, number> = { 1: 110, 2: 150, 3: 190, 4: 230 }

/** Storage water heater, kWh/month by occupants. 15-boiler-water-consumption.md. */
const BOILER_KWH: Record<number, number> = { 1: 97, 2: 163, 3: 230, 4: 297 }

/** Working estimate for a metered household. DATA-WATERUSE-CALC-0001. */
export const WATER_LITRES_PER_PERSON_DAY = 120

/** Median advertised fibre plan, 1,690 lek. DATA-INTERNET-CALC-0001. */
const INTERNET_ALL_MONTH = 1690

/** Post-1993 building with a lift, median. DATA-BUILDING-0003. */
const BUILDING_FEE_ALL_MONTH = 1500

/** Home insurance, EUR per m² per year. DATA-BUILDING-0006/0007. */
const INSURANCE_EUR_PER_M2_YEAR = 1.2

/** One AC serviced once a year. DATA-BUILDING-0008. */
const AC_SERVICE_EUR_YEAR = 65

export type Season = 'winter' | 'summer' | 'shoulder'

export type UtilityInput = {
  city: UtilityCity
  /** Gross floor area, m². */
  sizeM2: number
  occupants: number
  season: Season
  /** Hours the AC runs per day in season. Default 8. */
  acHoursPerDay?: number
  /** Unit size. Default 12,000 BTU. */
  acBtu?: 9000 | 12000 | 18000 | 24000
  /** Number of units running. Default: 1 up to 70 m², otherwise 2. */
  acUnits?: number
  /** Set false for an apartment with no electric water heater. */
  hasBoiler?: boolean
  /** Override the building fee, EUR/month (resort complexes charge far more). */
  buildingFeeEur?: number
  /** Override the internet plan, EUR/month. */
  internetEur?: number
}

export type UtilityLine = {
  item: string
  eurPerMonth: number
  /** Facts this line was computed from. */
  dataIds: string[]
  note?: string
}

export type UtilityResult = {
  city: UtilityCity
  season: Season
  sizeM2: number
  occupants: number
  kwhPerMonth: number
  /** True when the month crosses 700 kWh and every kWh re-prices upward. */
  aboveElectricityThreshold: boolean
  lines: UtilityLine[]
  totalEurPerMonth: number
  assumptions: string[]
}

const round2 = (value: number) => Math.round(value * 100) / 100
const clampOccupants = (value: number) => Math.min(Math.max(Math.round(value) || 1, 1), 4)

/** kWh a split AC uses in a month at the given duty. */
export function acKwhPerMonth(
  btu: number,
  hoursPerDay: number,
  mode: 'cooling' | 'heating',
  units = 1,
): number {
  const input = AC_INPUT_KW[btu] ?? AC_INPUT_KW[12000]
  const kw = mode === 'cooling' ? input.cooling : input.heating
  return kw * AC_DRAW_FACTOR[mode] * Math.max(hoursPerDay, 0) * 30 * Math.max(units, 0)
}

/** Electricity bill for a month's consumption, EUR, VAT included. */
export function electricityEur(kwhPerMonth: number): { eur: number; aboveThreshold: boolean } {
  const above = kwhPerMonth > ELECTRICITY.thresholdKwh
  const rateAll = above ? ELECTRICITY.highBandAll : ELECTRICITY.lowBandAll
  return { eur: (kwhPerMonth * rateAll) / ALL_PER_EUR, aboveThreshold: above }
}

/** Water, sewerage and the fixed service fee for a month, EUR. */
export function waterEur(city: UtilityCity, occupants: number): number {
  const tariff = WATER_TARIFFS[city] ?? WATER_TARIFFS.durres
  const m3 = (occupants * WATER_LITRES_PER_PERSON_DAY * 30) / 1000
  return (m3 * (tariff.waterAll + tariff.sewerAll) + tariff.fixedAll) / ALL_PER_EUR
}

export function calculateUtilities(input: UtilityInput): UtilityResult {
  const city = WATER_TARIFFS[input.city] ? input.city : 'durres'
  const sizeM2 = Math.min(Math.max(input.sizeM2 || 60, 15), 400)
  const occupants = clampOccupants(input.occupants)
  const season: Season = input.season ?? 'shoulder'
  const acHours = input.acHoursPerDay ?? 8
  const acBtu = input.acBtu ?? 12000
  const acUnits = input.acUnits ?? (sizeM2 <= 70 ? 1 : 2)
  const hasBoiler = input.hasBoiler !== false

  // Base load grows with floor area, but far more slowly than area itself:
  // a bigger flat means more lighting, not proportionally more fridge.
  const baseLoad = BASE_LOAD_KWH[occupants] * Math.pow(sizeM2 / 60, 0.3)
  const boiler = hasBoiler ? BOILER_KWH[occupants] : 0
  const ac =
    season === 'summer'
      ? acKwhPerMonth(acBtu, acHours, 'cooling', acUnits)
      : season === 'winter'
        ? acKwhPerMonth(acBtu, acHours, 'heating', acUnits)
        : 0

  const kwhPerMonth = baseLoad + boiler + ac
  const electricity = electricityEur(kwhPerMonth)
  const waste = WASTE_YEAR_ALL[city] / 12 / ALL_PER_EUR
  const internet = input.internetEur ?? INTERNET_ALL_MONTH / ALL_PER_EUR
  const buildingFee = input.buildingFeeEur ?? BUILDING_FEE_ALL_MONTH / ALL_PER_EUR

  const lines: UtilityLine[] = [
    {
      item: 'electricity',
      eurPerMonth: round2(electricity.eur),
      dataIds: ['DATA-ELEC-0001', 'DATA-ELEC-0002', 'DATA-ELEC-0003'],
      note: `${Math.round(kwhPerMonth)} kWh/month${electricity.aboveThreshold ? ' — above the 700 kWh threshold, so every kWh is billed at the higher rate' : ''}`,
    },
    {
      item: 'water_sewerage',
      eurPerMonth: round2(waterEur(city, occupants)),
      dataIds: [...WATER_FACT_IDS[city], 'DATA-WATERUSE-0001'],
      note: `${occupants} × ${WATER_LITRES_PER_PERSON_DAY} L/day`,
    },
    {
      item: 'waste_tax',
      eurPerMonth: round2(waste),
      dataIds: WASTE_FACT_IDS[city],
      note: WASTE_IS_ESTIMATE[city]
        ? 'estimate: this municipality has not published its 2026 package'
        : undefined,
    },
    { item: 'internet', eurPerMonth: round2(internet), dataIds: ['DATA-INTERNET-CALC-0001'] },
    {
      item: 'building_fee',
      eurPerMonth: round2(buildingFee),
      // All three report the range; 0003 alone quotes the old-block figure and
      // would look like the source of a new-build number.
      dataIds: ['DATA-BUILDING-0003', 'DATA-BUILDING-0004', 'DATA-BUILDING-0005'],
      note: 'post-1993 building with a lift; resort complexes charge several times more',
    },
    {
      item: 'insurance',
      eurPerMonth: round2((INSURANCE_EUR_PER_M2_YEAR * sizeM2) / 12),
      dataIds: ['DATA-BUILDING-0006'],
    },
    {
      item: 'ac_service',
      eurPerMonth: round2(AC_SERVICE_EUR_YEAR / 12),
      dataIds: ['DATA-BUILDING-0008'],
    },
  ]

  const total = lines.reduce((sum, line) => sum + line.eurPerMonth, 0)

  const assumptions = [
    `${occupants} occupant(s), ${sizeM2} m², ${season}`,
    season === 'shoulder'
      ? 'no heating or cooling in this month'
      : `${acUnits} × ${acBtu} BTU inverter AC, ${acHours} h/day (${season === 'winter' ? 'heating' : 'cooling'})`,
    hasBoiler ? 'electric storage water heater' : 'no electric water heater',
    `tariffs in force 2026; ${ALL_PER_EUR} ALL/EUR`,
  ]

  return {
    city,
    season,
    sizeM2,
    occupants,
    kwhPerMonth: Math.round(kwhPerMonth),
    aboveElectricityThreshold: electricity.aboveThreshold,
    lines,
    totalEurPerMonth: round2(total),
    assumptions,
  }
}

/**
 * A year of running costs, weighting each month by that city's heating and
 * cooling season. Shoulder months carry neither.
 */
export function annualUtilitiesEur(input: Omit<UtilityInput, 'season'>): number {
  const city = WATER_TARIFFS[input.city] ? input.city : 'durres'
  const { heating, cooling } = SEASON_MONTHS[city]
  const winter = calculateUtilities({ ...input, city, season: 'winter' }).totalEurPerMonth
  const summer = calculateUtilities({ ...input, city, season: 'summer' }).totalEurPerMonth
  const shoulder = calculateUtilities({ ...input, city, season: 'shoulder' }).totalEurPerMonth
  return round2(winter * heating + summer * cooling + shoulder * (12 - heating - cooling))
}

export const UTILITY_CITIES = Object.keys(WATER_TARIFFS) as UtilityCity[]

/**
 * Which tariff table a catalog listing falls under.
 *
 * Golem, Qerret and Mali i Robit are filed under the city of Durrës in the
 * catalog but are billed by the Kavajë water unit (50 + 30 lek/m³, not Durrës's
 * 70 + 50), so a district slug wins over the city slug.
 */
export function utilityCityFor(citySlug?: string, districtSlug?: string): UtilityCity | null {
  const district = (districtSlug ?? '').toLowerCase()
  if (/golem|kavaj|qerret|mali-i-robit|spille/.test(district)) return 'golem'
  const city = (citySlug ?? '').toLowerCase() as UtilityCity
  return UTILITY_CITIES.includes(city) ? city : null
}
