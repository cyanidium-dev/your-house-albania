import Image from "next/image";
import { Icon } from "@iconify/react";
import { resolveCta } from "@/lib/routes/resolveLocaleHref";
import { cn } from "@/lib/utils";
import { SectionCtaLink } from "@/components/landing/sectionPrimitives";
import type { MarketingContentData, MarketingContentGroup } from "./types";
import { SPLIT_PRIMARY_FALLBACK, SPLIT_SECONDARY_FALLBACK } from "./types";
import { HighlightCardsLight, LightBulletList } from "./primitives";

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

export function GroupedVariant({
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

  const cta = resolveCta(data.ctaLabel, data.ctaHref, locale);
  const ctaBlock = cta ? (
    <div>
      <SectionCtaLink href={cta.href} label={cta.label} />
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
