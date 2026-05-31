import { Icon } from "@iconify/react";
import type { MarketingBenefitItem, MarketingHighlightCard } from "./types";

export function LightBulletList({
  items,
  className,
}: {
  items: string[];
  className?: string;
}) {
  if (items.length === 0) return null;
  return (
    <ul className={className ?? "flex flex-col gap-3"}>
      {items.map((b, i) => (
        <li
          key={i}
          className="flex items-start gap-2 text-dark dark:text-white text-base"
        >
          <span className="w-2 h-2 rounded-full bg-primary shrink-0 mt-1.5" />
          {b}
        </li>
      ))}
    </ul>
  );
}

export function IconBulletList({
  items,
  theme,
}: {
  items: MarketingBenefitItem[];
  theme: "light" | "dark";
}) {
  if (items.length === 0) return null;
  const isDark = theme === "dark";
  return (
    <ul className="flex flex-col gap-3.5">
      {items.map((b, i) => {
        const iconName = `ph:${(b.iconKey || "check-circle").trim()}`;
        return (
          <li key={i} className="flex items-start gap-3">
            <span
              className={
                "mt-0.5 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary"
              }
            >
              <Icon icon={iconName} width={14} height={14} aria-hidden />
            </span>
            <span
              className={
                "text-[15px] leading-snug " +
                (isDark ? "text-white/85" : "text-dark/85 dark:text-white/85")
              }
            >
              {b.label}
            </span>
          </li>
        );
      })}
    </ul>
  );
}

export function TrustStrip({ text, theme }: { text: string; theme: "light" | "dark" }) {
  const isDark = theme === "dark";
  return (
    <div
      className={
        "flex items-center gap-2 text-xs " +
        (isDark
          ? "text-white/55"
          : "text-dark/55 dark:text-white/55")
      }
    >
      <span
        className={
          "inline-flex h-7 w-7 items-center justify-center rounded-full " +
          (isDark
            ? "bg-white/10 text-white/80"
            : "bg-dark/[0.06] text-dark/70 dark:bg-white/10 dark:text-white/80")
        }
      >
        <Icon icon="ph:users" width={14} height={14} />
      </span>
      <span>{text}</span>
    </div>
  );
}

export function DarkBulletList({ items }: { items: string[] }) {
  if (items.length === 0) return null;
  return (
    <ul className="flex flex-col gap-2 text-white/90 text-center max-w-xl">
      {items.map((b, i) => (
        <li key={i} className="flex items-center justify-center gap-2">
          <span className="w-2 h-2 rounded-full bg-white shrink-0" />
          {b}
        </li>
      ))}
    </ul>
  );
}

export function highlightGridCols(n: number): string {
  if (n <= 1) return "grid-cols-1";
  if (n === 2) return "grid-cols-1 sm:grid-cols-2";
  if (n === 3) return "grid-cols-1 sm:grid-cols-3";
  if (n === 4) return "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4";
  // 5+: 2 on phones, 3 on tablets+
  return "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3";
}

/** Mirrors `InvestmentSectionImpl` stats grid; optional description for marketing cards. */
export function HighlightCardsLight({ cards }: { cards: MarketingHighlightCard[] }) {
  if (cards.length === 0) return null;
  return (
    <div className={`grid ${highlightGridCols(cards.length)} gap-3 md:gap-4`}>
      {cards.map((c, idx) => (
        <div
          key={`${c.label}-${c.value}-${idx}`}
          className="rounded-2xl border border-dark/10 dark:border-white/20 bg-white/60 dark:bg-white/5 p-4 md:p-5"
        >
          {c.value && c.label ? (
            <>
              <div className="text-xl md:text-2xl font-semibold text-dark dark:text-white leading-tight">
                {c.value}
              </div>
              <div className="mt-1 text-sm text-dark/60 dark:text-white/60">
                {c.label}
              </div>
            </>
          ) : (
            <div className="text-xl md:text-2xl font-semibold text-dark dark:text-white leading-tight">
              {c.value || c.label}
            </div>
          )}
          {c.description ? (
            <div className="mt-2.5 text-sm text-dark/55 dark:text-white/55 leading-snug whitespace-pre-line">
              {c.description}
            </div>
          ) : null}
        </div>
      ))}
    </div>
  );
}

export function HighlightCardsDark({
  cards,
  align,
}: {
  cards: MarketingHighlightCard[];
  align?: "start" | "center";
}) {
  if (cards.length === 0) return null;
  const textAlign = align === "center" ? "text-center" : "";
  return (
    <div
      className={`grid ${highlightGridCols(cards.length)} gap-3 md:gap-4 w-full ${
        cards.length <= 3 ? "max-w-3xl" : "max-w-4xl"
      } ${align === "center" ? "mx-auto" : ""}`}
    >
      {cards.map((c, idx) => (
        <div
          key={`${c.label}-${c.value}-${idx}`}
          className={`rounded-2xl border border-white/20 bg-white/10 p-4 md:p-5 ${textAlign}`}
        >
          {c.value && c.label ? (
            <>
              <div className="text-xl md:text-2xl font-semibold text-white leading-tight">{c.value}</div>
              <div className="mt-1 text-sm text-white/65">{c.label}</div>
            </>
          ) : (
            <div className="text-xl md:text-2xl font-semibold text-white leading-tight">
              {c.value || c.label}
            </div>
          )}
          {c.description ? (
            <div className="mt-2.5 text-sm text-white/55 leading-snug whitespace-pre-line">
              {c.description}
            </div>
          ) : null}
        </div>
      ))}
    </div>
  );
}
