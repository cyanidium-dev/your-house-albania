import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: ["en", "uk", "ru", "al", "it"],
  defaultLocale: "en",
  localePrefix: "always",
});
