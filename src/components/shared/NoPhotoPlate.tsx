import * as React from "react";
import { Icon } from "@/components/shared/Icon";
import { cn } from "@/lib/utils";

/**
 * What a card shows while its place has no photograph yet: the place name
 * set large on a dotted brand plate, like a map label.
 *
 * Cards used to leave the image box empty (a flat dark rectangle on
 * /durres/info, "Qerret or Gjiri i Lalzit" on every comparison list) or
 * put a 26px pin in the middle of it; both read as a broken image. Repeating
 * the city's photo instead would put the same beach on four cards in a row.
 */
export function NoPhotoPlate({ label, className }: { label?: string; className?: string }) {
  return (
    <div
      className={cn(
        "absolute inset-0 overflow-hidden",
        "bg-gradient-to-br from-primary/20 via-primary/[0.06] to-transparent dark:from-primary/30 dark:via-primary/10 dark:to-white/[0.02]",
        className,
      )}
    >
      <div
        aria-hidden
        className="absolute inset-0 opacity-60 [background-image:radial-gradient(currentColor_1px,transparent_1px)] [background-size:14px_14px] text-primary/25 dark:text-primary/35"
      />
      <Icon
        aria-hidden
        icon="ph:map-pin-fill"
        width={22}
        height={22}
        className="absolute top-4 left-4 text-primary"
      />
      {label ? (
        <span className="absolute inset-x-4 bottom-4 font-display text-2xl sm:text-[1.75rem] font-medium leading-[1.05] tracking-tight text-dark/80 dark:text-white/85 line-clamp-2">
          {label}
        </span>
      ) : null}
    </div>
  );
}
