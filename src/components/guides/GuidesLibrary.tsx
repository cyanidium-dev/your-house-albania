"use client";

import * as React from "react";
import Image from "next/image";
import Link from "@/components/shared/Link";
import { SpriteIcon as Icon } from "@/components/shared/SpriteIcon";
import { CONTAINER } from "@/components/shared/layout";
import { cn } from "@/lib/utils";

export type LibraryTopicKey = "investing" | "buying" | "market" | "places" | "living" | "comparisons";

export type LibraryItem = {
  key: string;
  href: string;
  title: string;
  description?: string;
  topic: LibraryTopicKey;
  /** A guide page (has a card picture), a blog article, or an "X or Y" comparison. */
  kind: "guide" | "article" | "comparison";
  image?: string;
  /** ISO date, articles only. */
  date?: string;
};

export type LibraryTopic = { key: LibraryTopicKey; label: string; icon: string };

export type LibraryLabels = {
  searchLabel: string;
  searchPlaceholder: string;
  all: string;
  noResults: string;
  /** "Show all {count}" — `{count}` is replaced here. */
  showAll: string;
  guide: string;
  article: string;
  clear: string;
};

/** Case- and accent-insensitive: "durres" finds "Durrës", "cmimet" finds "Çmimet". */
const fold = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");

const PER_TOPIC_GUIDES = 3;
const PER_TOPIC_ARTICLES = 4;
const PER_TOPIC_COMPARISONS = 9;

/**
 * /guides as a library: one search box and topic chips over every guide,
 * article and comparison in the reader's language, grouped by topic.
 *
 * Owner, 14.10: the guides were two long photo grids (a few guides, twenty
 * comparisons with the same pictures) and articles lived elsewhere; a reader
 * could not find "the guide I need" quickly. Pictures are kept for the few
 * guide pages only; articles are a compact dated list and comparisons a list
 * of "A or B" tiles, so a topic fits on a screen.
 */
export function GuidesLibrary({
  items,
  topics,
  labels,
  locale,
}: {
  items: LibraryItem[];
  topics: LibraryTopic[];
  labels: LibraryLabels;
  locale: string;
}) {
  const [query, setQuery] = React.useState("");
  const [topic, setTopic] = React.useState<LibraryTopicKey | null>(null);

  // Deep links from the header menu (`#comparisons`) open that topic.
  React.useEffect(() => {
    const hash = window.location.hash.replace("#", "");
    if (topics.some((t) => t.key === hash)) setTopic(hash as LibraryTopicKey);
  }, [topics]);

  const counts = React.useMemo(() => {
    const m = new Map<LibraryTopicKey, number>();
    for (const it of items) m.set(it.topic, (m.get(it.topic) ?? 0) + 1);
    return m;
  }, [items]);

  const q = fold(query.trim());
  const matches = React.useMemo(
    () =>
      q
        ? items.filter((it) => fold(`${it.title} ${it.description ?? ""}`).includes(q) && (!topic || it.topic === topic))
        : [],
    [items, q, topic],
  );

  const visibleTopics = topics.filter((t) => (counts.get(t.key) ?? 0) > 0);
  const shownTopics = topic ? visibleTopics.filter((t) => t.key === topic) : visibleTopics;
  const dateFmt = React.useMemo(
    () => new Intl.DateTimeFormat(locale, { day: "numeric", month: "short", year: "numeric" }),
    [locale],
  );

  const chip = (active: boolean) =>
    cn(
      "inline-flex min-h-10 shrink-0 items-center gap-2 rounded-full px-4 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50",
      active
        ? "bg-primary text-white"
        : "bg-dark/[0.05] text-dark hover:bg-primary/10 dark:bg-white/10 dark:text-white dark:hover:bg-white/15",
    );

  return (
    <div className={cn(CONTAINER, "pb-16 md:pb-24")}>
      {/* Search and topics: the two ways to find a guide, side by side. */}
      <div className="sticky top-[72px] z-20 -mx-5 border-b border-dark/10 bg-white/90 px-5 py-4 backdrop-blur dark:border-white/10 dark:bg-dark/90 2xl:mx-0 2xl:px-0">
        <label className="relative block md:max-w-xl">
          <span className="sr-only">{labels.searchLabel}</span>
          <Icon
            icon="ph:magnifying-glass"
            width={20}
            height={20}
            className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-dark/45 dark:text-white/45"
            aria-hidden
          />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={labels.searchPlaceholder}
            className="h-12 w-full rounded-full border border-dark/15 bg-white pl-12 pr-4 text-[16px] text-dark outline-none transition-colors placeholder:text-dark/40 focus:border-primary dark:border-white/20 dark:bg-white/5 dark:text-white dark:placeholder:text-white/40"
          />
        </label>
        <div
          className="mt-3 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          role="group"
          aria-label={labels.searchLabel}
        >
          <button type="button" className={chip(topic === null)} aria-pressed={topic === null} onClick={() => setTopic(null)}>
            {labels.all}
            <span className="tabular-nums opacity-70">{items.length}</span>
          </button>
          {visibleTopics.map((t) => (
            <button
              key={t.key}
              type="button"
              className={chip(topic === t.key)}
              aria-pressed={topic === t.key}
              onClick={() => setTopic(topic === t.key ? null : t.key)}
            >
              <Icon icon={t.icon} width={16} height={16} aria-hidden />
              {t.label}
              <span className="tabular-nums opacity-70">{counts.get(t.key)}</span>
            </button>
          ))}
        </div>
      </div>

      {q ? (
        <section className="pt-8" aria-live="polite">
          {matches.length === 0 ? (
            <div className="flex flex-col items-start gap-3 py-8">
              <p className="text-dark/60 dark:text-white/60">{labels.noResults}</p>
              <button type="button" className={chip(false)} onClick={() => setQuery("")}>
                {labels.clear}
              </button>
            </div>
          ) : (
            <ul className="grid gap-x-8 md:grid-cols-2">
              {matches.map((it) => (
                <li key={it.key}>
                  <Row item={it} labels={labels} dateFmt={dateFmt} topics={topics} />
                </li>
              ))}
            </ul>
          )}
        </section>
      ) : (
        shownTopics.map((t) => {
          const inTopic = items.filter((it) => it.topic === t.key);
          const expanded = topic === t.key;
          const guides = inTopic.filter((it) => it.kind === "guide");
          const articles = inTopic.filter((it) => it.kind === "article");
          const comparisons = inTopic.filter((it) => it.kind === "comparison");
          // Every link stays in the HTML (crawlers and the old full grids saw
          // them all); a collapsed topic only hides the overflow visually.
          const over = (i: number, limit: number) => !expanded && i >= limit;
          const hidden = expanded
            ? 0
            : Math.max(0, guides.length - PER_TOPIC_GUIDES) +
              Math.max(0, articles.length - PER_TOPIC_ARTICLES) +
              Math.max(0, comparisons.length - PER_TOPIC_COMPARISONS);
          return (
            <section key={t.key} id={t.key} className="scroll-mt-48 border-b border-dark/10 py-10 last:border-b-0 dark:border-white/10 md:py-12">
              <div className="mb-6 flex items-center gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary dark:bg-primary/20 dark:text-[#5fd3a9]" aria-hidden>
                  <Icon icon={t.icon} width={20} height={20} />
                </span>
                <h2 className="font-display text-2xl font-semibold tracking-tight text-dark dark:text-white md:text-3xl">
                  {t.label}
                </h2>
                <span className="text-sm tabular-nums text-dark/45 dark:text-white/45">{inTopic.length}</span>
              </div>

              {/* A topic's guide pages beside its articles, so one guide never
                  sits alone on a row of empty space. */}
              <div className={cn("grid gap-6", guides.length > 0 && articles.length + comparisons.length > 0 && "lg:grid-cols-3 lg:gap-8")}>
                {guides.length > 0 ? (
                  <ul
                    className={cn(
                      "grid content-start gap-5",
                      articles.length + comparisons.length > 0 ? "sm:grid-cols-2 lg:grid-cols-1" : "sm:grid-cols-2 lg:grid-cols-3",
                    )}
                  >
                    {guides.map((it, i) => (
                      <li key={it.key} className={cn(over(i, PER_TOPIC_GUIDES) && "hidden")}>
                        <GuideCard item={it} />
                      </li>
                    ))}
                  </ul>
                ) : null}

                {articles.length + comparisons.length > 0 ? (
                  <div className={cn("min-w-0", guides.length > 0 && "lg:col-span-2")}>
                    {articles.length > 0 ? (
                      <ul className={cn("grid gap-x-8", guides.length > 0 ? "xl:grid-cols-2" : "md:grid-cols-2")}>
                        {articles.map((it, i) => (
                          <li key={it.key} className={cn(over(i, PER_TOPIC_ARTICLES) && "hidden")}>
                            <Row item={it} labels={labels} dateFmt={dateFmt} topics={topics} />
                          </li>
                        ))}
                      </ul>
                    ) : null}
                    {comparisons.length > 0 ? (
                      <ul className={cn("grid gap-3 sm:grid-cols-2", guides.length > 0 ? "" : "lg:grid-cols-3")}>
                        {comparisons.map((it, i) => (
                          <li key={it.key} className={cn(over(i, PER_TOPIC_COMPARISONS) && "hidden")}>
                            <Link
                              href={it.href}
                              className="group flex h-full items-center gap-3 rounded-2xl border border-dark/10 px-4 py-3.5 transition-colors hover:border-primary dark:border-white/15"
                            >
                              <Icon icon="ph:arrows-left-right" width={18} height={18} className="shrink-0 text-primary dark:text-[#5fd3a9]" aria-hidden />
                              <span className="min-w-0 text-[15px] font-medium leading-snug text-dark dark:text-white">{it.title}</span>
                            </Link>
                          </li>
                        ))}
                      </ul>
                    ) : null}
                  </div>
                ) : null}
              </div>

              {hidden > 0 ? (
                <button
                  type="button"
                  className="mt-6 inline-flex items-center gap-1.5 text-[15px] font-semibold text-primary hover:underline dark:text-[#5fd3a9]"
                  onClick={() => {
                    setTopic(t.key);
                    requestAnimationFrame(() => document.getElementById(t.key)?.scrollIntoView({ block: "start" }));
                  }}
                >
                  {labels.showAll.replace("{count}", String(inTopic.length))}
                  <Icon icon="ph:arrow-right" width={16} height={16} aria-hidden />
                </button>
              ) : null}
            </section>
          );
        })
      )}
    </div>
  );
}

function GuideCard({ item }: { item: LibraryItem }) {
  return (
    <Link
      href={item.href}
      className="group flex h-full flex-col overflow-hidden rounded-2xl border border-dark/10 transition-colors hover:border-primary dark:border-white/15"
    >
      <span className="relative block aspect-[16/9] w-full overflow-hidden bg-dark/5 dark:bg-white/5">
        {item.image ? (
          <Image
            src={item.image}
            alt=""
            fill
            sizes="(max-width: 639px) 100vw, (max-width: 1023px) 50vw, 33vw"
            className="object-cover transition-transform duration-300 ease-out group-hover:scale-105"
          />
        ) : null}
      </span>
      <span className="flex flex-1 flex-col gap-1.5 p-4">
        <span className="font-display text-lg font-semibold leading-snug tracking-tight text-dark dark:text-white">{item.title}</span>
        {item.description ? (
          <span className="line-clamp-2 text-sm leading-relaxed text-dark/65 dark:text-white/65">{item.description}</span>
        ) : null}
      </span>
    </Link>
  );
}

function Row({
  item,
  labels,
  dateFmt,
  topics,
}: {
  item: LibraryItem;
  labels: LibraryLabels;
  dateFmt: Intl.DateTimeFormat;
  topics: LibraryTopic[];
}) {
  const topic = topics.find((t) => t.key === item.topic);
  const date = item.date ? new Date(item.date) : null;
  return (
    <Link
      href={item.href}
      className="group flex items-start gap-3 border-b border-dark/10 py-4 dark:border-white/10"
    >
      <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-dark/[0.05] text-dark/60 transition-colors group-hover:bg-primary group-hover:text-white dark:bg-white/10 dark:text-white/70" aria-hidden>
        <Icon icon={topic?.icon ?? "ph:article"} width={18} height={18} />
      </span>
      <span className="min-w-0">
        <span className="block text-[16px] font-semibold leading-snug text-dark transition-colors group-hover:text-primary dark:text-white">
          {item.title}
        </span>
        <span className="mt-1 block text-[13px] text-dark/50 dark:text-white/50">
          {item.kind === "article" ? labels.article : labels.guide}
          {date && !Number.isNaN(date.getTime()) ? ` · ${dateFmt.format(date)}` : ""}
        </span>
      </span>
    </Link>
  );
}
