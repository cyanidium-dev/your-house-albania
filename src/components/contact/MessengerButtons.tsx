import { Icon } from '@/components/shared/Icon'
import { MESSENGER_ICON, MESSENGER_NAME, type MessengerKey, type MessengerLink } from '@/lib/contacts/messengers'

type Props = {
  /** Already in the visitor's order — see `resolveMessengers()`. */
  messengers: MessengerLink[]
  /** Accessible names, e.g. "Write on WhatsApp" (`QuickContact.channel.*`). */
  ariaLabels: Record<MessengerKey, string>
  /**
   * `pill`: icon and name, shares the row equally (panels, the contacts page).
   * `icon`: a 44px round icon button (the phone contact bar).
   */
  variant?: 'pill' | 'icon'
  className?: string
}

const focusRing =
  'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary'

const base = `items-center justify-center rounded-full border border-dark/10 text-dark transition-colors duration-300 hover:border-primary hover:text-primary dark:border-white/15 dark:text-white dark:hover:text-primary ${focusRing}`

const variantClass = {
  pill: `flex h-11 min-w-0 flex-1 gap-2 px-4 text-sm font-medium ${base}`,
  icon: `flex h-11 w-11 shrink-0 ${base}`,
} as const

/**
 * WhatsApp and Telegram as plain links. No click handler: `LeadTracker` sees
 * every `wa.me` / `t.me` click on the document and takes the placement and the
 * listing from `data-lead-placement` / `data-property-slug` on an ancestor.
 * Hook-free, so it renders from server and client components alike.
 */
export function MessengerButtons({ messengers, ariaLabels, variant = 'pill', className }: Props) {
  if (messengers.length === 0) return null
  return (
    <div className={className ?? (variant === 'pill' ? 'flex gap-2' : 'flex shrink-0 gap-2')}>
      {messengers.map((m) => (
        <a
          key={m.key}
          href={m.url}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={ariaLabels[m.key]}
          title={ariaLabels[m.key]}
          data-messenger={m.key}
          className={variantClass[variant]}
        >
          <Icon
            icon={MESSENGER_ICON[m.key]}
            width={variant === 'icon' ? 22 : 20}
            height={variant === 'icon' ? 22 : 20}
            className="shrink-0 text-primary"
            aria-hidden
          />
          {variant === 'pill' ? <span className="truncate">{MESSENGER_NAME[m.key]}</span> : null}
        </a>
      ))}
    </div>
  )
}
