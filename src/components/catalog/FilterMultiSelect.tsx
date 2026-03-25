"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { Icon } from "@iconify/react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

export type FilterMultiOption = {
  value: string;
  label: string;
  disabled?: boolean;
};

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
  value: string[];
  onValueChange: (next: string[]) => void;
  options: FilterMultiOption[];
  summaryLabel?: (count: number) => string;
  className?: string;
  panelClassName?: string;
};

export function FilterMultiSelect({
  label,
  value,
  onValueChange,
  options,
  summaryLabel,
  className,
  panelClassName,
  radius,
}: Props & VariantProps<typeof triggerVariants>) {
  const [open, setOpen] = React.useState(false);
  const [mounted, setMounted] = React.useState(false);
  const [isMobileSheet, setIsMobileSheet] = React.useState(false);
  const triggerRef = React.useRef<HTMLButtonElement>(null);
  const panelRef = React.useRef<HTMLDivElement>(null);
  const [pos, setPos] = React.useState<{ top: number; left: number; width: number } | null>(
    null,
  );

  const updatePosition = React.useCallback(() => {
    const el = triggerRef.current;
    if (!el || typeof window === "undefined") return;
    const rect = el.getBoundingClientRect();
    const padding = 16;
    const maxW = window.innerWidth - padding * 2;
    const w = Math.min(rect.width, maxW);
    const left = Math.max(padding, Math.min(rect.left, window.innerWidth - w - padding));
    setPos({ top: rect.bottom + 8, left, width: w });
  }, []);

  const close = React.useCallback(() => {
    setOpen(false);
  }, []);

  React.useLayoutEffect(() => {
    if (!mounted) return;
    updatePosition();
  }, [mounted, updatePosition]);

  React.useEffect(() => {
    if (!mounted) return;
    const onScroll = () => updatePosition();
    const onResize = () => updatePosition();
    window.addEventListener("scroll", onScroll, true);
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("scroll", onScroll, true);
      window.removeEventListener("resize", onResize);
    };
  }, [mounted, updatePosition]);

  React.useEffect(() => {
    const onDown = (e: MouseEvent) => {
      const t = e.target as Node;
      const insideTrigger = !!triggerRef.current && triggerRef.current.contains(t);
      const insidePanel = !!panelRef.current && panelRef.current.contains(t);
      if (!insideTrigger && !insidePanel) close();
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [close]);

  const count = value.length;
  const summary =
    typeof summaryLabel === "function"
      ? summaryLabel(count)
      : count === 0
        ? "Amenities"
        : count === 1
          ? "1 selected"
          : `${count} selected`;

  return (
    <div className="relative min-w-0">
      <label className="block text-xs font-medium text-dark/70 dark:text-white/80 mb-1">
        {label}
      </label>
      <button
        type="button"
        ref={triggerRef}
        onClick={() => {
          if (open) {
            close();
          } else {
            if (typeof window !== "undefined") {
              setIsMobileSheet(window.innerWidth <= 768);
            } else {
              setIsMobileSheet(false);
            }
            setMounted(true);
            setOpen(true);
          }
        }}
        className={cn(triggerVariants({ radius }), className)}
        aria-expanded={open}
      >
        <span className="truncate">{summary}</span>
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-dark/60 dark:text-white/70 pointer-events-none">
          <Icon icon={open ? "ph:caret-up" : "ph:caret-down"} width={16} height={16} />
        </span>
      </button>

      {mounted &&
        typeof document !== "undefined" &&
        createPortal(
          isMobileSheet
            ? (
              <div className={cn(
                "fixed inset-0 z-[100] flex items-end sm:items-center justify-center",
                open ? "pointer-events-auto" : "pointer-events-none"
              )}>
                <div
                  className={cn(
                    "absolute inset-0 bg-black/40 dark:bg-black/60 transition-opacity duration-200",
                    open ? "opacity-100" : "opacity-0",
                  )}
                  onClick={close}
                />
                <div
                  ref={panelRef}
                  className={cn(
                    "relative w-full sm:max-w-md max-h-[calc(100vh-96px)] rounded-t-2xl sm:rounded-2xl border border-dark/10 dark:border-white/10 bg-white dark:bg-dark shadow-3xl",
                    "flex flex-col p-4 sm:p-5",
                    "transition-transform duration-200 ease-out",
                    open ? "translate-y-0" : "translate-y-full sm:translate-y-2",
                    panelClassName,
                  )}
                  onTransitionEnd={(e) => {
                    if (e.target !== e.currentTarget) return;
                    if (!open) setMounted(false);
                  }}
                >
                  <div className="mb-3 flex items-center justify-between">
                    <span className="text-sm font-medium text-dark dark:text-white">{label}</span>
                    <button
                      type="button"
                      className="text-dark/60 dark:text-white/70 hover:text-primary transition-colors"
                      onClick={close}
                    >
                      <Icon icon="ph:x" width={18} height={18} />
                    </button>
                  </div>
                  <div className="grid grid-cols-1 gap-2 flex-1 overflow-auto">
                    {options.map((opt) => {
                      const checked = value.includes(opt.value);
                      return (
                        <label
                          key={opt.value}
                          className={cn(
                            "inline-flex items-center gap-3 rounded-lg px-3 py-2 text-sm",
                            "text-dark dark:text-white cursor-pointer",
                            "hover:bg-primary/5 dark:hover:bg-primary/10",
                            opt.disabled && "opacity-50 pointer-events-none",
                          )}
                        >
                          <input
                            type="checkbox"
                            className="h-4 w-4 rounded border border-dark/30 dark:border-white/40"
                            checked={checked}
                            onChange={() =>
                              onValueChange(
                                checked ? value.filter((v) => v !== opt.value) : [...value, opt.value],
                              )
                            }
                          />
                          <span className="truncate">{opt.label}</span>
                        </label>
                      );
                    })}
                  </div>
                  <div className="mt-4 flex items-center justify-between gap-3">
                    <button
                      type="button"
                      className="text-sm text-dark/70 dark:text-white/80 hover:text-primary transition-colors"
                      onClick={() => onValueChange([])}
                    >
                      Clear
                    </button>
                    <button
                      type="button"
                      className="px-4 py-1.5 rounded-full bg-primary text-white text-sm font-medium hover:bg-primary/90 transition-colors"
                      onClick={close}
                    >
                      Done
                    </button>
                  </div>
                </div>
              </div>
            )
            : (
              pos && (
                <div
                  ref={panelRef}
                  style={{ position: "fixed", top: pos.top, left: pos.left, width: pos.width }}
                  className={cn(
                    "z-[100] rounded-2xl border border-dark/10 dark:border-white/10 shadow-3xl",
                    "bg-white dark:bg-dark",
                    "p-3 sm:p-4",
                    "origin-top transition-[opacity,transform] duration-200 ease-out",
                    open ? "opacity-100 scale-100 translate-y-0" : "opacity-0 scale-[0.98] -translate-y-1",
                    panelClassName,
                  )}
                  onTransitionEnd={(e) => {
                    if (e.target !== e.currentTarget) return;
                    if (!open) setMounted(false);
                  }}
                >
                  <div className="grid grid-cols-2 gap-2 max-h-64 overflow-auto">
                    {options.map((opt) => {
                      const checked = value.includes(opt.value);
                      return (
                        <label
                          key={opt.value}
                          className={cn(
                            "inline-flex items-center gap-2 rounded-lg px-2 py-1 text-xs",
                            "text-dark dark:text-white cursor-pointer",
                            "hover:bg-primary/5 dark:hover:bg-primary/10",
                            opt.disabled && "opacity-50 pointer-events-none",
                          )}
                        >
                          <input
                            type="checkbox"
                            className="h-3.5 w-3.5 rounded border border-dark/30 dark:border-white/40"
                            checked={checked}
                            onChange={() =>
                              onValueChange(
                                checked ? value.filter((v) => v !== opt.value) : [...value, opt.value],
                              )
                            }
                          />
                          <span className="truncate">{opt.label}</span>
                        </label>
                      );
                    })}
                  </div>
                  <div className="mt-3 flex items-center justify-between">
                    <button
                      type="button"
                      className="text-xs text-dark/70 dark:text-white/80 hover:text-primary transition-colors"
                      onClick={() => onValueChange([])}
                    >
                      Clear
                    </button>
                    <button
                      type="button"
                      className="text-xs text-dark/70 dark:text-white/80 hover:text-primary transition-colors"
                      onClick={close}
                    >
                      Done
                    </button>
                  </div>
                </div>
              )
            ),
          document.body,
        )}
    </div>
  );
}
