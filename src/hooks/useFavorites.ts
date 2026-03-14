"use client";

import { useState, useEffect, useCallback } from "react";
import {
  getFavorites,
  toggleFavorite as toggleFavoriteStorage,
  clearAllFavorites as clearAllFavoritesStorage,
  isFavorite as isFavoriteStorage,
} from "@/lib/favorites";

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
