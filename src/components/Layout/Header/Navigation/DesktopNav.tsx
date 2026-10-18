'use client'

import Link from "@/components/shared/Link";
import { usePathname } from 'next/navigation'
import { useCallback, useEffect, useId, useRef, useState, type ReactNode } from 'react'
import { SpriteIcon as Icon } from '@/components/shared/SpriteIcon'
import { PRIMARY_NAV_ITEMS, type BuyMenuData, type GuidesMenuData } from '@/data/navConfig'
import { cn } from '@/lib/utils'
import { isPrimaryNavItemActive, resolveNavHref } from './navActive'

type DesktopNavProps = {
  locale: string
  buyMenu: BuyMenuData
  guidesMenu: GuidesMenuData
  nav: Record<string, string>
  /** Floating over a photo, before the bar has its own background. */
  onPhoto: boolean
  ariaLabel: string
}

type MenuKey = 'buy' | 'guides'
/** How the open menu got opened: a hover closes on leave, a click stays. */
type OpenedBy = 'hover' | 'click'

const OPEN_DELAY_MS = 60
const CLOSE_DELAY_MS = 180

/**
 * The bar's entries at `lg` and up. "Buy" and "Guides" open panels.
 *
 * One interaction model for both (QA 2026-10-11: a click used to shut the
 * panel a hover had just opened):
 * - a mouse hover opens the panel after a short intent delay and closes it a
 *   moment after the pointer leaves, so the pointer can travel into it;
 * - a click on the button pins the panel open; a click on a pinned panel's
 *   button closes it. A click never closes a panel the hover just opened;
 * - touch and keyboard go through the click; ArrowDown opens and moves focus
 *   to the first link;
 * - Escape closes and returns focus to the button, focus leaving the item
 *   (Tab past the last link) closes it, as do an outside click and a route
 *   change.
 */
export default function DesktopNav({ locale, buyMenu, guidesMenu, nav, onPhoto, ariaLabel }: DesktopNavProps) {
  const pathname = usePathname()
  const [open, setOpen] = useState<{ key: MenuKey; by: OpenedBy } | null>(null)
  const navRef = useRef<HTMLElement>(null)
  const openTimer = useRef<number | null>(null)
  const closeTimer = useRef<number | null>(null)
  const buttonRefs = useRef<Partial<Record<MenuKey, HTMLButtonElement | null>>>({})
  const panelRefs = useRef<Partial<Record<MenuKey, HTMLDivElement | null>>>({})

  const clearTimers = useCallback(() => {
    if (openTimer.current !== null) window.clearTimeout(openTimer.current)
    if (closeTimer.current !== null) window.clearTimeout(closeTimer.current)
    openTimer.current = null
    closeTimer.current = null
  }, [])

  const close = useCallback(
    (returnFocusTo?: MenuKey) => {
      clearTimers()
      setOpen(null)
      if (returnFocusTo) buttonRefs.current[returnFocusTo]?.focus()
    },
    [clearTimers],
  )

  useEffect(() => {
    setOpen(null)
  }, [pathname])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close(open.key)
    }
    const onDown = (e: PointerEvent) => {
      if (navRef.current && !navRef.current.contains(e.target as Node)) close()
    }
    document.addEventListener('keydown', onKey)
    document.addEventListener('pointerdown', onDown)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.removeEventListener('pointerdown', onDown)
    }
  }, [open, close])

  useEffect(() => clearTimers, [clearTimers])

  const hoverIn = (key: MenuKey) => {
    if (closeTimer.current !== null) {
      window.clearTimeout(closeTimer.current)
      closeTimer.current = null
    }
    if (open?.key === key) return
    if (openTimer.current !== null) window.clearTimeout(openTimer.current)
    // Moving from one open panel to the other entry switches at once.
    openTimer.current = window.setTimeout(
      () => {
        openTimer.current = null
        setOpen({ key, by: 'hover' })
      },
      open ? 0 : OPEN_DELAY_MS,
    )
  }

  const hoverOut = () => {
    if (openTimer.current !== null) {
      window.clearTimeout(openTimer.current)
      openTimer.current = null
    }
    if (open?.by !== 'hover') return
    closeTimer.current = window.setTimeout(() => {
      closeTimer.current = null
      setOpen((current) => (current?.by === 'hover' ? null : current))
    }, CLOSE_DELAY_MS)
  }

  const onButtonClick = (key: MenuKey) => {
    clearTimers()
    setOpen((current) => {
      if (current?.key !== key) return { key, by: 'click' }
      // The hover opened it; the click is the visitor reaching for it.
      if (current.by === 'hover') return { key, by: 'click' }
      return null
    })
  }

  const onButtonKeyDown = (key: MenuKey, e: React.KeyboardEvent) => {
    if (e.key !== 'ArrowDown') return
    e.preventDefault()
    clearTimers()
    setOpen({ key, by: 'click' })
    window.requestAnimationFrame(() => {
      panelRefs.current[key]?.querySelector<HTMLElement>('a[href]')?.focus()
    })
  }

  const onItemBlur = (key: MenuKey, e: React.FocusEvent<HTMLDivElement>) => {
    const next = e.relatedTarget as Node | null
    if (open?.key === key && next && !e.currentTarget.contains(next)) close()
  }

  const linkClass = (active: boolean) =>
    cn(
      'relative inline-flex h-10 items-center whitespace-nowrap rounded-full px-3.5 text-[15px] font-medium transition-colors duration-200',
      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50',
      onPhoto
        ? cn('text-white/85 hover:bg-white/10 hover:text-white', active && 'text-white')
        : cn(
            'text-dark/75 hover:bg-dark/5 hover:text-dark dark:text-white/75 dark:hover:bg-white/10 dark:hover:text-white',
            active && 'text-dark dark:text-white',
          ),
    )

  const activeBar = (active: boolean) => (
    <span
      aria-hidden
      className={cn(
        'pointer-events-none absolute inset-x-3.5 bottom-1 h-0.5 rounded-full bg-primary transition-opacity duration-200',
        active ? 'opacity-100' : 'opacity-0',
      )}
    />
  )

  const onNavigate = () => close()

  return (
    <nav ref={navRef} aria-label={ariaLabel} className="hidden min-w-0 items-center gap-0.5 lg:flex">
      {PRIMARY_NAV_ITEMS.map((item) => {
        const active = isPrimaryNavItemActive(item, pathname, locale)
        if (item.kind === 'link') {
          return (
            <Link key={item.key} href={resolveNavHref(item.href, locale)} className={linkClass(active)}>
              {nav[item.key] ?? item.key}
              {activeBar(active)}
            </Link>
          )
        }
        const key: MenuKey = item.kind
        const isOpen = open?.key === key
        const labels =
          key === 'buy'
            ? { open: nav.openBuyMenu, close: nav.closeBuyMenu }
            : { open: nav.openGuidesMenu, close: nav.closeGuidesMenu }
        return (
          <MenuItem
            key={key}
            label={nav[key] ?? key}
            ariaLabel={isOpen ? labels.close : labels.open}
            open={isOpen}
            buttonClassName={cn(linkClass(active || isOpen), 'gap-1 pr-2.5')}
            activeBar={activeBar(active)}
            buttonRef={(el) => {
              buttonRefs.current[key] = el
            }}
            panelRef={(el) => {
              panelRefs.current[key] = el
            }}
            onPointerEnter={(e) => {
              if (e.pointerType === 'mouse') hoverIn(key)
            }}
            onPointerLeave={(e) => {
              if (e.pointerType === 'mouse') hoverOut()
            }}
            onButtonClick={() => onButtonClick(key)}
            onButtonKeyDown={(e) => onButtonKeyDown(key, e)}
            onBlur={(e) => onItemBlur(key, e)}
            panelClassName={key === 'buy' ? 'w-[38rem]' : 'w-[44rem]'}
          >
            {key === 'buy' ? (
              <BuyPanel buyMenu={buyMenu} nav={nav} onNavigate={onNavigate} />
            ) : (
              <GuidesPanel guidesMenu={guidesMenu} nav={nav} onNavigate={onNavigate} />
            )}
          </MenuItem>
        )
      })}
    </nav>
  )
}

function MenuItem({
  label,
  ariaLabel,
  open,
  buttonClassName,
  activeBar,
  buttonRef,
  panelRef,
  onPointerEnter,
  onPointerLeave,
  onButtonClick,
  onButtonKeyDown,
  onBlur,
  panelClassName,
  children,
}: {
  label: string
  ariaLabel: string
  open: boolean
  buttonClassName: string
  activeBar: ReactNode
  buttonRef: (el: HTMLButtonElement | null) => void
  panelRef: (el: HTMLDivElement | null) => void
  onPointerEnter: (e: React.PointerEvent) => void
  onPointerLeave: (e: React.PointerEvent) => void
  onButtonClick: () => void
  onButtonKeyDown: (e: React.KeyboardEvent) => void
  onBlur: (e: React.FocusEvent<HTMLDivElement>) => void
  panelClassName: string
  children: ReactNode
}) {
  const panelId = useId()
  return (
    <div className="relative" onPointerEnter={onPointerEnter} onPointerLeave={onPointerLeave} onBlur={onBlur}>
      <button
        ref={buttonRef}
        type="button"
        className={buttonClassName}
        aria-expanded={open}
        aria-controls={panelId}
        aria-label={ariaLabel}
        onClick={onButtonClick}
        onKeyDown={onButtonKeyDown}
      >
        {label}
        <Icon
          icon="ph:caret-down"
          width={16}
          height={16}
          className={cn('transition-transform duration-200', open && 'rotate-180')}
          aria-hidden
        />
        {activeBar}
      </button>

      {/* `hidden` takes the closed panel out of the tab order and the
          accessibility tree. The pt-3 bridge keeps the pointer inside the
          item on its way from the button down to the panel. */}
      <div ref={panelRef} id={panelId} hidden={!open} className="absolute left-0 top-full z-50 pt-3">
        <div
          className={cn(
            'max-w-[calc(100vw-2rem)] origin-top-left rounded-2xl border p-2',
            'border-dark/10 bg-white text-dark shadow-[0_28px_60px_-24px_rgba(23,32,35,0.45)]',
            'dark:border-white/10 dark:bg-[#1b2528] dark:text-white dark:shadow-[0_28px_60px_-20px_rgba(0,0,0,0.7)]',
            'motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-top-1 motion-safe:duration-150',
            panelClassName,
          )}
        >
          {children}
        </div>
      </div>
    </div>
  )
}

const panelLink =
  'flex min-h-10 items-center gap-3 rounded-xl px-3 py-2 text-[15px] font-medium text-dark/85 transition-colors hover:bg-dark/[0.05] hover:text-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 dark:text-white/85 dark:hover:bg-white/[0.07] dark:hover:text-white'
const columnHeading =
  'px-3 pb-1.5 pt-1 text-[11px] font-semibold uppercase tracking-[0.1em] text-dark/50 dark:text-white/50'
const countClass = 'ml-auto shrink-0 pl-3 text-[13px] font-medium tabular-nums text-dark/45 dark:text-white/45'
const footerRow = 'mt-1 flex flex-wrap items-center gap-x-2 border-t border-dark/10 px-1 pt-2 dark:border-white/10'
const primaryLink = cn(panelLink, 'gap-1.5 text-primary hover:text-primary dark:text-[#5fd3a9] dark:hover:text-[#5fd3a9]')

function BuyPanel({ buyMenu, nav, onNavigate }: { buyMenu: BuyMenuData; nav: Record<string, string>; onNavigate: () => void }) {
  return (
    <>
      {/* The main way in, first and unmistakable: every listing. Owner, 14.10:
          "it is not clear what to click to see the properties". */}
      <div className="p-1">
        <Link
          href={buyMenu.allListingsHref}
          className="group flex items-center gap-3 rounded-2xl bg-primary/[0.08] px-3.5 py-3 transition-colors hover:bg-primary/[0.14] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 dark:bg-primary/20 dark:hover:bg-primary/30"
          onClick={onNavigate}
        >
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary text-white" aria-hidden>
            <Icon icon="ph:buildings" width={20} height={20} />
          </span>
          <span className="min-w-0">
            <span className="block text-[15px] font-semibold text-dark dark:text-white">{nav.allListings}</span>
            {nav.allListingsCount ? (
              <span className="block text-[13px] text-dark/60 dark:text-white/60">{nav.allListingsCount}</span>
            ) : null}
          </span>
          <Icon
            icon="ph:arrow-right"
            width={18}
            height={18}
            className="ml-auto shrink-0 text-primary transition-transform group-hover:translate-x-0.5 dark:text-[#5fd3a9]"
            aria-hidden
          />
        </Link>
      </div>
      <div className="grid grid-cols-[1.2fr_1fr] gap-1 p-1">
        <div>
          <p className={columnHeading}>{nav.buyCities}</p>
          <ul>
            {buyMenu.cities.map((c) => (
              <li key={c.key}>
                <Link href={c.href} className={cn(panelLink, 'group')} onClick={onNavigate}>
                  <span className="min-w-0 truncate">{c.label}</span>
                  {typeof c.count === 'number' ? (
                    <span className="ml-auto shrink-0 rounded-full bg-dark/[0.06] px-2 py-0.5 text-[12px] font-semibold tabular-nums text-dark/70 transition-colors group-hover:bg-primary group-hover:text-white dark:bg-white/10 dark:text-white/75">
                      {c.count}
                    </span>
                  ) : null}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        {/* Reading about a city is the second thing, so it looks second. */}
        <div className="rounded-xl bg-dark/[0.03] dark:bg-white/[0.04]">
          <p className={columnHeading}>{nav.buyPrices}</p>
          <ul>
            {buyMenu.priceCities.map((c) => (
              <li key={c.key}>
                <Link href={c.href} className={cn(panelLink, 'text-[14px] text-dark/70 dark:text-white/70')} onClick={onNavigate}>
                  <Icon icon="ph:chart-bar" width={16} height={16} className="shrink-0 text-dark/40 dark:text-white/40" aria-hidden />
                  {c.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
      <div className={footerRow}>
        <Link href={buyMenu.allCitiesHref} className={primaryLink} onClick={onNavigate}>
          {nav.allCities}
          <Icon icon="ph:arrow-right" width={16} height={16} aria-hidden />
        </Link>
      </div>
    </>
  )
}

function GuidesPanel({
  guidesMenu,
  nav,
  onNavigate,
}: {
  guidesMenu: GuidesMenuData
  nav: Record<string, string>
  onNavigate: () => void
}) {
  return (
    <>
      <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)] gap-2 p-1">
        <div>
          <p className={columnHeading}>{nav.guideTopics}</p>
          <ul>
            {guidesMenu.topics.map((topic) => (
              <li key={topic.key}>
                <Link href={topic.href} className={panelLink} onClick={onNavigate}>
                  {topic.icon ? (
                    <span
                      aria-hidden
                      className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary dark:bg-primary/20 dark:text-[#5fd3a9]"
                    >
                      <Icon icon={topic.icon} width={18} height={18} />
                    </span>
                  ) : null}
                  <span className="min-w-0 truncate">{topic.label}</span>
                  {typeof topic.count === 'number' ? <span className={countClass}>{topic.count}</span> : null}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        {guidesMenu.latest.length > 0 ? (
          <div className="rounded-xl bg-dark/[0.03] p-1 dark:bg-white/[0.04]">
            <p className={columnHeading}>{nav.latestGuides}</p>
            <ul>
              {guidesMenu.latest.map((post) => (
                <li key={post.key}>
                  <Link
                    href={post.href}
                    className="group flex flex-col gap-0.5 rounded-xl px-3 py-2.5 transition-colors hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 dark:hover:bg-white/[0.07]"
                    onClick={onNavigate}
                  >
                    <span className="line-clamp-2 text-[14px] font-medium leading-snug text-dark/85 group-hover:text-dark dark:text-white/85 dark:group-hover:text-white">
                      {post.title}
                    </span>
                    {post.dateLabel ? (
                      <span className="text-[12px] text-dark/50 dark:text-white/50">{post.dateLabel}</span>
                    ) : null}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>
      <div className={footerRow}>
        <Link href={guidesMenu.allGuidesHref} className={primaryLink} onClick={onNavigate}>
          {nav.allGuides}
          <Icon icon="ph:arrow-right" width={16} height={16} aria-hidden />
        </Link>
        <Link href={guidesMenu.allArticlesHref} className={panelLink} onClick={onNavigate}>
          {nav.allArticles}
        </Link>
      </div>
    </>
  )
}
