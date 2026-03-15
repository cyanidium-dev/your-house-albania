"use client";

import * as React from "react";
import * as Select from "@radix-ui/react-select";
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
  anyLabel = "Any",
  anyValue = "any",
  disabled,
  className,
  contentClassName,
  radius,
}: Props & VariantProps<typeof triggerVariants>) {
  return (
    <div className="min-w-0">
      <label className="block text-xs font-medium text-dark/70 dark:text-white/80 mb-1">
        {label}
      </label>
      <Select.Root
        value={value}
        onValueChange={onValueChange}
        disabled={disabled}
      >
        <Select.Trigger className={cn(triggerVariants({ radius }), className)}>
          <Select.Value placeholder={placeholder ?? anyLabel} />
          <Select.Icon className="absolute right-3 top-1/2 -translate-y-1/2 text-dark/60 dark:text-white/70 pointer-events-none">
            <Icon icon="ph:caret-down" width={16} height={16} />
          </Select.Icon>
        </Select.Trigger>
        <Select.Portal>
          <Select.Content
            position="popper"
            side="bottom"
            align="start"
            sideOffset={8}
            collisionPadding={16}
            className={cn(
              "z-[100] overflow-visible rounded-2xl border border-dark/10 dark:border-white/10 shadow-3xl",
              "bg-white dark:bg-dark",
              "w-[var(--radix-select-trigger-width)] max-w-[calc(100vw-2rem)]",
              "data-[state=open]:animate-in data-[state=closed]:animate-out",
              "data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0",
              "data-[state=open]:zoom-in-95 data-[state=closed]:zoom-out-95",
              "data-[side=bottom]:slide-in-from-top-2 data-[side=top]:slide-in-from-bottom-2",
              contentClassName,
            )}
          >
            <Select.Viewport className="py-1 text-sm max-h-[var(--radix-select-content-available-height)] overflow-y-auto">
              <Select.Item
                value={anyValue}
                className="px-3 py-1.5 cursor-pointer text-dark dark:text-white outline-none hover:bg-primary/15 dark:hover:bg-primary/25 hover:text-primary"
              >
                <Select.ItemText>{anyLabel}</Select.ItemText>
              </Select.Item>
              {options.map((opt) => (
                <Select.Item
                  key={opt.value}
                  value={opt.value}
                  disabled={opt.disabled}
                  className={cn(
                    "px-3 py-1.5 cursor-pointer text-dark dark:text-white outline-none",
                    "hover:bg-primary/15 dark:hover:bg-primary/25 hover:text-primary",
                    "data-[disabled]:opacity-50 data-[disabled]:pointer-events-none",
                  )}
                >
                  <Select.ItemText>{opt.label}</Select.ItemText>
                </Select.Item>
              ))}
            </Select.Viewport>
          </Select.Content>
        </Select.Portal>
      </Select.Root>
    </div>
  );
}
