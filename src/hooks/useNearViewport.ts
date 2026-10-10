"use client";

import { useEffect, useState, type RefObject } from "react";

/**
 * Latches to `true` once the element comes within `NEAR_MARGIN` of the
 * viewport, and stays true. One IntersectionObserver serves every caller on the
 * page, so two dozen cards cost one observer, not two dozen.
 *
 * `false` on the server and during hydration, so markup rendered on either
 * side of hydration is the same.
 */
const NEAR_MARGIN = "600px 0px";

type Entry = { el: Element; done: () => void };
let observer: IntersectionObserver | null = null;
const waiting = new Map<Element, Entry>();

function getObserver(): IntersectionObserver | null {
  if (observer) return observer;
  if (typeof IntersectionObserver === "undefined") return null;
  observer = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (!e.isIntersecting) continue;
        const w = waiting.get(e.target);
        if (!w) continue;
        waiting.delete(e.target);
        observer?.unobserve(e.target);
        w.done();
      }
    },
    { rootMargin: NEAR_MARGIN },
  );
  return observer;
}

export function useNearViewport(ref: RefObject<Element | null>, enabled = true): boolean {
  const [near, setNear] = useState(false);
  useEffect(() => {
    if (!enabled || near) return;
    const el = ref.current;
    if (!el) return;
    const io = getObserver();
    if (!io) {
      setNear(true);
      return;
    }
    waiting.set(el, { el, done: () => setNear(true) });
    io.observe(el);
    return () => {
      waiting.delete(el);
      io.unobserve(el);
    };
  }, [ref, enabled, near]);
  return near;
}
