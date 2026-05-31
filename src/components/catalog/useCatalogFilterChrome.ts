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
  // Airbnb-style, direction-aware condense: scrolling DOWN collapses the full
  // form to a summary pill; scrolling UP (even slightly, mid-page) re-opens it.
  // Clicking the pill also opens it. `expanded` holds that open/closed intent
  // while in the compact (scrolled) zone; at the very top it's always open.
  const [expanded, setExpanded] = React.useState(true);
  const [isMobileViewport, setIsMobileViewport] = React.useState(false);
  const [mobileFilterModalOpen, setMobileFilterModalOpen] = React.useState(false);
  const [clientMounted, setClientMounted] = React.useState(false);
  const wasCompactRef = React.useRef(false);
  const lastScrollYRef = React.useRef(0);
  const expandedRef = React.useRef(true);
  // Timestamp of the last open/close flip. Expanding the form grows the page, and
  // the browser's scroll anchoring then nudges scrollY downward — which would read
  // as a "scroll down" and instantly re-collapse. We freeze direction handling for
  // a short window after each flip so that self-induced scroll can't reverse it.
  const toggleAtRef = React.useRef(0);
  const advancedInnerRef = React.useRef<HTMLDivElement>(null);
  const [advancedHeight, setAdvancedHeight] = React.useState(0);

  React.useEffect(() => {
    const setExpandedNow = (v: boolean) => {
      if (expandedRef.current === v) return;
      expandedRef.current = v;
      toggleAtRef.current = performance.now();
      setExpanded(v);
    };
    function handleScroll() {
      const y = window.scrollY;
      const compact = y > 50;
      // Collapse advanced only on transition into compact scroll state (not on every scroll while open).
      if (compact && !wasCompactRef.current) {
        setShowAdvanced(false);
      }
      wasCompactRef.current = compact;
      setIsCompact(compact);
      if (!compact) {
        setExpandedNow(true); // back at the top → full form
      } else if (performance.now() - toggleAtRef.current >= 300) {
        // Skip while the post-flip settle window is active (see toggleAtRef).
        const delta = y - lastScrollYRef.current;
        if (delta <= -4) setExpandedNow(true); // scrolling up → reveal
        else if (delta >= 4) setExpandedNow(false); // scrolling down → condense
      }
      lastScrollYRef.current = y;
    }
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Catalog-mode flag for the global header: present only while the filter bar
  // is mounted (i.e. on catalog/listing routes), so the header can shrink there
  // without coupling to fragile pathname matching.
  React.useEffect(() => {
    document.documentElement.dataset.catalog = "1";
    // Disable scroll anchoring while the filter bar is mounted: the bar grows /
    // shrinks on collapse, and anchoring would otherwise shift scrollY to keep
    // content fixed — which fights the direction-aware reveal (and re-triggers it
    // mid-animation). With anchoring off the sticky bar simply pushes the results.
    const prevAnchor = document.documentElement.style.overflowAnchor;
    document.documentElement.style.overflowAnchor = "none";
    return () => {
      delete document.documentElement.dataset.catalog;
      document.documentElement.style.overflowAnchor = prevAnchor;
    };
  }, []);

  const expandCompactFilters = React.useCallback(() => {
    expandedRef.current = true;
    toggleAtRef.current = performance.now();
    setExpanded(true);
  }, []);

  const collapsed = isCompact && !expanded;

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
    collapsed,
    expandCompactFilters,
    mobileFilterModalOpen,
    setMobileFilterModalOpen,
    clientMounted,
    advancedInnerRef,
    advancedHeight,
  };
}
