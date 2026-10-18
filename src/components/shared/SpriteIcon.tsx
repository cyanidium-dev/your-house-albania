import type { SVGProps } from "react";

import { Icon } from "@/components/shared/Icon";
import { spriteSymbolId } from "@/lib/icons/sprite";
import { SPRITE_URL, SPRITE_VIEWBOXES } from "@/lib/icons/spriteViewBoxes";

type SpriteIconProps = Omit<SVGProps<SVGSVGElement>, "width" | "height"> & {
  icon: string;
  width?: number | string;
  height?: number | string;
};

/**
 * An icon drawn from the site's SVG sprite (`public/icons/sprite.<hash>.svg`,
 * written by scripts/build-icon-sprite.mjs and preloaded by the locale
 * layout): a `<use>` of about 90 bytes instead of the full inline SVG that
 * `Icon` writes for every instance, and no client component to hydrate. Every
 * icon the code names statically is in the sprite (18.10); anything else —
 * an icon key chosen in the CMS — falls back to `Icon`, so a new name never
 * renders blank. Add it to build-icon-sprite.mjs when it turns out to repeat.
 *
 * Not a client component: an icon rendered on the server ships no hydration
 * work.
 */
export function SpriteIcon({ icon, width = 24, height = 24, className, ...rest }: SpriteIconProps) {
  // The viewBox map rather than SPRITE_ICONS: this component ships inside
  // client bundles too, and the symbol bodies live in the sprite file only.
  const viewBox = SPRITE_VIEWBOXES[icon];
  if (!viewBox) return <Icon icon={icon} width={width} height={height} className={className} />;
  return (
    <svg
      aria-hidden="true"
      role="img"
      width={width}
      height={height}
      viewBox={viewBox}
      className={className}
      {...rest}
    >
      <use href={`${SPRITE_URL}#${spriteSymbolId(icon)}`} />
    </svg>
  );
}
