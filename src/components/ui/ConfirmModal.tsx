"use client";

import React, { useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type ConfirmModalProps = {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmLabel: string;
  cancelLabel: string;
  confirmVariant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
};

export function ConfirmModal(props: ConfirmModalProps) {
  const {
    open,
    onClose,
    onConfirm,
    title,
    description,
    confirmLabel,
    cancelLabel,
    confirmVariant = "destructive",
  } = props;

  const contentRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (open) {
      document.addEventListener("keydown", handler);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", handler);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (contentRef.current && !contentRef.current.contains(e.target as Node)) {
      onClose();
    }
  };

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-modal-title"
      aria-describedby="confirm-modal-desc"
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
      onClick={handleOverlayClick}
    >
      <div className="fixed inset-0 bg-black/50" aria-hidden />
      <div
        ref={contentRef}
        className={cn(
          "relative z-10 w-full max-w-md rounded-2xl border border-dark/10 dark:border-white/10",
          "bg-white dark:bg-dark p-6 shadow-xl"
        )}
      >
        <h2 id="confirm-modal-title" className="text-xl font-semibold text-dark dark:text-white mb-2">
          {title}
        </h2>
        <p id="confirm-modal-desc" className="text-dark/70 dark:text-white/70 text-sm mb-6">
          {description}
        </p>
        <div className="flex gap-3 justify-end">
          <Button variant="outline" onClick={onClose} className="rounded-full">
            {cancelLabel}
          </Button>
          <Button variant={confirmVariant} onClick={onConfirm} className="rounded-full cursor-pointer">
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
