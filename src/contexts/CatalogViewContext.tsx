"use client";

import * as React from "react";
import type { ViewMode } from "@/lib/catalog/viewMode";
import {
  parseViewMode,
  DEFAULT_VIEW_MODE,
  VIEW_MODE_STORAGE_KEY,
  isValidViewMode,
} from "@/lib/catalog/viewMode";

type CatalogViewContextValue = {
  viewMode: ViewMode;
  setViewMode: (view: ViewMode) => void;
  getCurrentView: () => ViewMode;
};

const CatalogViewContext = React.createContext<CatalogViewContextValue | null>(
  null
);

export function useCatalogView(): CatalogViewContextValue {
  const ctx = React.useContext(CatalogViewContext);
  if (!ctx) {
    throw new Error("useCatalogView must be used within CatalogViewProvider");
  }
  return ctx;
}

export function useCatalogViewOptional(): CatalogViewContextValue | null {
  return React.useContext(CatalogViewContext);
}

type CatalogViewProviderProps = {
  /** Optional: from URL ?view= for one-time shared link. Fallback only. */
  initialView: ViewMode;
  children: React.ReactNode;
};

/**
 * View mode as UI preference: client state + localStorage.
 * Does not write to URL; no page navigation/rerender on change.
 */
export function CatalogViewProvider({
  initialView,
  children,
}: CatalogViewProviderProps) {
  const [viewMode, setViewModeState] = React.useState<ViewMode>(() =>
    parseViewMode(initialView as string)
  );
  const viewModeRef = React.useRef(viewMode);
  viewModeRef.current = viewMode;
  const mounted = React.useRef(false);

  const getCurrentView = React.useCallback(() => viewModeRef.current, []);

  const setViewMode = React.useCallback((view: ViewMode) => {
    setViewModeState(view);
    if (typeof window !== "undefined") {
      try {
        window.localStorage.setItem(VIEW_MODE_STORAGE_KEY, view);
      } catch {
        // ignore
      }
    }
  }, []);

  // After mount: restore from localStorage (primary) so preference persists
  React.useEffect(() => {
    if (typeof window === "undefined") return;
    if (!mounted.current) {
      mounted.current = true;
      try {
        const stored = window.localStorage.getItem(VIEW_MODE_STORAGE_KEY);
        if (stored && isValidViewMode(stored)) {
          setViewModeState(stored);
        }
      } catch {
        // ignore
      }
    }
  }, []);

  const value = React.useMemo<CatalogViewContextValue>(
    () => ({ viewMode, setViewMode, getCurrentView }),
    [viewMode, setViewMode, getCurrentView]
  );

  return (
    <CatalogViewContext.Provider value={value}>
      {children}
    </CatalogViewContext.Provider>
  );
}

