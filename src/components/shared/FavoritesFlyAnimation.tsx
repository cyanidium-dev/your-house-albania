"use client";

import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";

const TARGET_SELECTOR = '[data-favorites-target="true"]';
const DURATION_MS = 800;

type Props = {
  startPos: { top: number; left: number };
  animationKey: number;
  image: string;
};

function FavoritesFlyAnimationInner({ startPos, animationKey, image }: Props) {
  const imgRef = useRef<HTMLImageElement>(null);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const img = imgRef.current;
    if (!img) return;

    const targetEl = document.querySelector(TARGET_SELECTOR);
    if (!targetEl) return;

    const targetRect = targetEl.getBoundingClientRect();
    const targetCenterX = targetRect.left + targetRect.width / 2;
    const targetCenterY = targetRect.top + targetRect.height / 2;
    const endSize = Math.min(targetRect.width, targetRect.height) * 1.5;

    const startWidth = 120;
    const startHeight = 90;
    const startX = startPos.left;
    const startY = startPos.top;
    const startCenterX = startX + startWidth / 2;
    const startCenterY = startY + startHeight / 2;
    const dx = targetCenterX - startCenterX;
    const dy = targetCenterY - startCenterY;

    const startTime = performance.now();

    const tick = (now: number) => {
      const t = Math.min((now - startTime) / DURATION_MS, 1);
      const eased = 1 - (1 - t) ** 2;
      const fadeOut = t > 0.65 ? (t - 0.65) / 0.35 : 0;

      const x = startCenterX + dx * eased - (startWidth + (endSize - startWidth) * eased) / 2;
      const y = startCenterY + dy * eased - (startHeight + (endSize - startHeight) * eased) / 2;
      const w = startWidth + (endSize - startWidth) * eased;
      const h = startHeight + (endSize - startHeight) * eased;

      img.style.left = `${x}px`;
      img.style.top = `${y}px`;
      img.style.width = `${w}px`;
      img.style.height = `${h}px`;
      img.style.opacity = String(1 - fadeOut * 0.7);

      if (t < 1) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        if (targetEl instanceof HTMLElement) {
          targetEl.animate(
            [{ transform: "scale(1)" }, { transform: "scale(1.2)" }, { transform: "scale(1)" }],
            { duration: 280, easing: "ease-out" }
          );
        }
      }
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [animationKey, startPos, image]);

  return (
    <div
      aria-hidden
      className="fixed inset-0 pointer-events-none"
      style={{ overflow: "visible", zIndex: 99999 }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        ref={imgRef}
        src={image}
        alt=""
        className="absolute object-cover rounded-lg shadow-lg"
        style={{
          left: startPos.left,
          top: startPos.top,
          width: 120,
          height: 90,
        }}
      />
    </div>
  );
}

export function FavoritesFlyAnimation(props: Props) {
  if (typeof document === "undefined") return null;
  return createPortal(<FavoritesFlyAnimationInner {...props} />, document.body);
}
