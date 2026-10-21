/**
 * One look for every data table on the site (sale hub, knowledge base, blog):
 * a rounded box, small muted column heads that may wrap, figures right-aligned
 * and on one line, narrower padding on phones so four numeric columns fit a
 * 360px screen without scrolling. Wider tables still scroll inside their box,
 * never the page. Owner, 2026-10-21: "tables here and everywhere in order".
 */
export const TABLE_WRAP = 'overflow-x-auto rounded-2xl border border-dark/10 dark:border-white/15'
export const TABLE = 'w-full border-collapse text-left text-sm text-dark dark:text-white sm:text-base'
export const TABLE_HEAD_ROW = 'bg-dark/[0.04] dark:bg-white/5'
export const TH =
  'px-3 py-3 align-bottom text-xs font-medium leading-snug text-dark/60 dark:text-white/60 sm:px-5 sm:text-sm'
export const TD = 'px-3 py-3 align-top border-t border-dark/[0.06] dark:border-white/10 sm:px-5'
export const ROW_STRIPE = 'even:bg-dark/[0.02] dark:even:bg-white/[0.03]'
export const NUM = 'text-right tabular-nums whitespace-nowrap'
