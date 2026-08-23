import { Icon } from '@iconify/react'

/**
 * The fact row under a property's heading: rooms, bedrooms, bathrooms, area,
 * year built.
 *
 * Every tile is the same shape, and the row separates them with gaps rather
 * than vertical rules. Rules were tried first and are wrong here: this row
 * lives in a third-width column, so five tiles wrap on every screen size, and
 * a positional `[&>*+*]:border-s` leaves a stray rule hanging at the start of
 * each wrapped line. Gaps cannot do that at any width.
 *
 * A tile that is absent — rooms on a listing that predates the field, a year
 * nobody recorded — costs nothing but its own width and never moves its
 * neighbours. The previous version hand-rolled per-tile padding and grew a
 * border on the area tile only when a year existed, which is precisely how a
 * row shifts.
 */
export function PropertyFactRow({ facts }: { facts: Array<{ key: string; icon: string; label: string }> }) {
  return (
    <div className="flex flex-wrap items-start gap-x-6 gap-y-4 xs:gap-x-8 mobile:gap-x-10">
      {facts.map((fact) => (
        <div key={fact.key} className="flex min-w-0 flex-col gap-2">
          <Icon icon={fact.icon} width={20} height={20} className="shrink-0" />
          <p className="whitespace-nowrap text-sm font-normal text-black mobile:text-base dark:text-white">
            {fact.label}
          </p>
        </div>
      ))}
    </div>
  )
}
