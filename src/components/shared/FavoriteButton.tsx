"use client";

import { useRef, useState } from "react";
import { Icon } from "@iconify/react";
import { useFavorites } from "@/hooks/useFavorites";
import { FavoritesFlyAnimation } from "@/components/shared/FavoritesFlyAnimation";
import { cn } from "@/lib/utils";

type Props = {
  slug: string;
  name?: string;
  variant?: "overlay" | "inline";
  size?: "default" | "compact";
  imageUrl?: string | null;
  className?: string;
};

const ANIMATION_DURATION_MS = 800;

export function FavoriteButton({ slug, name, variant = "overlay", size = "default", imageUrl, className }: Props) {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const { isFavorite, toggle, mounted } = useFavorites();
  const active = mounted && isFavorite(slug);

  const [animationKey, setAnimationKey] = useState<number | null>(null);
  const [startPos, setStartPos] = useState<{ top: number; left: number } | null>(null);
  const [animatingImage, setAnimatingImage] = useState<string | null>(null);

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (active) {
      toggle(slug);
      return;
    }

    if (animationKey !== null) return;

    const button = buttonRef.current;
    if (!button) {
      toggle(slug);
      return;
    }

    const targetEl = document.querySelector('[data-favorites-target="true"]');
    if (!imageUrl || !targetEl) {
      toggle(slug);
      return;
    }

    const rect = button.getBoundingClientRect();
    setStartPos({
      top: rect.top,
      left: rect.left,
    });
    setAnimatingImage(imageUrl);
    setAnimationKey(Date.now());

    setTimeout(() => {
      toggle(slug);
      setAnimationKey(null);
      setStartPos(null);
      setAnimatingImage(null);
    }, ANIMATION_DURATION_MS);
  };

  const base =
    "rounded-full flex items-center justify-center transition-colors duration-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/40";

  const overlayStyles =
    size === "compact"
      ? "p-1.5 bg-white/90 dark:bg-dark/90 shadow-sm hover:bg-primary/10 dark:hover:bg-white/10"
      : "p-2.5 bg-white/90 dark:bg-dark/90 shadow-sm hover:bg-primary/10 dark:hover:bg-white/10";

  const inlineStyles =
    size === "compact"
      ? "p-1.5 border border-dark/10 dark:border-white/20 hover:border-primary/30 hover:bg-primary/10"
      : "p-2 border border-dark/10 dark:border-white/20 hover:border-primary/30 hover:bg-primary/10";

  const iconSize = size === "compact" ? 16 : 24;

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        onClick={handleClick}
        aria-label={active ? `Remove ${name || slug} from favorites` : `Add ${name || slug} to favorites`}
      className={cn(
        base,
        variant === "overlay" ? overlayStyles : inlineStyles,
        active && "text-primary",
        !active && "text-dark/60 dark:text-white/60 hover:text-primary",
        className
      )}
    >
      <Icon
        icon={active ? "ph:heart-fill" : "ph:heart"}
        width={iconSize}
        height={iconSize}
        className="pointer-events-none"
      />
    </button>
      {animationKey !== null && startPos && animatingImage && (
        <FavoritesFlyAnimation
          startPos={startPos}
          animationKey={animationKey}
          image={animatingImage}
        />
      )}
    </>
  );
}
