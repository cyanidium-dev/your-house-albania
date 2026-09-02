/**
 * Footer lg-breakpoint column class (ТЗ-16): the base columns plus the optional
 * Guides and App columns. Extracted from the Footer for unit testing (audit F-4).
 *
 * The base was four until the Contacts and Socials columns were replaced by a
 * single link to the contact form (2026-09-02), so untracked direct channels
 * stopped competing with the form.
 */
const BASE_COLUMNS = 3

export function footerLgColsClass(showGuidesColumn: boolean, showAppColumn: boolean): string {
  const extra = (showGuidesColumn ? 1 : 0) + (showAppColumn ? 1 : 0)
  const total = BASE_COLUMNS + extra
  return total === 5 ? 'lg:grid-cols-5' : total === 4 ? 'lg:grid-cols-4' : 'lg:grid-cols-3'
}
