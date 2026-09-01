import Image from "next/image";

type Props = {
  /** Photo of the author, when the CMS has one. */
  imageUrl?: string | null;
  name?: string | null;
  alt?: string | null;
  /** Rendered box in pixels. */
  size?: number;
  className?: string;
};

/** First letters of the first two words — "Elena Hoxha" → "EH". */
function initialsOf(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

/**
 * An author's photo, or the initials placeholder when there is none.
 *
 * CONTENT-OPS asks for initials-on-a-tint wherever a photo is missing, the same
 * pattern the developer cards and the article byline in `seoTextSection` use.
 * The blog byline used to point at `/images/placeholder.jpg`, a file that does
 * not exist, so an author without a photo rendered a broken image.
 */
export function AuthorAvatar({ imageUrl, name, alt, size = 48, className }: Props) {
  const box = `${className ?? ""} shrink-0 rounded-full overflow-hidden`.trim();
  const style = { width: size, height: size };

  if (imageUrl) {
    return (
      <Image
        src={imageUrl}
        alt={alt ?? name ?? ""}
        width={size}
        height={size}
        quality={100}
        style={style}
        className={`${box} object-cover`}
        unoptimized={imageUrl.startsWith("http")}
      />
    );
  }

  const initials = name ? initialsOf(name) : "";
  return (
    <div
      style={style}
      aria-hidden={initials ? undefined : true}
      className={`${box} bg-primary/15 ring-1 ring-primary/40 flex items-center justify-center`}
    >
      <span
        className="font-semibold text-primary leading-none"
        style={{ fontSize: Math.round(size * 0.36) }}
      >
        {initials}
      </span>
    </div>
  );
}
