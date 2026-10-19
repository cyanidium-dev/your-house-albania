"use client";

import { useTranslations } from "next-intl";
import { brandButtonClass } from "@/components/shared/BrandButton";
import { SpriteIcon as Icon } from "@/components/shared/SpriteIcon";
import { cn } from "@/lib/utils";

type Props = {
  /** The bot deep link with the page's search encoded (`s_…`, see startPayload). */
  href: string;
  /** `bar`: one row above the cards. `panel`: the block of the empty state. */
  variant?: "bar" | "panel";
  className?: string;
};

/**
 * "New listings for this search, in Telegram": the link opens the public bot
 * with the search in its Start payload, so one tap is the subscription
 * (src/lib/telegram/bot/search.ts). `data-messenger-direct` keeps the
 * messenger sheet out of the way: there is nothing to write, only Start.
 */
export function CatalogSearchAlert({ href, variant = "bar", className }: Props) {
  const t = useTranslations("Catalog.searchAlert");
  const shell =
    "rounded-2xl border border-primary/15 bg-primary/[0.06] dark:border-primary/25 dark:bg-primary/10";

  if (variant === "bar") {
    return (
      <div
        data-lead-placement="catalog"
        data-messenger-direct
        className={cn(shell, "mb-4 flex flex-wrap items-center gap-x-4 gap-y-3 px-4 py-3", className)}
      >
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-white">
          <Icon icon="ph:telegram-logo" width={20} height={20} />
        </span>
        <p className="min-w-[12rem] flex-1 text-sm font-medium text-dark dark:text-white">{t("barText")}</p>
        <a
          href={href}
          target="_blank"
          rel="noopener"
          className={brandButtonClass("primary", "ml-auto shrink-0", "sm")}
        >
          {t("cta")}
        </a>
      </div>
    );
  }

  return (
    <div
      data-lead-placement="catalog"
      data-messenger-direct
      className={cn(shell, "mx-auto flex max-w-xl flex-col items-center gap-4 px-6 py-8 text-center", className)}
    >
      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-white">
        <Icon icon="ph:telegram-logo" width={26} height={26} />
      </span>
      <div className="space-y-2">
        <h3 className="text-lg font-semibold text-dark dark:text-white">{t("title")}</h3>
        <p className="text-sm text-dark/70 dark:text-white/70">{t("body")}</p>
      </div>
      <a href={href} target="_blank" rel="noopener" className={brandButtonClass("primary", undefined, "md")}>
        {t("ctaLong")}
      </a>
    </div>
  );
}
