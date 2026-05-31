import Image from "next/image";
import { Icon } from "@iconify/react";
import { resolveLocaleHref } from "@/lib/routes/resolveLocaleHref";
import type { MarketingContentData } from "./types";

export function SplitDarkVariant({
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
  const hasBg = showImageBg || showVideoBg;

  const benefits = data.benefits ?? [];
  const rich = data.benefitItems ?? [];
  const useRichBullets = rich.length > 0;
  const useBullets = !useRichBullets && benefits.length > 0;

  const showPrimaryCta = Boolean(data.ctaLabel?.trim() && data.ctaHref?.trim());
  const showSecondaryCta = Boolean(
    data.secondaryCtaLabel?.trim() && data.secondaryCtaHref?.trim(),
  );
  const primaryHref = showPrimaryCta ? resolveLocaleHref(data.ctaHref!, locale) : "";
  const secondaryHref = showSecondaryCta
    ? resolveLocaleHref(data.secondaryCtaHref!, locale)
    : "";

  // First two highlightCards float over the right column as glassy stat tiles.
  const floatingStats = (data.highlightCards ?? []).slice(0, 2);

  return (
    <section className="py-16 md:py-24">
      <div className="container max-w-8xl mx-auto px-5 2xl:px-0">
        <div className="relative overflow-hidden rounded-3xl bg-dark ring-1 ring-white/10 min-h-[460px] md:min-h-[520px]">
          {/* Background media */}
          {showImageBg ? (
            <div className="absolute inset-0">
              <Image
                src={imgUrl!}
                alt={data.splitDarkImageAlt || data.title || "Marketing"}
                fill
                className="object-cover object-center"
                unoptimized={imgUrl!.startsWith("http")}
              />
            </div>
          ) : null}
          {showVideoBg ? (
            <div className="absolute inset-0">
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
            </div>
          ) : null}

          {/* Side-aligned dark band — copy is readable regardless of bg */}
          {hasBg ? (
            <div
              aria-hidden
              className="absolute inset-y-0 left-0 right-0 lg:right-1/4 bg-gradient-to-r from-dark via-dark/90 to-dark/0"
            />
          ) : null}

          {/* Primary radial glow (only when no media bg, gives the slab life) */}
          {!hasBg ? (
            <>
              <div
                aria-hidden
                className="pointer-events-none absolute -right-32 -top-32 h-[480px] w-[480px] rounded-full bg-primary/20 blur-3xl"
              />
              <div
                aria-hidden
                className="pointer-events-none absolute -left-32 -bottom-32 h-[420px] w-[420px] rounded-full bg-skyblue/15 blur-3xl"
              />
            </>
          ) : null}

          {/* Subtle primary stripe along the bottom */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent"
          />

          <div className="relative grid lg:grid-cols-[1.15fr_1fr] gap-10 lg:gap-12 items-center p-8 sm:p-10 lg:p-14 text-white">
            {/* Left — copy */}
            <div className="flex flex-col gap-6 min-w-0">
              {data.eyebrow ? (
                <p className="text-sm font-semibold tracking-wider uppercase inline-flex items-center gap-2 text-primary">
                  <span className="inline-block h-1.5 w-1.5 rounded-full bg-primary" />
                  {data.eyebrow}
                </p>
              ) : null}
              {data.title ? (
                <h2 className="text-3xl sm:text-4xl lg:text-[44px] xl:text-52 font-medium leading-[1.08] tracking-tight">
                  {data.title}
                </h2>
              ) : null}
              {data.subtitle ? (
                <p className="text-base sm:text-lg leading-snug text-white/75 max-w-2xl">
                  {data.subtitle}
                </p>
              ) : null}
              {data.description ? (
                <p className="text-sm sm:text-base text-white/55 max-w-2xl whitespace-pre-line">
                  {data.description}
                </p>
              ) : null}

              {useRichBullets ? (
                <ul className="flex flex-col gap-3 mt-2">
                  {rich.map((b, i) => {
                    const iconName = `ph:${(b.iconKey || "check-circle").trim()}`;
                    return (
                      <li key={i} className="flex items-start gap-3">
                        <span className="mt-0.5 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-white">
                          <Icon icon={iconName} width={14} height={14} aria-hidden />
                        </span>
                        <span className="text-[15px] leading-snug text-white/90">{b.label}</span>
                      </li>
                    );
                  })}
                </ul>
              ) : null}

              {useBullets ? (
                <ul className="flex flex-col gap-3 mt-2">
                  {benefits.map((b, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <span className="mt-0.5 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-white">
                        <Icon icon="ph:check" width={14} height={14} aria-hidden />
                      </span>
                      <span className="text-[15px] leading-snug text-white/90">{b}</span>
                    </li>
                  ))}
                </ul>
              ) : null}

              {data.supportingText ? (
                <p className="text-xs text-white/55 whitespace-pre-line">
                  {data.supportingText}
                </p>
              ) : null}

              {showPrimaryCta || showSecondaryCta ? (
                <div className="mt-3 flex flex-wrap items-center gap-3">
                  {showPrimaryCta ? (
                    <a
                      href={primaryHref}
                      className="inline-flex items-center justify-center gap-2 h-12 px-7 rounded-full text-base font-semibold bg-white text-dark hover:bg-primary hover:text-white transition-colors duration-200"
                    >
                      {data.ctaLabel}
                      <Icon icon="ph:arrow-right" width={16} height={16} aria-hidden />
                    </a>
                  ) : null}
                  {showSecondaryCta ? (
                    <a
                      href={secondaryHref}
                      className="inline-flex items-center justify-center gap-2 h-12 px-5 rounded-full text-sm font-semibold text-white/80 hover:text-white ring-1 ring-white/20 hover:ring-white/50 transition"
                    >
                      <Icon icon="ph:play-circle" width={16} height={16} aria-hidden />
                      {data.secondaryCtaLabel}
                    </a>
                  ) : null}
                </div>
              ) : null}

              {data.trustStripText?.trim() ? (
                <div className="mt-2 flex items-center gap-2 text-xs text-white/55">
                  <Icon icon="ph:users" width={14} height={14} aria-hidden />
                  <span>{data.trustStripText}</span>
                </div>
              ) : null}
            </div>

            {/* Right — visual / stat composition */}
            <div className="relative hidden lg:flex flex-col items-end justify-center gap-4 min-h-[360px]">
              {floatingStats.length > 0 ? (
                floatingStats.map((s, i) => (
                  <div
                    key={`${s.value}-${i}`}
                    className={
                      "rounded-2xl bg-white/10 backdrop-blur-md ring-1 ring-white/15 px-6 py-5 shadow-3xl w-full max-w-xs " +
                      (i === 0 ? "self-start translate-x-4" : "self-end -translate-x-4")
                    }
                  >
                    <p className="text-3xl font-semibold tracking-tight text-white leading-none">
                      {s.value}
                    </p>
                    <p className="mt-2 text-xs text-white/70">{s.label}</p>
                    {s.description ? (
                      <p className="mt-1.5 text-[11px] leading-snug text-white/50">
                        {s.description}
                      </p>
                    ) : null}
                  </div>
                ))
              ) : !hasBg ? (
                /* No media + no stats — purely decorative geometric composition */
                <div className="relative w-full max-w-sm aspect-square">
                  <div className="absolute inset-6 rounded-3xl ring-1 ring-white/15 bg-white/[0.03] backdrop-blur-sm" />
                  <div className="absolute inset-12 rounded-3xl ring-1 ring-primary/40 bg-primary/[0.08] backdrop-blur-sm" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="inline-flex h-20 w-20 items-center justify-center rounded-full bg-primary text-white shadow-3xl">
                      <Icon icon="ph:buildings" width={32} height={32} aria-hidden />
                    </span>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
