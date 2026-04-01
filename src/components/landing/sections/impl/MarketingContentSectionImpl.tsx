import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { Icon } from "@iconify/react";
import { cn } from "@/lib/utils";

export type MarketingVariant = "split" | "splitDark" | "grouped";

/** Structured highlight row (investment-style stats cards). */
export type MarketingHighlightCard = {
  value: string;
  label: string;
  description?: string;
};

export type MarketingContentGroup = {
  groupTitle?: string;
  description?: string;
  /** Per-group mode; default `list` when omitted. */
  groupDisplay?: "list" | "cards";
  bullets?: string[];
  /** Resolved card rows for `groupDisplay === 'cards'`. */
  groupCards?: MarketingHighlightCard[];
};

export type MarketingContentData = {
  variant: MarketingVariant;
  eyebrow?: string;
  title?: string;
  subtitle?: string;
  description?: string;
  supportingText?: string;
  benefits?: string[];
  /** Default `list` when omitted in CMS. */
  highlightsDisplay?: "list" | "cards";
  highlightCards?: MarketingHighlightCard[];
  ctaLabel?: string;
  ctaHref?: string;
  mediaMode?: "none" | "fallback" | "custom";
  /** Large-screen column order when a media column exists (`split` / `grouped`). */
  mediaSide?: "left" | "right";
  /** Split `custom` + grouped `custom` intro: max two URLs used in UI. */
  images?: Array<{ url: string; alt?: string }>;
  promoMediaType?: "image" | "video";
  splitDarkImageUrl?: string;
  splitDarkImageAlt?: string;
  videoUrl?: string;
  /** Grouped variant only: intro media below copy, above `contentGroups`. */
  groupedMediaMode?: "none" | "default" | "custom";
  contentGroups?: MarketingContentGroup[];
};

const SPLIT_PRIMARY_FALLBACK = "/images/investment/primary-fallback.jpg";
const SPLIT_SECONDARY_FALLBACK = "/images/investment/secondary-fallback.jpg";

function marketingCtaHref(locale: string, href: string | undefined): string {
  if (!href) return "#";
  if (
    href.startsWith("http://") ||
    href.startsWith("https://") ||
    href.startsWith("mailto:") ||
    href.startsWith("tel:") ||
    href.startsWith("#")
  ) {
    return href;
  }
  if (href.startsWith("/")) return `/${locale}${href}`;
  return `/${locale}/${href}`;
}

function LightBulletList({
  items,
  className,
}: {
  items: string[];
  className?: string;
}) {
  if (items.length === 0) return null;
  return (
    <ul className={className ?? "flex flex-col gap-3"}>
      {items.map((b, i) => (
        <li
          key={i}
          className="flex items-start gap-2 text-dark dark:text-white text-base"
        >
          <span className="w-2 h-2 rounded-full bg-primary shrink-0 mt-1.5" />
          {b}
        </li>
      ))}
    </ul>
  );
}

function DarkBulletList({ items }: { items: string[] }) {
  if (items.length === 0) return null;
  return (
    <ul className="flex flex-col gap-2 text-white/90 text-center max-w-xl">
      {items.map((b, i) => (
        <li key={i} className="flex items-center justify-center gap-2">
          <span className="w-2 h-2 rounded-full bg-white shrink-0" />
          {b}
        </li>
      ))}
    </ul>
  );
}

/** Mirrors `InvestmentSectionImpl` stats grid; optional description for marketing cards. */
function HighlightCardsLight({ cards }: { cards: MarketingHighlightCard[] }) {
  if (cards.length === 0) return null;
  return (
    <div className="grid grid-cols-2 gap-3">
      {cards.map((c, idx) => (
        <div
          key={`${c.label}-${c.value}-${idx}`}
          className="rounded-xl border border-dark/10 dark:border-white/20 bg-white/60 dark:bg-white/5 p-3"
        >
          {c.value && c.label ? (
            <>
              <div className="text-lg font-semibold text-dark dark:text-white">
                {c.value}
              </div>
              <div className="text-xs text-dark/60 dark:text-white/60">
                {c.label}
              </div>
            </>
          ) : (
            <div className="text-lg font-semibold text-dark dark:text-white">
              {c.value || c.label}
            </div>
          )}
          {c.description ? (
            <div className="mt-2 text-xs text-dark/50 dark:text-white/50 leading-snug whitespace-pre-line">
              {c.description}
            </div>
          ) : null}
        </div>
      ))}
    </div>
  );
}

function HighlightCardsDark({
  cards,
  align,
}: {
  cards: MarketingHighlightCard[];
  align?: "start" | "center";
}) {
  if (cards.length === 0) return null;
  const textAlign = align === "center" ? "text-center" : "";
  return (
    <div
      className={`grid grid-cols-2 gap-3 max-w-2xl w-full ${
        align === "center" ? "mx-auto" : ""
      }`}
    >
      {cards.map((c, idx) => (
        <div
          key={`${c.label}-${c.value}-${idx}`}
          className={`rounded-xl border border-white/20 bg-white/10 p-3 ${textAlign}`}
        >
          {c.value && c.label ? (
            <>
              <div className="text-lg font-semibold text-white">{c.value}</div>
              <div className="text-xs text-white/60">{c.label}</div>
            </>
          ) : (
            <div className="text-lg font-semibold text-white">
              {c.value || c.label}
            </div>
          )}
          {c.description ? (
            <div className="mt-2 text-xs text-white/50 leading-snug whitespace-pre-line">
              {c.description}
            </div>
          ) : null}
        </div>
      ))}
    </div>
  );
}

type IntroProps = {
  eyebrow?: string;
  title?: string;
  subtitle?: string;
  description?: string;
  benefits?: string[];
  highlightsDisplay?: "list" | "cards";
  highlightCards?: MarketingHighlightCard[];
  supportingText?: string;
  ctaLabel?: string;
  ctaHref?: string;
  locale: string;
  theme: "light" | "dark";
  align?: "start" | "center";
};

function MarketingIntro({
  eyebrow,
  title,
  subtitle,
  description,
  benefits,
  highlightsDisplay = "list",
  highlightCards,
  supportingText,
  ctaLabel,
  ctaHref,
  locale,
  theme,
  align = "start",
}: IntroProps) {
  const href = marketingCtaHref(locale, ctaHref);
  const isDark = theme === "dark";
  const textAlign = align === "center" ? "text-center" : "";
  const flexAlign = align === "center" ? "items-center" : "";

  const bullets = benefits ?? [];
  const useCards =
    highlightsDisplay === "cards" &&
    highlightCards &&
    highlightCards.length > 0;
  const showBullets = !useCards && bullets.length > 0;

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
        <Link
          href={href}
          className={
            isDark
              ? "bg-white py-4 px-8 rounded-full text-dark hover:bg-primary hover:text-white duration-300 w-fit"
              : "bg-primary py-4 px-8 rounded-full text-white hover:bg-dark duration-300 w-fit"
          }
        >
          {ctaLabel}
        </Link>
      ) : null}
    </div>
  );
}

function SplitVariant({
  locale,
  data,
}: {
  locale: string;
  data: MarketingContentData;
}) {
  const mode = data.mediaMode ?? "none";
  const customImages = (data.images ?? []).slice(0, 2);
  const hasCustom = mode === "custom" && customImages.length > 0;
  const useFallback = mode === "fallback";
  const showMediaColumn = hasCustom || useFallback;
  const mediaSideRight = data.mediaSide === "right";

  const benefits = data.benefits ?? [];

  if (!showMediaColumn) {
    return (
      <section className="py-16 md:py-24">
        <div className="container max-w-8xl mx-auto px-5 2xl:px-0">
          <div className="max-w-3xl">
            <MarketingIntro
              locale={locale}
              theme="light"
              eyebrow={data.eyebrow}
              title={data.title}
              subtitle={data.subtitle}
              description={data.description}
              benefits={benefits}
              highlightsDisplay={data.highlightsDisplay}
              highlightCards={data.highlightCards}
              supportingText={data.supportingText}
              ctaLabel={data.ctaLabel}
              ctaHref={data.ctaHref}
            />
          </div>
        </div>
      </section>
    );
  }

  /** Matches `InvestmentSectionImpl` image column + copy column spacing (fallback media only). */
  if (useFallback) {
    const primaryAlt = data.title || "Marketing";
    const secondaryAlt = data.title || "Marketing";
    const mediaBlock = (
      <div className="grid grid-cols-2 gap-4">
        <div className="relative rounded-2xl overflow-hidden aspect-[320/386]">
          <Image
            src={SPLIT_PRIMARY_FALLBACK}
            alt={primaryAlt}
            fill
            className="object-cover object-center"
            sizes="25vw"
            unoptimized={false}
          />
        </div>
        <div className="relative rounded-2xl overflow-hidden aspect-[320/386]">
          <Image
            src={SPLIT_SECONDARY_FALLBACK}
            alt={secondaryAlt}
            fill
            className="object-cover object-center"
            sizes="25vw"
            unoptimized={false}
          />
        </div>
      </div>
    );
    const copyBlock = (
      <div className="flex flex-col justify-start gap-8">
        <MarketingIntro
          locale={locale}
          theme="light"
          eyebrow={data.eyebrow}
          title={data.title}
          subtitle={data.subtitle}
          description={data.description}
          benefits={benefits}
          highlightsDisplay={data.highlightsDisplay}
          highlightCards={data.highlightCards}
          supportingText={data.supportingText}
          ctaLabel={data.ctaLabel}
          ctaHref={data.ctaHref}
        />
      </div>
    );
    return (
      <section className="py-16 md:py-24">
        <div className="container max-w-8xl mx-auto px-5 2xl:px-0">
          <div className="grid lg:grid-cols-2 gap-10">
            <div
              className={cn(
                "order-1 min-w-0",
                mediaSideRight ? "lg:order-2" : "lg:order-1",
              )}
            >
              {mediaBlock}
            </div>
            <div
              className={cn(
                "order-2 min-w-0",
                mediaSideRight ? "lg:order-1" : "lg:order-2",
              )}
            >
              {copyBlock}
            </div>
          </div>
        </div>
      </section>
    );
  }

  const showPrimary = customImages[0];
  const showSecondary = customImages[1];

  const mediaBlock = (
    <div
      className={cn(
        "grid gap-4",
        showPrimary && showSecondary ? "grid-cols-2" : "grid-cols-1",
      )}
    >
      {showPrimary ? (
        <div
          className={cn(
            "relative rounded-2xl overflow-hidden aspect-[320/386]",
            !showSecondary && "lg:col-span-2 max-w-lg mx-auto lg:max-w-none w-full",
          )}
        >
          <Image
            src={showPrimary.url}
            alt={showPrimary.alt || data.title || "Marketing"}
            fill
            className="object-cover object-center"
            sizes="(max-width: 1023px) 100vw, 25vw"
            unoptimized={showPrimary.url.startsWith("http")}
          />
        </div>
      ) : null}
      {showSecondary ? (
        <div className="relative rounded-2xl overflow-hidden aspect-[320/386]">
          <Image
            src={showSecondary.url}
            alt={showSecondary.alt || data.title || "Marketing"}
            fill
            className="object-cover object-center"
            sizes="25vw"
            unoptimized={showSecondary.url.startsWith("http")}
          />
        </div>
      ) : null}
    </div>
  );

  const copyBlock = (
    <div className="flex flex-col justify-start gap-8 lg:px-4">
      <MarketingIntro
        locale={locale}
        theme="light"
        eyebrow={data.eyebrow}
        title={data.title}
        subtitle={data.subtitle}
        description={data.description}
        benefits={benefits}
        highlightsDisplay={data.highlightsDisplay}
        highlightCards={data.highlightCards}
        supportingText={data.supportingText}
        ctaLabel={data.ctaLabel}
        ctaHref={data.ctaHref}
      />
    </div>
  );

  return (
    <section className="py-16 md:py-24">
      <div className="container max-w-8xl mx-auto px-5 2xl:px-0">
        <div className="grid lg:grid-cols-2 gap-10">
          <div
            className={cn(
              "order-1 min-w-0",
              mediaSideRight ? "lg:order-2" : "lg:order-1",
            )}
          >
            {mediaBlock}
          </div>
          <div
            className={cn(
              "order-2 min-w-0",
              mediaSideRight ? "lg:order-1" : "lg:order-2",
            )}
          >
            {copyBlock}
          </div>
        </div>
      </div>
    </section>
  );
}

function SplitDarkVariant({
  locale,
  data,
}: {
  locale: string;
  data: MarketingContentData;
}) {
  const mode = data.mediaMode ?? "none";
  const promoMediaType = data.promoMediaType;
  const imgUrl = data.splitDarkImageUrl;
  const vidUrl = data.videoUrl;

  const showImageBg =
    mode === "custom" && promoMediaType === "image" && Boolean(imgUrl);
  const showVideoBg =
    mode === "custom" && promoMediaType === "video" && Boolean(vidUrl);

  return (
    <section className="py-16 md:py-24">
      <div className="container max-w-8xl mx-auto px-5 2xl:px-0">
        <div className="relative rounded-2xl overflow-hidden border border-dark/10 dark:border-white/20 bg-dark/90 dark:bg-black py-12 px-6 md:px-10">
          {showImageBg ? (
            <div className="absolute inset-0 -z-10">
              <Image
                src={imgUrl!}
                alt={data.splitDarkImageAlt || data.title || "Marketing"}
                fill
                className="object-cover object-center"
                unoptimized={imgUrl!.startsWith("http")}
              />
              <div className="absolute inset-0 bg-black/45" />
            </div>
          ) : null}
          {showVideoBg ? (
            <div className="absolute inset-0 -z-10">
              <video
                className="w-full h-full object-cover object-center"
                autoPlay
                loop
                muted
                playsInline
                aria-label="Marketing video"
              >
                <source src={vidUrl} />
              </video>
              <div className="absolute inset-0 bg-black/45" />
            </div>
          ) : null}
          <div className="flex flex-col items-center gap-8 relative z-10">
            <MarketingIntro
              locale={locale}
              theme="dark"
              align="center"
              eyebrow={data.eyebrow}
              title={data.title}
              subtitle={data.subtitle}
              description={data.description}
              benefits={data.benefits ?? []}
              highlightsDisplay={data.highlightsDisplay}
              highlightCards={data.highlightCards}
              supportingText={data.supportingText}
              ctaLabel={data.ctaLabel}
              ctaHref={data.ctaHref}
            />
          </div>
        </div>
      </div>
    </section>
  );
}

function groupHasHighlights(g: MarketingContentGroup): boolean {
  const bullets = g.bullets ?? [];
  const groupCards = g.groupCards ?? [];
  const wantsCards = g.groupDisplay === "cards";
  if (wantsCards && groupCards.length > 0) return true;
  if (bullets.length > 0) return true;
  return false;
}

/** True when grouped layout should use a 2-column split (media + content) on large screens. */
function groupedMediaHasRenderableContent(data: MarketingContentData): boolean {
  const mode = data.groupedMediaMode ?? "none";
  if (mode === "none") return false;
  if (mode === "default") return true;
  if (mode === "custom") {
    const imgs = (data.images ?? []).slice(0, 2);
    return imgs.length > 0;
  }
  return false;
}

/** Grouped variant only: media column when `groupedMediaMode` is default or custom with images. */
function GroupedIntroMedia({ data }: { data: MarketingContentData }) {
  const mode = data.groupedMediaMode ?? "none";
  if (mode === "none") return null;

  const titleAlt = data.title || "Marketing";

  if (mode === "default") {
    return (
      <div className="grid grid-cols-2 gap-4 w-full">
        <div className="relative w-full rounded-2xl overflow-hidden aspect-[3/4] max-h-[min(72vh,520px)]">
          <Image
            src={SPLIT_PRIMARY_FALLBACK}
            alt={titleAlt}
            fill
            className="object-cover object-center"
            sizes="(max-width: 1024px) 45vw, 33vw"
          />
        </div>
        <div className="relative w-full rounded-2xl overflow-hidden aspect-[3/4] max-h-[min(72vh,520px)]">
          <Image
            src={SPLIT_SECONDARY_FALLBACK}
            alt={titleAlt}
            fill
            className="object-cover object-center"
            sizes="(max-width: 1024px) 45vw, 33vw"
          />
        </div>
      </div>
    );
  }

  if (mode === "custom") {
    const imgs = (data.images ?? []).slice(0, 2);
    if (imgs.length === 0) return null;
    if (imgs.length === 1) {
      const img = imgs[0]!;
      return (
        <div className="relative w-full max-w-[min(100%,420px)] lg:max-w-none mx-auto lg:mx-0 rounded-2xl overflow-hidden aspect-[3/4] max-h-[min(72vh,560px)]">
          <Image
            src={img.url}
            alt={img.alt || titleAlt}
            fill
            className="object-cover object-center"
            sizes="(max-width: 1024px) 100vw, 40vw"
            unoptimized={img.url.startsWith("http")}
          />
        </div>
      );
    }
    const a = imgs[0]!;
    const b = imgs[1]!;
    return (
      <div className="grid grid-cols-2 gap-4 w-full">
        <div className="relative w-full rounded-2xl overflow-hidden aspect-[3/4] max-h-[min(72vh,520px)]">
          <Image
            src={a.url}
            alt={a.alt || titleAlt}
            fill
            className="object-cover object-center"
            sizes="(max-width: 1024px) 45vw, 33vw"
            unoptimized={a.url.startsWith("http")}
          />
        </div>
        <div className="relative w-full rounded-2xl overflow-hidden aspect-[3/4] max-h-[min(72vh,520px)]">
          <Image
            src={b.url}
            alt={b.alt || titleAlt}
            fill
            className="object-cover object-center"
            sizes="(max-width: 1024px) 45vw, 33vw"
            unoptimized={b.url.startsWith("http")}
          />
        </div>
      </div>
    );
  }

  return null;
}

/** Per-group highlights: cards when `groupDisplay === 'cards'` and cards exist; else bullets; cards mode with no cards falls back to bullets. */
function GroupedGroupHighlights({ group }: { group: MarketingContentGroup }) {
  const bullets = group.bullets ?? [];
  const groupCards = group.groupCards ?? [];
  const wantsCards = group.groupDisplay === "cards";
  const validCards = groupCards.length > 0;
  if (wantsCards && validCards) {
    return <HighlightCardsLight cards={groupCards} />;
  }
  if (bullets.length > 0) {
    return <LightBulletList items={bullets} className="flex flex-col gap-3" />;
  }
  return null;
}

function GroupedVariant({
  locale,
  data,
}: {
  locale: string;
  data: MarketingContentData;
}) {
  const groups = data.contentGroups ?? [];
  const hasMediaColumn = groupedMediaHasRenderableContent(data);
  const mediaSideRight = data.mediaSide === "right";

  const introBlock = (
    <div className="flex flex-col gap-4">
      {data.eyebrow ? (
        <p className="text-dark/75 dark:text-white/75 text-base font-semibold flex gap-2">
          <Icon
            icon="ph:house-simple-fill"
            className="text-2xl text-primary shrink-0"
          />
          {data.eyebrow}
        </p>
      ) : null}
      {data.title ? (
        <h2 className="lg:text-52 text-40 font-medium text-dark dark:text-white leading-[1.2]">
          {data.title}
        </h2>
      ) : null}
      {data.subtitle?.trim() ? (
        <p className="text-lg md:text-xl text-dark/70 dark:text-white/70 leading-snug whitespace-pre-line">
          {data.subtitle}
        </p>
      ) : null}
      {data.description ? (
        <p className="text-dark/50 dark:text-white/50 text-base whitespace-pre-line">
          {data.description}
        </p>
      ) : null}
    </div>
  );

  const groupsBlock = (
    <div className="grid gap-8 md:gap-10">
      {groups.map((g, idx) => {
        const hasTitle = Boolean(g.groupTitle?.trim());
        const hasDesc = Boolean(g.description?.trim());
        return (
          <div
            key={`group-${idx}-${g.groupTitle ?? ""}`}
            className="flex flex-col gap-5"
          >
            {hasTitle ? (
              <h3 className="text-xl md:text-2xl font-medium text-dark dark:text-white">
                {g.groupTitle}
              </h3>
            ) : null}
            {hasDesc ? (
              <p className="text-dark/60 dark:text-white/60 text-base leading-relaxed whitespace-pre-line">
                {g.description}
              </p>
            ) : null}
            {groupHasHighlights(g) ? (
              <GroupedGroupHighlights group={g} />
            ) : null}
          </div>
        );
      })}
    </div>
  );

  const supportingBlock =
    data.supportingText?.trim() ? (
      <p className="text-dark/60 dark:text-white/60 text-sm leading-relaxed whitespace-pre-line">
        {data.supportingText}
      </p>
    ) : null;

  const ctaBlock =
    data.ctaLabel && data.ctaHref ? (
      <div>
        <Link
          href={marketingCtaHref(locale, data.ctaHref)}
          className="inline-flex bg-primary py-4 px-8 rounded-full text-white hover:bg-dark duration-300"
        >
          {data.ctaLabel}
        </Link>
      </div>
    ) : null;

  const contentColumn = (
    <div className="flex flex-col gap-8 md:gap-10 min-w-0">
      {introBlock}
      {groupsBlock}
      {supportingBlock}
      {ctaBlock}
    </div>
  );

  return (
    <section className="py-16 md:py-24">
      <div className="container max-w-8xl mx-auto px-5 2xl:px-0">
        {hasMediaColumn ? (
          <div className="grid lg:grid-cols-2 gap-10 lg:items-start">
            <div
              className={cn(
                "w-full min-w-0 order-1",
                mediaSideRight ? "lg:order-2" : "lg:order-1",
              )}
            >
              <GroupedIntroMedia data={data} />
            </div>
            <div
              className={cn(
                "w-full min-w-0 order-2",
                mediaSideRight ? "lg:order-1" : "lg:order-2",
              )}
            >
              {contentColumn}
            </div>
          </div>
        ) : (
          <div className="max-w-3xl mx-auto flex flex-col gap-8 md:gap-10">
            {introBlock}
            {groupsBlock}
            {supportingBlock}
            {ctaBlock}
          </div>
        )}
      </div>
    </section>
  );
}

const MarketingContentSectionImpl: React.FC<{
  locale: string;
  data: MarketingContentData;
}> = ({ locale, data }) => {
  if (data.variant === "grouped") {
    return <GroupedVariant locale={locale} data={data} />;
  }
  if (data.variant === "splitDark") {
    return <SplitDarkVariant locale={locale} data={data} />;
  }
  return <SplitVariant locale={locale} data={data} />;
};

export default MarketingContentSectionImpl;
