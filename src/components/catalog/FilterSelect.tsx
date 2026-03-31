"use client";

import * as React from "react";
import { Icon } from "@iconify/react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

export type FilterOption = { value: string; label: string; disabled?: boolean };

const triggerVariants = cva(
  [
    "relative inline-flex w-full items-center justify-between",
    "h-10 rounded-xl border",
    "border-dark/10 dark:border-white/10",
    "bg-transparent",
    "px-3 pr-10",
    "text-sm text-dark dark:text-white",
    "cursor-pointer",
    "transition-colors",
    "hover:bg-dark/5 dark:hover:bg-white/5",
    "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-inset",
  ].join(" "),
  {
    variants: {
      radius: {
        xl: "rounded-xl",
        full: "rounded-full",
      },
    },
    defaultVariants: {
      radius: "xl",
    },
  },
);

type Props = {
  label: string;
  value: string;
  onValueChange: (value: string) => void;
  options: FilterOption[];
  placeholder?: string;
  /** Optional one-line helper under the label (e.g. field context). */
  hint?: string;
  /** When false, only `options` are shown (no “any / all” row). Default true. */
  includeAnyOption?: boolean;
  anyLabel?: string;
  anyValue?: string;
  disabled?: boolean;
  className?: string;
  contentClassName?: string;
};

export function FilterSelect({
  label,
  value,
  onValueChange,
  options,
  placeholder,
  hint,
  includeAnyOption = true,
  anyLabel = "Any",
  anyValue = "any",
  disabled,
  className,
  contentClassName,
  radius,
}: Props & VariantProps<typeof triggerVariants>) {
  const [open, setOpen] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);

  const selectedLabel = React.useMemo(() => {
    if (includeAnyOption && value === anyValue) return anyLabel;
    const opt = options.find((o) => o.value === value);
    return opt?.label ?? placeholder ?? (includeAnyOption ? anyLabel : "");
  }, [value, anyValue, anyLabel, options, placeholder, includeAnyOption]);

  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  React.useEffect(() => {
    if (!open) return;
    const handleClickOutside = (e: MouseEvent) => {
      const t = e.target;
      if (!(t instanceof Node)) return;
      if (!containerRef.current?.contains(t)) setOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  const pick = (v: string) => {
    onValueChange(v);
    setOpen(false);
  };

  return (
    <div ref={containerRef} className="min-w-0 relative">
      <label className="block text-xs font-medium text-dark/70 dark:text-white/80 mb-1">
        {label}
      </label>
      {hint ? (
        <p className="mb-2 text-xs leading-relaxed text-dark/55 dark:text-white/50">{hint}</p>
      ) : null}
      <button
        type="button"
        disabled={disabled}
        aria-expanded={open}
        aria-haspopup="listbox"
        onClick={() => !disabled && setOpen((o) => !o)}
        className={cn(
          triggerVariants({ radius }),
          "overflow-hidden",
          "text-left",
          disabled && "opacity-50 pointer-events-none",
          className
        )}
      >
        <span className="min-w-0 truncate block">{selectedLabel}</span>
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-dark/60 dark:text-white/70 pointer-events-none">
          <Icon
            icon="ph:caret-down"
            width={16}
            height={16}
            className={cn("transition-transform", open && "rotate-180")}
          />
        </span>
      </button>
      {open && (
        <>
          <div
            className="fixed inset-0 z-[100]"
            aria-hidden
            onClick={() => setOpen(false)}
          />
          <div
            role="listbox"
            aria-label={label}
            className={cn(
              "absolute left-0 right-0 top-full mt-2 z-[110]",
              "rounded-2xl border border-dark/10 dark:border-white/10 shadow-3xl",
              "bg-white dark:bg-dark",
              "py-1 text-sm max-h-64 overflow-y-auto",
              "animate-in fade-in-0 zoom-in-95 slide-in-from-top-2",
              contentClassName
            )}
          >
            {includeAnyOption ? (
              <button
                type="button"
                role="option"
                aria-selected={value === anyValue}
                onClick={() => pick(anyValue)}
                className="w-full px-3 py-1.5 cursor-pointer text-left text-dark dark:text-white outline-none hover:bg-primary/15 dark:hover:bg-primary/25 hover:text-primary"
              >
                {anyLabel}
              </button>
            ) : null}
            {options.map((opt) => (
              <button
                key={opt.value}
                type="button"
                role="option"
                aria-selected={value === opt.value}
                disabled={opt.disabled}
                onClick={() => !opt.disabled && pick(opt.value)}
                className={cn(
                  "w-full px-3 py-1.5 cursor-pointer text-left text-dark dark:text-white outline-none",
                  "hover:bg-primary/15 dark:hover:bg-primary/25 hover:text-primary",
                  opt.disabled && "opacity-50 pointer-events-none"
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
