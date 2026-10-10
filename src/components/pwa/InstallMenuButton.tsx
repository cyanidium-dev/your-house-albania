"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { promptInstall, requestInstallBanner, useInstallState } from "@/lib/pwa/installStore";
import { isInstalledApp, isIosSafari } from "@/lib/pwa/standalone";
import { cn } from "@/lib/utils";

/**
 * "Install the app" in the mobile menu: the same flow as the invitation
 * banner, on request and regardless of its snooze. Chromium opens the
 * browser's install dialog straight away; iOS Safari gets the banner with the
 * Share → Add to Home Screen instructions. Absent where neither works, and in
 * the installed app itself.
 */
export default function InstallMenuButton({ onSelect, className }: { onSelect?: () => void; className?: string }) {
  const t = useTranslations("Pwa");
  const { canPrompt, installed } = useInstallState();
  const [ios, setIos] = useState(false);
  const [inApp, setInApp] = useState(true);

  useEffect(() => {
    setInApp(isInstalledApp());
    setIos(isIosSafari());
  }, []);

  if (inApp || installed || (!canPrompt && !ios)) return null;

  const onClick = () => {
    // Close the menu first: the banner and the browser dialog both sit at the
    // bottom of the screen, under a full-height drawer.
    onSelect?.();
    if (canPrompt) void promptInstall("menu");
    else requestInstallBanner();
  };

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex cursor-pointer items-center gap-1.5 text-sm font-medium text-white/55 underline-offset-4 transition-colors hover:text-white hover:underline",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 rounded-sm",
        className,
      )}
    >
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden className="size-4 shrink-0">
        <rect x="6.5" y="2.5" width="11" height="19" rx="2.5" />
        <path d="M12 7.5v6M9.5 11 12 13.5 14.5 11" />
      </svg>
      {t("menuInstall")}
    </button>
  );
}
