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
  const triggerRef = React.useRef<HTMLButtonElement>(null);
  const panelRef = React.useRef<HTMLDivElement>(null);
  const [pos, setPos] = React.useState<{ top: number; left: number; width: number } | null>(
    null,
  );

  const updatePosition = React.useCallback(() => {
    const el = triggerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    setPos({ top: rect.bottom + 8, left: rect.left, width: rect.width });
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
    <div className="relative">
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
        pos &&
        createPortal(
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
          </div>,
          document.body,
        )}
    </div>
  );
}
