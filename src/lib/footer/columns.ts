/**
 * Footer lg-breakpoint column class: the four base columns (Property, Useful,
 * Company, Contacts) plus the optional App column. Extracted from the Footer
 * for unit testing (audit F-4).
 *
 * The Guides column folded into "Useful" on 2026-09-26, so it no longer
 * changes the count.
 */
const BASE_COLUMNS = 4

export function footerLgColsClass(showAppColumn: boolean): string {
  const total = BASE_COLUMNS + (showAppColumn ? 1 : 0)
  return total === 5 ? 'lg:grid-cols-5' : 'lg:grid-cols-4'
}
