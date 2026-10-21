"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { brandButtonClass } from "@/components/shared/BrandButton";

export type PriceIndexEmbedItem = {
  slug: string;
  label: string;
  imageUrl: string;
  alt: string;
  /** Ready-to-paste HTML: the card in a link, and a caption crediting the index. */
  snippet: string;
};

/**
 * "Use these figures on your site": a city picker, the card it embeds and the
 * code to copy. The code is plain HTML (img + a), so the credit link sits in
 * the host page itself and counts for it; an iframe would keep it inside the
 * frame.
 */
export function PriceIndexEmbed({
  items,
  copyLabel,
  copiedLabel,
}: {
  items: PriceIndexEmbedItem[];
  copyLabel: string;
  copiedLabel: string;
}) {
  const [active, setActive] = React.useState(items[0]?.slug ?? "");
  const [copied, setCopied] = React.useState(false);
  const item = items.find((i) => i.slug === active) ?? items[0];
  if (!item) return null;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(item.snippet);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard blocked: the code stays selectable in the box.
    }
  };

  return (
    <div className="space-y-4">
      {items.length > 1 ? (
        <div className="flex flex-wrap gap-2" role="tablist">
          {items.map((i) => (
            <button
              key={i.slug}
              type="button"
              role="tab"
              aria-selected={i.slug === item.slug}
              onClick={() => {
                setActive(i.slug);
                setCopied(false);
              }}
              className={cn(
                "h-9 cursor-pointer rounded-full border px-4 text-sm transition-colors",
                i.slug === item.slug
                  ? "border-dark bg-dark text-white dark:border-white dark:bg-white dark:text-dark"
                  : "border-dark/15 text-dark hover:border-primary hover:text-primary dark:border-white/20 dark:text-white",
              )}
            >
              {i.label}
            </button>
          ))}
        </div>
      ) : null}
      {/* eslint-disable-next-line @next/next/no-img-element -- the exact image the embed shows */}
      <img
        src={item.imageUrl}
        alt={item.alt}
        width={1200}
        height={630}
        loading="lazy"
        className="h-auto w-full rounded-2xl border border-dark/10 dark:border-white/10"
      />
      <textarea
        readOnly
        value={item.snippet}
        rows={4}
        onFocus={(e) => e.currentTarget.select()}
        className="block w-full resize-none rounded-xl border border-dark/15 bg-dark/[0.03] p-3 font-mono text-xs leading-relaxed text-dark/80 dark:border-white/15 dark:bg-white/[0.04] dark:text-white/80"
        aria-label={copyLabel}
      />
      <button type="button" onClick={copy} className={brandButtonClass("primary", "min-w-[180px]", "md")}>
        {copied ? copiedLabel : copyLabel}
      </button>
    </div>
  );
}
