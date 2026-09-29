'use client'

import { useTranslations } from 'next-intl'
import { MessengerButtons } from '@/components/contact/MessengerButtons'
import { resolveMessengers } from '@/lib/contacts/messengers'
import { cn } from '@/lib/utils'

type Props = {
  locale: string
  className?: string
}

/**
 * "Or write to us right away": WhatsApp and Telegram under every lead form,
 * so a visitor who will not type an email or a phone number still has a way
 * in. The links are the business contacts (the same the CMS lists), and
 * LeadTracker records the click with the form's `data-lead-placement`.
 * Added 2026-09-29 at the owner's request.
 */
export function LeadMessengerRow({ locale, className }: Props) {
  const t = useTranslations('QuickContact')
  const messengers = resolveMessengers(undefined, locale)
  if (messengers.length === 0) return null
  return (
    <div className={cn('flex flex-col gap-2', className)}>
      <p className="text-xs font-medium text-dark/60 dark:text-white/60">{t('orWrite')}</p>
      <MessengerButtons
        messengers={messengers}
        ariaLabels={{ whatsapp: t('channel.whatsapp'), telegram: t('channel.telegram') }}
        className="flex gap-2 [&>a]:h-10 [&>a]:text-sm"
      />
    </div>
  )
}
