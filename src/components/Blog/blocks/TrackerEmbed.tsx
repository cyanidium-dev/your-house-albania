import { useTranslations } from "next-intl";
import { resolveLocalizedString } from "@/lib/sanity/localized";

export type TrackerEmbedValue = {
  tracker?: {
    title?: unknown;
    statusLabel?: unknown;
    statusSummary?: unknown;
    currentStatus?: string;
    lastCheckedAt?: string;
    isPublished?: boolean;
  } | null;
};

const STATUS_TONE: Record<string, string> = {
  onTrack: "bg-green-500/15 text-green-700 dark:text-green-400",
  delayed: "bg-amber-500/15 text-amber-700 dark:text-amber-400",
  blocked: "bg-red-500/15 text-red-700 dark:text-red-400",
  done: "bg-blue-500/15 text-blue-700 dark:text-blue-400",
};

/**
 * Inline card showing an infrastructure tracker's current status.
 *
 * The status is read at render time, never copied into the article: a tracker
 * whose whole promise is freshness must not be restated in prose that goes
 * stale on its own. Renders nothing when the tracker is missing or
 * unpublished.
 */
export function TrackerEmbed({ value, locale }: { value: TrackerEmbedValue; locale: string }) {
  const t = useTranslations("Blog");
  const tracker = value?.tracker;
  if (!tracker || tracker.isPublished === false) return null;

  const title = resolveLocalizedString(tracker.title as never, locale);
  const summary = resolveLocalizedString(tracker.statusSummary as never, locale);
  if (!title && !summary) return null;

  const label =
    resolveLocalizedString(tracker.statusLabel as never, locale) || tracker.currentStatus || "";
  const tone = STATUS_TONE[tracker.currentStatus ?? ""] ?? "bg-dark/10 text-dark dark:text-white";

  return (
    <aside className="border border-dark/10 dark:border-white/20 rounded-lg p-5 my-8">
      <div className="flex items-center gap-3 flex-wrap mb-2">
        <p className="text-dark dark:text-white font-semibold">{title}</p>
        {label && (
          <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${tone}`}>{label}</span>
        )}
      </div>
      {summary && (
        <p className="text-dark/75 dark:text-white/75 text-sm leading-relaxed">{summary}</p>
      )}
      {tracker.lastCheckedAt && (
        <p className="text-dark/50 dark:text-white/50 text-xs mt-3">
          {t("trackerLastChecked")}: {tracker.lastCheckedAt}
        </p>
      )}
    </aside>
  );
}
