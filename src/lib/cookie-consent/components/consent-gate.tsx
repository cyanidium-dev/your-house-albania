"use client";

import type { ReactNode } from "react";
import { useConsent } from "../hooks/use-consent";
import type { TogglableCategory } from "../types";

/**
 * Renders children only after the visitor granted the category — the hook
 * for any future non-GTM script (chat widget, map embed, …):
 *
 *   <ConsentGate category="functional"><ChatWidget /></ConsentGate>
 */
export function ConsentGate({
  category,
  children,
}: {
  category: TogglableCategory;
  children: ReactNode;
}) {
  const { isGranted } = useConsent();
  return isGranted(category) ? <>{children}</> : null;
}
