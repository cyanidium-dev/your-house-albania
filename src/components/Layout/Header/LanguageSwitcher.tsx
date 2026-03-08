"use client";

import { usePathname, useRouter } from "@/i18n/navigation";
import { useLocale } from "next-intl";
import { useRef, useState } from "react";
import { Icon } from "@iconify/react";

const LOCALE_LABELS: Record<string, string> = {
  en: "EN",
  uk: "UK",
  ru: "RU",
  al: "SQ",
  it: "IT",
};

export default function LanguageSwitcher() {
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const locales = ["en", "uk", "ru", "al", "it"];

  const handleSelect = (newLocale: string) => {
    if (newLocale === locale) {
      setOpen(false);
      return;
    }
    router.replace(pathname, { locale: newLocale });
    setOpen(false);
  };

  return (
    <div ref={ref} className="relative flex items-center">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1 px-2 py-1 rounded-md hover:rounded-xl hover:bg-black/5 dark:hover:bg-white/10 text-lg font-bold duration-300 ease-out cursor-pointer transition-colors"
        aria-label="Select language"
        aria-expanded={open}
      >
        <span>{LOCALE_LABELS[locale] ?? locale.toUpperCase()}</span>
        <Icon
          icon="ph:caret-down"
          width={16}
          height={16}
          className={`transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open && (
        <>
          <div
            className="fixed inset-0 z-40"
            aria-hidden
            onClick={() => setOpen(false)}
          />
          <div
            className="absolute right-0 top-full mt-1 py-1 bg-white dark:bg-dark border border-dark/10 dark:border-white/10 rounded-lg shadow-lg z-50 min-w-[4rem] transition-colors duration-300 ease-out"
            role="listbox"
          >
            {locales.map((loc) => (
              <button
                key={loc}
                type="button"
                role="option"
                aria-selected={loc === locale}
                onClick={() => handleSelect(loc)}
                className={`block w-full text-left px-4 py-2 text-sm hover:bg-primary/10 hover:text-primary cursor-pointer ${
                  loc === locale ? "text-primary font-semibold" : ""
                }`}
              >
                {LOCALE_LABELS[loc]}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
