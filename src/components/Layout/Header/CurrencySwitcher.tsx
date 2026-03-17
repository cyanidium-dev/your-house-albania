"use client"

import * as React from 'react'
import * as Select from '@radix-ui/react-select'
import { Icon } from '@iconify/react'
import { useTranslations } from 'next-intl'
import { useCurrency } from '@/contexts/CurrencyContext'
import { cn } from '@/lib/utils'
import { CURRENCIES, getCurrencyMeta } from '@/lib/currency/registry'

export default function CurrencySwitcher() {
  const t = useTranslations('Currency')
  const { currency, setCurrency } = useCurrency()
  const meta = getCurrencyMeta(currency)

  return (
    <div className="min-w-0">
      <Select.Root value={currency} onValueChange={(v) => setCurrency(v as never)}>
        <Select.Trigger
          className={cn(
            'relative inline-flex h-8 items-center justify-between gap-1.5 rounded-full',
            'bg-dark/5 dark:bg-white/10',
            'px-2.5 pr-8',
            'text-sm font-semibold text-dark/80 dark:text-white/80',
            'cursor-pointer transition-colors hover:bg-dark/10 dark:hover:bg-white/15',
            'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-inset'
          )}
          aria-label={t('switchTo', { currency })}
        >
          <Select.Value asChild>
            <span className="inline-flex items-center gap-1 min-w-0">
              <span className="shrink-0">{meta.symbol}</span>
              <span className="truncate">{meta.code}</span>
            </span>
          </Select.Value>
          <Select.Icon className="absolute right-2.5 top-1/2 -translate-y-1/2 text-dark/60 dark:text-white/70 pointer-events-none">
            <Icon icon="ph:caret-down" width={14} height={14} />
          </Select.Icon>
        </Select.Trigger>
        <Select.Portal>
          <Select.Content
            position="popper"
            side="bottom"
            align="end"
            sideOffset={8}
            collisionPadding={16}
            className={cn(
              'z-[100] overflow-hidden rounded-2xl border border-dark/10 dark:border-white/10 shadow-3xl',
              'bg-white dark:bg-dark',
              'w-[var(--radix-select-trigger-width)] max-w-[calc(100vw-2rem)]',
              'data-[state=open]:animate-in data-[state=closed]:animate-out',
              'data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0',
              'data-[state=open]:zoom-in-95 data-[state=closed]:zoom-out-95',
              'data-[side=bottom]:slide-in-from-top-2 data-[side=top]:slide-in-from-bottom-2'
            )}
          >
            <Select.Viewport className="py-1 text-sm max-h-[var(--radix-select-content-available-height)] overflow-y-auto">
              {CURRENCIES.map((c) => (
                <Select.Item
                  key={c.code}
                  value={c.code}
                  className={cn(
                    'px-3 py-1.5 cursor-pointer text-dark dark:text-white outline-none',
                    'hover:bg-primary/15 dark:hover:bg-primary/25 hover:text-primary'
                  )}
                >
                  <Select.ItemText>
                    <span className="inline-flex items-center gap-2">
                      <span className="w-4 text-center">{c.symbol}</span>
                      <span className="font-semibold">{c.code}</span>
                    </span>
                  </Select.ItemText>
                </Select.Item>
              ))}
            </Select.Viewport>
          </Select.Content>
        </Select.Portal>
      </Select.Root>
    </div>
  )
}

