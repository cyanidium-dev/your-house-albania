import 'server-only'

import { getTranslations } from 'next-intl/server'
import { messengerContext, type MessengerProperty } from './messengerContext'
import type { MessengerContext } from './messengers'

/** `messengerContext()` with this locale's `Messengers` messages. */
export async function getMessengerContext(input: {
  locale: string
  placement: string
  property?: MessengerProperty
  pageUrl?: string
}): Promise<MessengerContext> {
  const t = await getTranslations({ locale: input.locale, namespace: 'Messengers' })
  return messengerContext((key, values) => t(key, values), input)
}
