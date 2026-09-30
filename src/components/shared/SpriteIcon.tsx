import type { SVGProps } from "react";

import { Icon } from "@/components/shared/Icon";
import { SPRITE_ICONS, spriteSymbolId } from "@/lib/icons/sprite";

type SpriteIconProps = Omit<SVGProps<SVGSVGElement>, "width" | "height"> & {
  icon: string;
  width?: number | string;
  height?: number | string;
};

/**
 * An icon drawn from the page sprite (`IconSprite`, mounted once in the locale
 * layout): a `<use>` of about 90 bytes instead of the full inline SVG that
 * `Icon` writes for every instance. Meant for icons a page repeats many times,
 * which is the property cards. Anything not in the sprite falls back to `Icon`
 * so a new name never renders blank; add it to build-icon-sprite.mjs when it
 * turns out to repeat.
 *
 * Not a client component: a card rendered on the server ships no hydration
 * work for its icons.
 */
export function SpriteIcon({ icon, width = 24, height = 24, className, ...rest }: SpriteIconProps) {
  const data = SPRITE_ICONS[icon];
  if (!data) return <Icon icon={icon} width={width} height={height} className={className} />;
  return (
    <svg
      aria-hidden="true"
      role="img"
      width={width}
      height={height}
      viewBox={`${data.left} ${data.top} ${data.width} ${data.height}`}
      className={className}
      {...rest}
    >
      <use href={`#${spriteSymbolId(icon)}`} />
    </svg>
  );
}
