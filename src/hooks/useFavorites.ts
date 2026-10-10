"use client";

import { useState, useEffect, useCallback, useSyncExternalStore } from "react";
import {
  getFavorites,
  toggleFavorite as toggleFavoriteStorage,
  clearAllFavorites as clearAllFavoritesStorage,
  isFavorite as isFavoriteStorage,
  FAVORITES_STORAGE_KEY,
} from "@/lib/favorites";

const NO_FAVORITES: string[] = [];
let cachedRaw: string | null | undefined;
let cachedList: string[] = NO_FAVORITES;

/** The stored list, the same array for as long as the stored string is unchanged. */
function readFavoritesSnapshot(): string[] {
  let raw: string | null = null;
  try {
    raw = localStorage.getItem(FAVORITES_STORAGE_KEY);
  } catch {
    return NO_FAVORITES;
  }
  if (raw !== cachedRaw) {
    cachedRaw = raw;
    const list = getFavorites();
    cachedList = list.length ? list : NO_FAVORITES;
  }
  return cachedList;
}

function subscribeFavorites(onChange: () => void): () => void {
  window.addEventListener("favorites-updated", onChange);
  return () => window.removeEventListener("favorites-updated", onChange);
}

const serverFavorites = () => NO_FAVORITES;

/**
 * The saved slugs, for a component that only needs to know whether a listing
 * is saved — the heart on every property card.
 *
 * `useFavorites` below keeps its own copy in state and sets it after mount,
 * so each of the 24 hearts on a listing page re-rendered once after hydration
 * whether or not anything was saved. Read from the store, a heart renders once
 * and re-renders only when the visitor actually has favourites.
 */
export function useFavoriteSlugs(): string[] {
  return useSyncExternalStore(subscribeFavorites, readFavoritesSnapshot, serverFavorites);
}

export function useFavorites() {
  const [favorites, setFavorites] = useState<string[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setFavorites(getFavorites());

    const handleUpdate = () => setFavorites(getFavorites());
    window.addEventListener("favorites-updated", handleUpdate);
    return () => window.removeEventListener("favorites-updated", handleUpdate);
  }, []);

  const toggle = useCallback((slug: string) => {
    toggleFavoriteStorage(slug);
    setFavorites(getFavorites());
  }, []);

  const clearAll = useCallback(() => {
    clearAllFavoritesStorage();
    setFavorites([]);
  }, []);

  const isFavorite = useCallback(
    (slug: string) => (mounted ? favorites.includes(slug) : isFavoriteStorage(slug)),
    [favorites, mounted]
  );

  return { favorites, toggle, clearAll, isFavorite, mounted };
}
