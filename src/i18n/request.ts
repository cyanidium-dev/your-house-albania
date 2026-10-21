import { getRequestConfig } from "next-intl/server";
import { hasLocale } from "next-intl";
import { routing } from "./routing";
import { isPartialLocale } from "@/lib/seo/localeIndexing";

type Messages = Record<string, unknown>;

/** `base` with `over` on top, key by key: a key missing from `over` keeps the base value. */
function withFallback(base: Messages, over: Messages): Messages {
  const out: Messages = { ...base };
  for (const [key, value] of Object.entries(over)) {
    const prev = out[key];
    out[key] =
      value && typeof value === "object" && !Array.isArray(value) && prev && typeof prev === "object" && !Array.isArray(prev)
        ? withFallback(prev as Messages, value as Messages)
        : value;
  }
  return out;
}

export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;
  const locale = hasLocale(routing.locales, requested)
    ? requested
    : routing.defaultLocale;

  const messages = (await import(`../../messages/${locale}.json`)).default as Messages;
  // A partial locale (the French pilot) falls back to English for a key it
  // does not have yet, so a string added in another PR shows in English on
  // its noindexed pages instead of breaking them. Complete locales stay strict.
  if (isPartialLocale(locale)) {
    const en = (await import("../../messages/en.json")).default as Messages;
    return { locale, messages: withFallback(en, messages) };
  }
  return { locale, messages };
});
