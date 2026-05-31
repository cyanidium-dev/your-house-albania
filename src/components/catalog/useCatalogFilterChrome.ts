"use client";

import * as React from "react";

/**
 * UI-chrome state for the catalog filter surface: scroll-compact, mobile viewport,
 * mobile modal (open + body-lock + Escape), advanced-row expand/measure, and mount flag.
 * Holds no filter values — only presentational state.
 */
export function useCatalogFilterChrome() {
  const [showAdvanced, setShowAdvanced] = React.useState(false);
  const [isCompact, setIsCompact] = React.useState(false);
  const [isMobileViewport, setIsMobileViewport] = React.useState(false);
  const [mobileFilterModalOpen, setMobileFilterModalOpen] = React.useState(false);
  const [clientMounted, setClientMounted] = React.useState(false);
  const wasCompactRef = React.useRef(false);
  const advancedInnerRef = React.useRef<HTMLDivElement>(null);
  const [advancedHeight, setAdvancedHeight] = React.useState(0);

  React.useEffect(() => {
    function handleScroll() {
      const compact = window.scrollY > 50;
      // Collapse advanced only on transition into compact scroll state (not on every scroll while open).
      if (compact && !wasCompactRef.current) {
        setShowAdvanced(false);
      }
      wasCompactRef.current = compact;
      setIsCompact(compact);
    }
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  React.useEffect(() => {
    setClientMounted(true);
  }, []);

  React.useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    const onChange = () => setIsMobileViewport(mq.matches);
    onChange();
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  React.useEffect(() => {
    if (!isMobileViewport && mobileFilterModalOpen) {
      setMobileFilterModalOpen(false);
    }
  }, [isMobileViewport, mobileFilterModalOpen]);

  React.useEffect(() => {
    if (!mobileFilterModalOpen || !isMobileViewport) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [mobileFilterModalOpen, isMobileViewport]);

  React.useEffect(() => {
    if (!mobileFilterModalOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMobileFilterModalOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [mobileFilterModalOpen]);

  // useLayoutEffect: measure before paint so advanced row is not height 0 on first open (clipped / unclickable).
  React.useLayoutEffect(() => {
    const el = advancedInnerRef.current;
    if (!el) return;
    if (showAdvanced) {
      setAdvancedHeight(el.scrollHeight);
    } else {
      setAdvancedHeight(0);
    }
  }, [showAdvanced]);

  return {
    showAdvanced,
    setShowAdvanced,
    isCompact,
    mobileFilterModalOpen,
    setMobileFilterModalOpen,
    clientMounted,
    advancedInnerRef,
    advancedHeight,
  };
}
