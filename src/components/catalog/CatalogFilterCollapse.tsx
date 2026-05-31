"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

/** Shared liquid-glass surface for the filter bar. Kept in one place so the SAME
 *  element backs both the full form and the pill — it never changes opacity (and
 *  keeps a constant radius), only its height, which avoids the backdrop-blur "pop"
 *  you get when fading a blurred element in/out (the browser defers backdrop-filter
 *  until opacity settles) and the "oval" bulge from animating the corner radius. */
const GLASS =
  "bg-white/55 backdrop-blur-md shadow-md border border-dark/10 dark:border-white/10 dark:bg-dark/55";

/**
 * Airbnb-style condense for the desktop/tablet catalog filters.
 *
 * One persistent glass surface morphs between the pill and form sizes; the form
 * fields and the pill summary (neither of which carries a backdrop-filter) cross-
 * fade on top of it. Because the blurred layer keeps opacity 1 throughout, the
 * blur is stable instead of snapping in.
 *
 * No-jump rule: while scrolled (`compact`) the wrapper reserves only the PILL
 * height, and the glass + form grow as an OVERLAY on top of the results. Revealing
 * / re-collapsing mid-page therefore never shifts the results below. The single
 * height change (and content move) is the initial condense at the very top.
 *
 * A two-pass mount keeps SSR / first paint in normal flow (form sizes the wrapper,
 * glass fills it) before switching to the measured absolute overlay.
 */
export function CatalogFilterCollapse({
  compact,
  collapsed,
  form,
  pill,
}: {
  /** Page scrolled past the condense threshold — reserve only the pill height. */
  compact: boolean;
  /** Show the pill summary instead of the form (compact AND not revealed). */
  collapsed: boolean;
  form: React.ReactNode;
  pill: React.ReactNode;
}) {
  const formRef = React.useRef<HTMLDivElement>(null);
  const pillRef = React.useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = React.useState(false);
  const [formH, setFormH] = React.useState(0);
  const [pillH, setPillH] = React.useState(0);

  React.useLayoutEffect(() => setMounted(true), []);

  React.useLayoutEffect(() => {
    if (!mounted) return;
    const fEl = formRef.current;
    const pEl = pillRef.current;
    if (!fEl || !pEl) return;
    const measure = () => {
      setFormH(fEl.offsetHeight);
      setPillH(pEl.offsetHeight);
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(fEl);
    ro.observe(pEl);
    // Web-font swap reflows the form a few px taller after the initial measure;
    // that late layout shift can land without a fresh ResizeObserver callback,
    // leaving the glass short. Re-measure once fonts settle to stay flush.
    let cancelled = false;
    document.fonts?.ready.then(() => {
      if (!cancelled) measure();
    });
    return () => {
      cancelled = true;
      ro.disconnect();
    };
  }, [mounted]);

  // Reserve the pill height whenever scrolled, so the form overlays (and the
  // results stay put) on reveal/collapse. Full height only at the very top.
  const reserveH = compact ? pillH : formH;
  // The visible glass tracks the *content* shown (pill when collapsed, else form).
  const glassH = collapsed ? pillH : formH;

  // Smooth, slightly long ease so the morph feels premium rather than snappy.
  const ease = "duration-[450ms] ease-[cubic-bezier(0.22,1,0.36,1)]";

  // ONE constant radius for both states instead of animating rounded-2xl -> full.
  // 24px (rounded-3xl) is exactly half the pill height, so the collapsed bar reads
  // as a true stadium/pill, while the tall form reads as a normal rounded card.
  // Animating the radius instead would briefly bulge the still-tall box into an
  // "oval" (large radius applied before the height has shrunk) and is also the
  // janky part — re-clipping a backdrop-blur layer every frame. Constant radius =
  // only height animates = cheap and smooth.

  return (
    <div
      className={cn("relative", mounted && `transition-[height] ${ease}`)}
      style={mounted ? { height: reserveH } : undefined}
    >
      {/* Persistent glass surface — animates height only (constant radius), never fades. */}
      <div
        aria-hidden
        className={cn(
          "pointer-events-none z-0 rounded-3xl",
          GLASS,
          mounted
            ? `absolute inset-x-0 top-0 transition-[height] ${ease}`
            : "absolute inset-0"
        )}
        style={mounted ? { height: glassH } : undefined}
      />

      {/* Form fields (no own background) cross-fade on top of the glass. */}
      <div
        ref={formRef}
        aria-hidden={mounted ? collapsed : undefined}
        className={cn(
          "z-20",
          mounted
            ? `absolute inset-x-0 top-0 transition-opacity ${ease}`
            : "relative",
          mounted && collapsed ? "pointer-events-none opacity-0" : "opacity-100"
        )}
      >
        {form}
      </div>

      {/* Pill summary (no own background) cross-fades on top of the glass. */}
      <div
        ref={pillRef}
        aria-hidden={mounted ? !collapsed : true}
        className={cn(
          "z-10",
          !mounted && "hidden",
          mounted && `absolute inset-x-0 top-0 transition-opacity ${ease}`,
          mounted && collapsed ? "opacity-100" : "pointer-events-none opacity-0"
        )}
      >
        {pill}
      </div>
    </div>
  );
}
