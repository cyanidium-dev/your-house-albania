/**
 * Lightweight favorites persistence using localStorage.
 * Storage format: JSON array of property slugs.
 */

const STORAGE_KEY = "favorites";

export function getFavorites(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed)
      ? parsed.filter((s): s is string => typeof s === "string")
      : [];
  } catch {
    return [];
  }
}

export function setFavorites(slugs: string[]): void {
  if (typeof window === "undefined") return;
  try {
    const cleaned = slugs.filter((s) => typeof s === "string" && s.trim());
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cleaned));
    window.dispatchEvent(new CustomEvent("favorites-updated"));
  } catch {
    // quota exceeded or disabled
  }
}

export function isFavorite(slug: string): boolean {
  const list = getFavorites();
  return list.includes(slug);
}

export function toggleFavorite(slug: string): boolean {
  const list = getFavorites();
  const idx = list.indexOf(slug);
  if (idx >= 0) {
    list.splice(idx, 1);
    setFavorites(list);
    return false;
  }
  list.push(slug);
  setFavorites(list);
  return true;
}

export function clearAllFavorites(): void {
  setFavorites([]);
}
