/**
 * Albanian state reference prices for flats ("çmimet e referencës"), as in
 * force on 2026-10-21, for the Albanian page `/sq/cmimet-e-references`
 * (SEO hypothesis 5, SEO lab experiment E01).
 *
 * Official sources only (research: reports/domlivo-seo-lab/research/
 * reference-prices-official.md):
 * - outside Tirana: VKM nr. 132, 7.3.2018, Annex 1 a.1, one city-wide price at
 *   2016 level;
 * - Tirana: the same VKM, Annex 1 a.2 as replaced by VKM nr. 457, 26.7.2023;
 * - the July 2025 draft map (RENJK 850) was never approved, so it is shown as
 *   a draft only.
 * Re-check when a new VKM on reference prices is published: update the
 * tables, `REFERENCE_PRICES_CHECKED_ON` and `lastModified` in
 * `REFERENCE_PRICES_PAGE`.
 */

export const REFERENCE_PRICES_LOCALE = "sq";
export const REFERENCE_PRICES_PATH = "cmimet-e-references";
/** The day the tables were checked against the official documents (sitemap lastmod too). */
export const REFERENCE_PRICES_CHECKED_ON = "2026-10-21";

/**
 * A whole number the Albanian way, "67.500". Written by hand: Node's ICU and
 * the browser's disagree on `sq-AL` grouping for four-digit numbers, and the
 * calculator is rendered on both.
 */
export function formatSq(n: number): string {
  const sign = n < 0 ? "-" : "";
  return sign + Math.round(Math.abs(n)).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

export function referencePricesPath(): string {
  return `/${REFERENCE_PRICES_LOCALE}/${REFERENCE_PRICES_PATH}`;
}

export type ReferencePlace = {
  /** Option key for the calculator. */
  key: string;
  name: string;
  /** ALL per m². */
  value: number;
  /** City slug with a Domlivo catalogue, for the "asking prices" link. */
  citySlug?: string;
};

/** VKM 132/2018, Annex 1 a.1: one price per city outside Tirana (2016 level). */
export const OUTSIDE_TIRANA: readonly ReferencePlace[] = [
  { key: "durres", name: "Durrës", value: 67_500, citySlug: "durres" },
  { key: "vlore", name: "Vlorë", value: 61_800, citySlug: "vlore" },
  { key: "orikum", name: "Orikum (Vlorë)", value: 60_000 },
  { key: "shkoder", name: "Shkodër", value: 58_000 },
  { key: "himare", name: "Himarë", value: 58_000 },
  { key: "sarande", name: "Sarandë", value: 56_000, citySlug: "sarande" },
  { key: "shengjin", name: "Shëngjin (Lezhë)", value: 56_000, citySlug: "shengjin" },
  { key: "lezhe", name: "Lezhë", value: 56_000 },
  { key: "kamez", name: "Kamëz", value: 52_000 },
  { key: "vore", name: "Vorë", value: 51_500 },
  { key: "kavaje", name: "Kavajë (qyteti)", value: 51_000 },
  { key: "fushe-kruje", name: "Fushë-Krujë", value: 51_000 },
  { key: "kruje", name: "Krujë", value: 48_500 },
  { key: "shijak", name: "Shijak", value: 41_000 },
  { key: "rrogozhine", name: "Rrogozhinë", value: 41_000 },
];

/** VKM 132/2018, Annex 1 a.2 as replaced by VKM 457/2023: the 32 zones of the city of Tirana. */
export const TIRANA_ZONES: readonly ReferencePlace[] = (
  [
    ["1/1", 102_800], ["1/2", 97_200],
    ["2/1", 202_400], ["2/2", 148_400], ["2/3", 110_600], ["2/4", 120_300], ["2/5", 85_700],
    ["3/1", 98_500], ["3/2", 86_300],
    ["4/1", 95_900], ["4/2", 95_300],
    ["5/1", 228_400], ["5/2", 175_800], ["5/3", 164_800], ["5/4", 117_800],
    ["6", 81_700],
    ["7/1", 159_100], ["7/2", 123_400], ["7/3", 124_500], ["7/4", 114_300],
    ["8/1", 145_650], ["8/2", 156_700], ["8/3", 89_900],
    ["9/1", 163_600], ["9/2", 135_800], ["9/3", 113_850],
    ["10/1", 192_800], ["10/2", 178_300], ["10/3", 121_200],
    ["11/1", 113_000], ["11/2", 103_500], ["11/3", 93_600],
  ] as const
).map(([zone, value]) => ({ key: `tirane-${zone}`, name: `Tiranë, zona ${zone}`, value }));

/** The same annex: the administrative units of the Tirana municipality outside the city. */
export const TIRANA_UNITS: readonly ReferencePlace[] = (
  [
    ["Farkë", 115_200], ["Petrelë", 85_800], ["Pezë", 85_800], ["Dajt", 75_500], ["Kashar", 69_000],
    ["Bërzhitë", 34_000], ["Ndroq", 34_000], ["Vaqar", 34_000], ["Baldushk", 32_000],
    ["Kërrabë", 28_200], ["Zall-Herr", 28_200], ["Zall-Bastar", 25_000], ["Shëngjergj", 23_000],
  ] as const
).map(([name, value]) => ({ key: `tirane-nj-${name.toLowerCase()}`, name: `Tiranë, njësia ${name}`, value }));

/** Draft VKM RENJK 850 (17.7.2025), Annex 1: Durrës in 13 zones. Not approved. */
export const DRAFT_DURRES_ZONES: readonly { zone: string; value: number }[] = [
  ["Z1", 124_000], ["Z2", 88_000], ["Z3", 82_000], ["Z4", 78_000], ["Z5", 77_000], ["Z6", 140_000], ["Z7", 90_000],
  ["Z8", 45_000], ["Z9", 50_000], ["Z10", 100_000], ["Z11", 81_000], ["Z12", 68_000], ["Z13", 200_000],
].map(([zone, value]) => ({ zone: zone as string, value: value as number }));

export const REFERENCE_SOURCES = {
  vkm132: {
    label: "VKM nr. 132, datë 7.3.2018, e ndryshuar (përfshirë VKM nr. 457, datë 26.7.2023), Aneksi 1",
    url: "https://dptp.financa.gov.al/wp-content/uploads/2023/08/VKM_132-date-32018_perditesuar_-2020-2023.pdf",
  },
  instruction34: {
    label: "Udhëzimi i përbashkët nr. 34, datë 29.12.2023 (Ministria e Financave dhe ASHK)",
    url: "https://www.ashk.gov.al/wp-content/uploads/2024/01/udhezim_tatimi_mbi_te_ardhurat_per_kalimin_e_te_drejtes_e_pronesise.pdf",
  },
  instruction5: {
    label: "Udhëzimi i përbashkët nr. 5, datë 19.2.2026, për rivlerësimin e pasurisë (Ligji nr. 85/2025)",
    url: "https://www.ashk.gov.al/wp-content/uploads/2026/02/udhezim-2026-02-19-5-1.pdf",
  },
  ashkNotice: {
    label: "ASHK: Rivlerësimi i pasurisë së paluajtshme gjatë gjithë vitit me vetëm 5%",
    url: "https://www.ashk.gov.al/2026/02/24/rivleresimi-i-pasurise-se-paluajtshme-gjate-gjithe-vitit-me-vetem-5/",
  },
  draft2025: {
    label: "Projektvendimi RENJK 850 (17.7.2025), konsultim publik 23.7-20.8.2025, i pamiratuar",
    url: "https://www.konsultimipublik.gov.al/documents/RENJK_850_Draft-Projektvendim-P-r-miratimin-e-metodologjis--p-r-taks-n-mbi-nd-rtes-n_17.7.2025.docx",
  },
  ministry2016: {
    label: "Ministria e Financave: çmimet nuk janë rishikuar që nga 2016, përveç Tiranës",
    url: "https://financa.gov.al/newsroom/ministria-e-financave-zhvilloi-takime-konsultative-me-grupet-e-interesit-per-rivleresimin-dhe-cmimet-e-referencave-te-pasurise-se-paluajtshme/",
  },
} as const;

export const ALL_REFERENCE_PLACES: readonly ReferencePlace[] = [...OUTSIDE_TIRANA, ...TIRANA_ZONES, ...TIRANA_UNITS];
