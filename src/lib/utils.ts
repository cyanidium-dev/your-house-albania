import { clsx, type ClassValue } from "clsx"
import { extendTailwindMerge } from "tailwind-merge"

/**
 * tailwind-merge only knows Tailwind's default font-size names. The custom
 * sizes declared in globals.css (`--text-xm`, `--text-40`, `--text-52`) were
 * being classified as text *colors*, so `cn('text-40 … text-black')` dropped
 * `text-40` as a "conflicting" colour and section headings collapsed to 16px
 * below `lg`. Register them as font sizes so they merge correctly.
 */
const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      "font-size": [{ text: ["xm", "40", "52"] }],
    },
  },
})

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
