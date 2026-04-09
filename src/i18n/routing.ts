import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: ["en", "uk", "ru", "sq", "it"],
  defaultLocale: "sq",
  localePrefix: "always",
});
