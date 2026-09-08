/**
 * Which listings carry a plot figure.
 *
 * A house or a villa stands on land, and a buyer asks about that land as
 * early as the floor area. A flat has no plot, and for a bare plot the area
 * field already IS the plot, so printing it twice would say nothing. The
 * slugs are the propertyType documents' slugs plus the legacy aliases the
 * hero-photo picker already recognises.
 */
const PLOT_TYPE_SLUGS = new Set(['house', 'villa', 'residential-homes', 'luxury-villa'])

export function showsPlotArea(typeSlug: string | null | undefined): boolean {
  return typeof typeSlug === 'string' && PLOT_TYPE_SLUGS.has(typeSlug.trim().toLowerCase())
}

/** A positive, finite number or null — Sanity leaves the field undefined, never 0, when nobody filled it. */
export function normalizePlotArea(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) && value > 0 ? value : null
}
