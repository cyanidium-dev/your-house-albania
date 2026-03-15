export const VIEW_MODES = ["large", "small", "list"] as const;
export type ViewMode = (typeof VIEW_MODES)[number];

export const DEFAULT_VIEW_MODE: ViewMode = "large";

/** Optional: read once from URL as initial value. Not the source of truth. */
export const VIEW_MODE_QUERY_PARAM = "view";

/** localStorage key for view mode UI preference. Primary persistence. */
export const VIEW_MODE_STORAGE_KEY = "catalogViewMode";

export function parseViewMode(value: string | string[] | undefined): ViewMode {
  const v = typeof value === "string" ? value : value?.[0];
  if (v === "large" || v === "small" || v === "list") return v;
  return DEFAULT_VIEW_MODE;
}

export function isValidViewMode(s: string): s is ViewMode {
  return s === "large" || s === "small" || s === "list";
}
