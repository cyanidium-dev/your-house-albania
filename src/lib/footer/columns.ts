/**
 * Footer lg-breakpoint column class (ТЗ-16): 4 base columns plus the optional
 * Guides and App columns. Extracted from the Footer for unit testing (audit F-4).
 */
export function footerLgColsClass(showGuidesColumn: boolean, showAppColumn: boolean): string {
  const extra = (showGuidesColumn ? 1 : 0) + (showAppColumn ? 1 : 0)
  return extra === 2 ? 'lg:grid-cols-6' : extra === 1 ? 'lg:grid-cols-5' : 'lg:grid-cols-4'
}
