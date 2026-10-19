'use client'

import Link from '@/components/shared/Link'
import { usePathname } from 'next/navigation'
import { useId, useState, type ReactNode } from 'react'
import { useTranslations } from 'next-intl'
import { SpriteIcon as Icon } from '@/components/shared/SpriteIcon'
import { brandButtonClass } from '@/components/shared/BrandButton'
import InstallMenuButton from '@/components/pwa/InstallMenuButton'
import { useFavorites } from '@/hooks/useFavorites'
import { aiSearchPath } from '@/lib/ai/routes'
import { cn } from '@/lib/utils'
import { PRIMARY_NAV_ITEMS, type BuyMenuData, type GuidesMenuData } from '@/data/navConfig'
import { resolveNavHref } from './navActive'
import DrawerSettings from './DrawerSettings'

type DrawerNavListProps = {
  locale: string
  buyMenu: BuyMenuData
  guidesMenu: GuidesMenuData
  nav: Record<string, string>
  /** Closes the drawer; every link calls it. */
  onNavigate: () => void
  titleId: string
  closeLabel: string
  propertiesHref: string
  viewPropertiesLabel: string
  addPropertyHref: string
  aiSearchEnabled: boolean
}

function stripQuery(path: string): string {
  const i = path.search(/[?#]/)
  return i >= 0 ? path.slice(0, i) : path
}

function isUnder(pathname: string, base: string): boolean {
  const p = stripQuery(pathname).replace(/\/$/, '') || '/'
  const b = stripQuery(base).replace(/\/$/, '') || '/'
  return p === b || p.startsWith(`${b}/`)
}

const ROW =
  'flex min-h-12 w-full items-center gap-3 rounded-xl px-3 text-left text-[17px] font-medium leading-snug transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 hover:bg-dark/[0.04] active:bg-dark/[0.07] dark:hover:bg-white/[0.06] dark:active:bg-white/[0.09]'
const ROW_IDLE = 'text-dark/85 dark:text-white/85'
const ROW_ACTIVE = 'text-primary dark:text-[#5fd3a9]'
const COUNT = 'ml-auto shrink-0 pl-3 text-[14px] font-medium tabular-nums text-dark/45 dark:text-white/45'
const MORE_LINK =
  'flex min-h-12 w-full items-center gap-1.5 rounded-xl px-3 text-[15px] font-semibold text-primary transition-colors hover:bg-primary/[0.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 dark:text-[#5fd3a9]'

function Section({ title, id, children }: { title: string; id: string; children: ReactNode }) {
  return (
    <section aria-labelledby={id} className="pt-7">
      {/* A label, not a heading: the drawer is in the HTML of every page, and
          its h2s came before the page's h1 for anything that reads headings. */}
      <p id={id} className="font-display px-3 pb-2 text-[12px] font-semibold uppercase tracking-[0.12em] text-dark/50 dark:text-white/50">
        {title}
      </p>
      {children}
    </section>
  )
}

/**
 * Everything inside the drawer, redesigned 2026-10-11 from the owner's "the
 * burger menu looks wretched" and a look at eight property sites' phone menus
 * (Rightmove, Zoopla, Daft, Otodom, Redfin, OnTheMarket, Property Finder,
 * Realting):
 *
 * - a light sheet, plain rows on whitespace: no rails, no stripes, no dimmed
 *   grey-on-charcoal text;
 * - the visitor's own things first (AI search, favourites with the count),
 *   then Buy by city with listing counts, property types, Guides topics with
 *   article counts, and the rest;
 * - language, currency and theme as one settings row at the end;
 * - one primary action, "View properties", pinned at the bottom in thumb
 *   reach;
 * - every row at least 48px tall.
 */
export default function DrawerNavList({
  locale,
  buyMenu,
  guidesMenu,
  nav,
  onNavigate,
  titleId,
  closeLabel,
  propertiesHref,
  viewPropertiesLabel,
  addPropertyHref,
  aiSearchEnabled,
}: DrawerNavListProps) {
  const path = usePathname() ?? ''
  const t = useTranslations('Header.drawer')
  const tAi = useTranslations('AiSearch')
  const tPwa = useTranslations('Pwa')
  const { favorites } = useFavorites()
  const [pricesOpen, setPricesOpen] = useState(() => buyMenu.priceCities.some((c) => isUnder(path, c.href)))
  const pricesId = useId()
  const sectionId = useId()

  const rowClass = (active: boolean) => cn(ROW, active ? ROW_ACTIVE : ROW_IDLE)
  const linkItems = PRIMARY_NAV_ITEMS.filter((item) => item.kind === 'link')

  const tile =
    'relative flex min-h-14 min-w-0 items-center gap-3 rounded-2xl bg-dark/[0.04] px-4 text-[15px] font-semibold text-dark transition-colors hover:bg-dark/[0.07] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 dark:bg-white/[0.06] dark:text-white dark:hover:bg-white/[0.1]'
  const tileIcon = 'flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary dark:bg-primary/25 dark:text-[#5fd3a9]'

  return (
    <>
      <div className="flex shrink-0 items-center justify-between gap-3 px-5 pb-1 pt-[max(0.75rem,env(safe-area-inset-top))]">
        <p id={titleId} className="font-display text-[22px] font-semibold tracking-tight">
          {t('title')}
        </p>
        <button
          type="button"
          onClick={onNavigate}
          aria-label={closeLabel}
          data-drawer-initial-focus=""
          className="-mr-1 flex size-11 cursor-pointer items-center justify-center rounded-full bg-dark/[0.05] text-dark transition-colors hover:bg-dark/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 dark:bg-white/10 dark:text-white dark:hover:bg-white/15"
        >
          <Icon icon="ph:x" width={22} height={22} aria-hidden />
        </button>
      </div>

      <div className="no-scrollbar min-h-0 flex-1 overflow-y-auto overflow-x-hidden overscroll-contain px-3 pb-8 pt-3">
        {/* The visitor's own shortcuts. */}
        <div className={cn('grid gap-2 px-2', aiSearchEnabled ? 'grid-cols-2' : 'grid-cols-1')}>
          {aiSearchEnabled ? (
            <Link href={`${aiSearchPath(locale)}?from=header`} className={tile} onClick={onNavigate}>
              <span aria-hidden className={tileIcon}>
                <Icon icon="ph:sparkle" width={18} height={18} />
              </span>
              <span className="min-w-0 truncate">{tAi('headerLink')}</span>
            </Link>
          ) : null}
          <Link href={`/${locale}/favorites`} className={tile} onClick={onNavigate}>
            <span aria-hidden className={tileIcon}>
              <Icon icon="ph:heart" width={18} height={18} />
            </span>
            <span className="min-w-0 truncate">{tPwa('tabFavorites')}</span>
            {favorites.length > 0 ? (
              <span className="ml-auto flex h-6 min-w-6 shrink-0 items-center justify-center rounded-full bg-primary px-1.5 text-[12px] font-semibold tabular-nums text-white">
                {favorites.length > 99 ? '99+' : favorites.length}
              </span>
            ) : null}
          </Link>
        </div>

        <Section title={nav.buy} id={`${sectionId}-buy`}>
          <ul>
            {buyMenu.cities.map((c) => (
              <li key={c.key}>
                <Link href={c.href} className={rowClass(isUnder(path, c.href))} onClick={onNavigate}>
                  <span className="min-w-0 truncate">{c.label}</span>
                  {typeof c.count === 'number' ? <span className={COUNT}>{c.count}</span> : null}
                </Link>
              </li>
            ))}
            {buyMenu.priceCities.length > 0 ? (
              <li>
                <button
                  type="button"
                  className={cn(rowClass(false), 'cursor-pointer')}
                  aria-expanded={pricesOpen}
                  aria-controls={pricesId}
                  onClick={() => setPricesOpen((v) => !v)}
                >
                  <span className="min-w-0 truncate">{nav.prices}</span>
                  <Icon
                    icon="ph:caret-down"
                    width={18}
                    height={18}
                    aria-hidden
                    className={cn('ml-auto shrink-0 text-dark/45 transition-transform duration-200 dark:text-white/50', pricesOpen && 'rotate-180')}
                  />
                </button>
                <ul id={pricesId} hidden={!pricesOpen} className="pb-1 pl-3">
                  {buyMenu.priceCities.map((c) => (
                    <li key={c.key}>
                      <Link
                        href={c.href}
                        className={cn(rowClass(isUnder(path, c.href)), 'text-[16px]')}
                        onClick={onNavigate}
                      >
                        <span className="min-w-0 truncate">{c.label}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </li>
            ) : null}
          </ul>
          <div className="flex flex-wrap gap-x-1">
            <Link href={buyMenu.allListingsHref} className={cn(MORE_LINK, 'w-auto')} onClick={onNavigate}>
              {nav.allListings}
              <Icon icon="ph:arrow-right" width={16} height={16} aria-hidden />
            </Link>
            <Link href={buyMenu.allCitiesHref} className={cn(MORE_LINK, 'w-auto text-dark/70 dark:text-white/70')} onClick={onNavigate}>
              {nav.allCities}
            </Link>
          </div>
        </Section>

        {buyMenu.types.length > 0 ? (
          <Section title={nav.propertyTypes} id={`${sectionId}-types`}>
            <ul className="flex flex-wrap gap-2 px-2">
              {buyMenu.types.map((type) => {
                const active = isUnder(path, type.href)
                return (
                  <li key={type.key}>
                    <Link
                      href={type.href}
                      className={cn(
                        'inline-flex min-h-11 items-center gap-2 rounded-full px-4 text-[15px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50',
                        active
                          ? 'bg-primary text-white'
                          : 'bg-dark/[0.05] text-dark/85 hover:bg-dark/[0.09] dark:bg-white/[0.07] dark:text-white/85 dark:hover:bg-white/[0.12]',
                      )}
                      onClick={onNavigate}
                    >
                      {type.label}
                      {typeof type.count === 'number' ? (
                        <span className={cn('text-[13px] tabular-nums', active ? 'text-white/80' : 'text-dark/45 dark:text-white/45')}>
                          {type.count}
                        </span>
                      ) : null}
                    </Link>
                  </li>
                )
              })}
            </ul>
          </Section>
        ) : null}

        {guidesMenu.topics.length > 0 ? (
          <Section title={nav.guides} id={`${sectionId}-guides`}>
            <ul>
              {guidesMenu.topics.map((topic) => (
                <li key={topic.key}>
                  <Link href={topic.href} className={rowClass(false)} onClick={onNavigate}>
                    {topic.icon ? (
                      <span aria-hidden className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary dark:bg-primary/20 dark:text-[#5fd3a9]">
                        <Icon icon={topic.icon} width={19} height={19} />
                      </span>
                    ) : null}
                    <span className="min-w-0 truncate">{topic.label}</span>
                    {typeof topic.count === 'number' ? <span className={COUNT}>{topic.count}</span> : null}
                  </Link>
                </li>
              ))}
            </ul>
            <Link href={guidesMenu.allGuidesHref} className={cn(MORE_LINK, 'w-auto')} onClick={onNavigate}>
              {nav.allGuides}
              <Icon icon="ph:arrow-right" width={16} height={16} aria-hidden />
            </Link>
          </Section>
        ) : null}

        <Section title={t('more')} id={`${sectionId}-more`}>
          <ul>
            {linkItems.map((item) => {
              const href = resolveNavHref(item.href, locale)
              const label = item.key === 'contacts' ? t('getHelp') : (nav[item.key] ?? item.key)
              return (
                <li key={item.key}>
                  <Link href={href} className={rowClass(isUnder(path, href))} onClick={onNavigate}>
                    <span className="min-w-0 truncate">{label}</span>
                  </Link>
                </li>
              )
            })}
            <li>
              {/* The owner's and the agency's way in: a note on the contact
                  page, not a section of the menu. */}
              <Link href={addPropertyHref} className={rowClass(false)} onClick={onNavigate}>
                <span className="min-w-0 truncate">{nav.addProperty}</span>
              </Link>
            </li>
          </ul>
        </Section>

        <Section title={t('settings')} id={`${sectionId}-settings`}>
          <div className="px-2">
            <DrawerSettings />
            {/* Only where installing works, and never in the app itself. */}
            <InstallMenuButton
              onSelect={onNavigate}
              className="mt-4 min-h-12 w-full justify-center rounded-xl bg-dark/[0.05] text-[15px] font-semibold text-dark no-underline hover:bg-dark/[0.08] hover:text-dark hover:no-underline dark:bg-white/[0.07] dark:text-white dark:hover:bg-white/[0.1] dark:hover:text-white"
            />
          </div>
        </Section>
      </div>

      <div className="shrink-0 px-5 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3 shadow-[0_-16px_24px_-16px_rgba(23,32,35,0.18)] dark:shadow-[0_-16px_24px_-16px_rgba(0,0,0,0.6)]">
        <Link href={propertiesHref} className={brandButtonClass('primary', 'w-full', 'lg')} onClick={onNavigate}>
          <Icon icon="ph:magnifying-glass-bold" width={18} height={18} aria-hidden />
          {viewPropertiesLabel}
        </Link>
      </div>
    </>
  )
}
