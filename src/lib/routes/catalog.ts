/**
 * Build the catalog base path for a locale.
 * Catalog URLs:
 * - /[locale]/properties
 * - /[locale]/properties/[city]
 * - /[locale]/properties/[city]/[district]
 * - /[locale]/properties/agent/[agent]
 * - /[locale]/properties/agent/[agent]/[city]
 * - /[locale]/properties/agent/[agent]/[city]/[district]
 */
export function catalogPath(
  locale: string,
  city?: string,
  district?: string,
  agentSlug?: string
): string {
  const base = `/${locale}/properties`;
  const baseWithAgent =
    agentSlug && agentSlug.trim()
      ? `${base}/agent/${encodeURIComponent(agentSlug)}`
      : base;
  if (!city) {
    if (district) {
      return `${baseWithAgent}?district=${encodeURIComponent(district)}`;
    }
    return baseWithAgent;
  }
  if (!district) return `${baseWithAgent}/${encodeURIComponent(city)}`;
  return `${baseWithAgent}/${encodeURIComponent(city)}/${encodeURIComponent(district)}`;
}
