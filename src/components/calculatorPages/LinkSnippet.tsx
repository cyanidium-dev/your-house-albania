"use client";

import * as React from "react";
import { brandButtonClass } from "@/components/shared/BrandButton";

/**
 * "Link to this calculator": a plain HTML link to copy. Plain `<a>`, so the
 * link sits in the citing page itself.
 */
export function LinkSnippet({
  snippet,
  copyLabel,
  copiedLabel,
  fieldLabel,
}: {
  snippet: string;
  copyLabel: string;
  copiedLabel: string;
  fieldLabel: string;
}) {
  const [copied, setCopied] = React.useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(snippet);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard blocked: the code stays selectable in the box.
    }
  };

  return (
    <div className="space-y-4">
      <textarea
        readOnly
        value={snippet}
        rows={4}
        onFocus={(e) => e.currentTarget.select()}
        aria-label={fieldLabel}
        className="block w-full resize-none rounded-xl border border-dark/15 bg-dark/[0.03] p-3 font-mono text-xs leading-relaxed text-dark/80 [overflow-wrap:anywhere] dark:border-white/15 dark:bg-white/[0.04] dark:text-white/80"
      />
      <button type="button" onClick={copy} className={brandButtonClass("primary", "min-w-[180px]", "md")}>
        <span aria-live="polite">{copied ? copiedLabel : copyLabel}</span>
      </button>
    </div>
  );
}
