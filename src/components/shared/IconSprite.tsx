import { SPRITE_ICONS, spriteSymbolId } from "@/lib/icons/sprite";

/**
 * The SVG sprite `SpriteIcon` references. Rendered once per page, right after
 * `<body>`, and kept in the document with zero size rather than
 * `display: none`, which some browsers honour for `<use>` targets too.
 */
export function IconSprite() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      focusable="false"
      style={{ position: "absolute", width: 0, height: 0, overflow: "hidden" }}
    >
      {Object.entries(SPRITE_ICONS).map(([name, data]) => (
        <symbol
          key={name}
          id={spriteSymbolId(name)}
          viewBox={`${data.left} ${data.top} ${data.width} ${data.height}`}
          dangerouslySetInnerHTML={{ __html: data.body }}
        />
      ))}
    </svg>
  );
}
