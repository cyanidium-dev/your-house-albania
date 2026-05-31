import { Icon } from "@iconify/react";
import { resolveLocaleHref } from "@/lib/routes/resolveLocaleHref";
import { SectionCtaLink } from "@/components/landing/sectionPrimitives";
import type { MarketingBenefitItem, MarketingHighlightCard } from "./types";
import {
  DarkBulletList,
  HighlightCardsDark,
  HighlightCardsLight,
  IconBulletList,
  LightBulletList,
  TrustStrip,
} from "./primitives";

type IntroProps = {
  eyebrow?: string;
  title?: string;
  subtitle?: string;
  description?: string;
  benefits?: string[];
  benefitItems?: MarketingBenefitItem[];
  highlightsDisplay?: "list" | "cards";
  highlightCards?: MarketingHighlightCard[];
  supportingText?: string;
  ctaLabel?: string;
  ctaHref?: string;
  secondaryCtaLabel?: string;
  secondaryCtaHref?: string;
  trustStripText?: string;
  locale: string;
  theme: "light" | "dark";
  align?: "start" | "center";
};

export function MarketingIntro({
  eyebrow,
  title,
  subtitle,
  description,
  benefits,
  benefitItems,
  highlightsDisplay = "list",
  highlightCards,
  supportingText,
  ctaLabel,
  ctaHref,
  secondaryCtaLabel,
  secondaryCtaHref,
  trustStripText,
  locale,
  theme,
  align = "start",
}: IntroProps) {
  const href = resolveLocaleHref(ctaHref ?? "", locale);
  const isDark = theme === "dark";
  const textAlign = align === "center" ? "text-center" : "";
  const flexAlign = align === "center" ? "items-center" : "";

  const bullets = benefits ?? [];
  const rich = benefitItems ?? [];
  const useCards =
    highlightsDisplay === "cards" &&
    highlightCards &&
    highlightCards.length > 0;
  const useRichBullets = !useCards && rich.length > 0;
  const showBullets = !useCards && !useRichBullets && bullets.length > 0;

  const showSecondaryCta = Boolean(secondaryCtaLabel?.trim() && secondaryCtaHref?.trim());
  const secondaryHref = showSecondaryCta ? resolveLocaleHref(secondaryCtaHref!, locale) : "";
  const showTrustStrip = Boolean(trustStripText?.trim());

  return (
    <div className={`flex flex-col gap-6 ${flexAlign}`}>
      {eyebrow ? (
        <p
          className={`text-base font-semibold flex gap-2 ${
            isDark
              ? "text-white/80 justify-center"
              : "text-dark/75 dark:text-white/75"
          }`}
        >
          {!isDark ? (
            <Icon
              icon="ph:house-simple-fill"
              className="text-2xl text-primary shrink-0"
            />
          ) : null}
          <span>{eyebrow}</span>
        </p>
      ) : null}
      {title ? (
        <h2
          className={`font-medium leading-[1.2] ${
            isDark
              ? "text-white lg:text-52 md:text-40 text-3xl max-w-3xl"
              : "text-dark dark:text-white lg:text-52 md:text-40 text-3xl"
          } ${textAlign}`}
        >
          {title}
        </h2>
      ) : null}
      {subtitle ? (
        <p
          className={`text-lg md:text-xl leading-snug ${
            isDark
              ? "text-white/85 max-w-3xl"
              : "text-dark/70 dark:text-white/70"
          } ${textAlign}`}
        >
          {subtitle}
        </p>
      ) : null}
      {description ? (
        <p
          className={`text-base ${
            isDark
              ? "text-white/80 max-w-2xl"
              : "text-dark/50 dark:text-white/50"
          } ${textAlign} whitespace-pre-line`}
        >
          {description}
        </p>
      ) : null}
      {useCards && theme === "light" ? (
        <HighlightCardsLight cards={highlightCards!} />
      ) : null}
      {useCards && theme === "dark" ? (
        <HighlightCardsDark cards={highlightCards!} align={align} />
      ) : null}
      {useRichBullets ? (
        <IconBulletList items={rich} theme={theme} />
      ) : null}
      {showBullets && theme === "light" ? (
        <LightBulletList items={bullets} className="flex flex-col gap-3" />
      ) : null}
      {showBullets && theme === "dark" ? (
        <DarkBulletList items={bullets} />
      ) : null}
      {supportingText ? (
        <p
          className={`text-sm ${
            isDark ? "text-white/70" : "text-dark/60 dark:text-white/60"
          } ${textAlign} whitespace-pre-line`}
        >
          {supportingText}
        </p>
      ) : null}
      {ctaLabel && ctaHref ? (
        <div className={`flex flex-wrap items-center gap-3 ${align === "center" ? "justify-center" : ""}`}>
          <SectionCtaLink
            href={href}
            label={ctaLabel}
            variant={isDark ? "light" : "primary"}
          />
          {showSecondaryCta ? (
            <a
              href={secondaryHref}
              className={
                "inline-flex items-center justify-center gap-2 h-11 px-5 rounded-full text-sm font-semibold transition-colors " +
                (isDark
                  ? "text-white/80 hover:text-white"
                  : "text-dark/70 hover:text-dark dark:text-white/80 dark:hover:text-white")
              }
            >
              {secondaryCtaLabel}
              <Icon icon="ph:arrow-right" width={14} height={14} aria-hidden />
            </a>
          ) : null}
        </div>
      ) : null}
      {showTrustStrip ? <TrustStrip text={trustStripText!.trim()} theme={theme} /> : null}
    </div>
  );
}
