"use client";

import { usePathname, useRouter } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { useLocale, useTranslations } from "next-intl";
import { useRef, useState } from "react";
import { Icon } from "@iconify/react";
import { cn } from "@/lib/utils";

export default function LanguageSwitcher() {
  const locale = useLocale();
  const t = useTranslations("Header");
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const locales = routing.locales;

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
      {/* Deliberately the same pill, size and type scale as CurrencySwitcher:
          the two sit side by side, and the old `text-lg font-bold` made this
          one shout next to it while eating room the logo needed. */}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={cn(
          'relative inline-flex h-8 items-center justify-between gap-1.5 rounded-full',
          'bg-dark/5 dark:bg-white/10',
          'px-2.5 pr-7 sm:pr-8',
          'text-sm font-semibold text-dark/80 dark:text-white/80',
          'cursor-pointer transition-colors hover:bg-dark/10 dark:hover:bg-white/15',
          'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-inset'
        )}
        aria-label={t("selectLanguage")}
        aria-expanded={open}
        aria-haspopup="listbox"
      >
        <span>{locale.toUpperCase()}</span>
        <Icon
          icon="ph:caret-down"
          width={14}
          height={14}
          className={cn(
            'absolute right-2.5 top-1/2 -translate-y-1/2 text-dark/60 dark:text-white/70 pointer-events-none transition-transform',
            open && 'rotate-180'
          )}
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
                {loc.toUpperCase()}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
