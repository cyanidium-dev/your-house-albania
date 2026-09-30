import type { AbstractIntlMessages } from "next-intl";

/**
 * The message namespaces client components read through `useTranslations`.
 *
 * `NextIntlClientProvider` serialises whatever it is given into every page's
 * HTML and the browser parses it again on hydration. The full catalogue is
 * 40 kB per page, and server components never read it from the provider:
 * they get their messages from `i18n/request.ts`. So the layout sends only
 * these namespaces, about half the size (measured 2026-09-30).
 *
 * A client component that reads a namespace missing here renders the message
 * key instead of the text. `__tests__/clientMessages.test.ts` walks the
 * client import graph and fails when a namespace used there is not listed,
 * so extend this list when the test says so.
 */
export const CLIENT_MESSAGE_NAMESPACES = [
  "AiSearch",
  "Blog",
  "Calculators",
  "Catalog",
  "Contacts",
  "Currency",
  "DurresGuide",
  "Favorites",
  "Footer",
  "Header",
  "Home",
  "Landing",
  "PropertyMarketPosition",
  "QuickContact",
  "QuickLead",
  "Register",
  "Shared",
] as const;

export function pickClientMessages(messages: AbstractIntlMessages): AbstractIntlMessages {
  const picked: AbstractIntlMessages = {};
  for (const namespace of CLIENT_MESSAGE_NAMESPACES) {
    if (namespace in messages) picked[namespace] = messages[namespace];
  }
  return picked;
}
