/** Fallback Iconify ID when iconKey is unknown or unresolved. */
const FALLBACK_ICONIFY_ID = 'ph:info';

/**
 * Maps Sanity icon keys to Iconify IDs (Phosphor where available, MDI for ph gaps).
 * Must stay in sync with Sanity canonical PROPERTY_ICON_KEYS.
 * Sanity stores plain keys; @iconify/react requires prefix:icon-name format.
 * Note: ph:parking and ph:balcony do not exist; using mdi:parking, mdi:balcony.
 */
const SANITY_ICON_KEY_TO_ICONIFY: Record<string, string> = {
  elevator: 'ph:elevator',
  balcony: 'mdi:balcony',
  parking: 'mdi:parking',
  snowflake: 'ph:snowflake',
  car: 'ph:car',
  waves: 'ph:waves',
  'map-pin': 'ph:map-pin',
  key: 'ph:key',
  smartphone: 'ph:device-mobile',
  layout: 'ph:squares-four',
  sun: 'ph:sun',
  shield: 'ph:shield',
  wifi: 'ph:wifi-high',
  home: 'ph:house-simple',
  building: 'ph:buildings',
  tree: 'ph:tree-evergreen',
  sofa: 'ph:couch',
  cloud: 'ph:cloud',
  zap: 'ph:lightning',
};

/** Supported Sanity keys (must match canonical PROPERTY_ICON_KEYS): elevator, balcony, parking, snowflake, car, waves, map-pin, key, smartphone, layout, sun, shield, wifi, home, building, tree, sofa, cloud, zap */

/**
 * Resolves a Sanity icon key to an Iconify ID for property amenities/offers.
 * Returns fallback when key is unknown so no empty icon spans remain.
 */
export function resolvePropertyIconKey(sanityKey: string | null | undefined): string {
  if (!sanityKey || typeof sanityKey !== 'string') return FALLBACK_ICONIFY_ID;
  const normalized = sanityKey.trim().toLowerCase();
  if (!normalized) return FALLBACK_ICONIFY_ID;
  const resolved = SANITY_ICON_KEY_TO_ICONIFY[normalized];
  if (resolved) return resolved;
  const noHyphen = normalized.replace(/-/g, '');
  if (SANITY_ICON_KEY_TO_ICONIFY[noHyphen]) return SANITY_ICON_KEY_TO_ICONIFY[noHyphen];
  if (normalized.includes(':')) return normalized;
  return FALLBACK_ICONIFY_ID;
}
