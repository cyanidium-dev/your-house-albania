import Image from "next/image";
import Link from "next/link";
import { Icon } from "@iconify/react/dist/iconify.js";

export type EntityCardProps = {
  href: string;
  title: string;
  imageUrl?: string;
  imageAlt?: string;
  shortDescription?: string;
  /** Short categorical chip shown over the image, e.g. "Sea", "Business". */
  tag?: string;
  /** Optional bottom meta number — e.g. property count. Hidden when undefined or 0. */
  count?: number;
  /** Label rendered after `count`, e.g. "properties". */
  countLabel?: string;
  sizes?: string;
};

const numberFmt = new Intl.NumberFormat("en-US");

export function EntityCard({
  href,
  title,
  imageUrl,
  imageAlt,
  shortDescription,
  tag,
  count,
  countLabel,
  sizes,
}: EntityCardProps) {
  const hasMeta = typeof count === "number" && count > 0;

  return (
    <Link
      href={href}
      className="group block rounded-2xl overflow-hidden transition-all duration-300
                 bg-white ring-1 ring-dark/[0.06] hover:ring-dark/15 shadow-3xl
                 dark:bg-white/[0.04] dark:hover:bg-white/[0.07] dark:ring-white/[0.06] dark:hover:ring-white/15
                 hover:-translate-y-0.5
                 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
    >
      <div className="relative aspect-[4/3] overflow-hidden">
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={imageAlt || title}
            fill
            sizes={sizes ?? "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"}
            className="object-cover object-center will-change-transform transition-transform duration-700 ease-out group-hover:scale-[1.06]"
            unoptimized={!!imageUrl?.startsWith("http")}
          />
        ) : (
          <div className="absolute inset-0 bg-dark/10 dark:bg-white/10" />
        )}
        {tag ? (
          <span className="absolute top-3 left-3 inline-flex items-center gap-1 rounded-full bg-dark/65 backdrop-blur-sm px-2.5 py-1 text-[11px] font-medium text-white/90">
            <Icon icon="ph:map-pin-fill" width={11} height={11} />
            {tag}
          </span>
        ) : null}
      </div>

      <div className="p-3 sm:p-5">
        <div className="flex items-start justify-between gap-2 sm:gap-3">
          <h3 className="text-base sm:text-xl font-semibold tracking-tight text-dark dark:text-white">
            {title}
          </h3>
          <span
            aria-hidden
            className="hidden sm:inline-flex shrink-0 items-center justify-center h-8 w-8 rounded-full bg-primary/15 text-primary transition-colors duration-200 group-hover:bg-primary group-hover:text-white"
          >
            <Icon icon="ph:arrow-right" width={14} height={14} />
          </span>
        </div>

        {shortDescription ? (
          <p className="mt-1.5 sm:mt-2 text-xs sm:text-sm leading-relaxed line-clamp-2 text-dark/65 dark:text-white/65">
            {shortDescription}
          </p>
        ) : null}

        {hasMeta ? (
          <div className="mt-3 pt-3 sm:mt-4 sm:pt-4 flex items-center justify-between text-xs border-t border-dark/8 text-dark/55 dark:border-white/8 dark:text-white/55">
            <span className="inline-flex items-center gap-1.5">
              <Icon icon="ph:buildings" width={12} height={12} />
              <span className="text-dark dark:text-white/85 font-medium">
                {numberFmt.format(count!)}
              </span>
              {/* wrapped so the flex gap reliably separates it from the number */}
              {countLabel ? <span>{countLabel}</span> : null}
            </span>
          </div>
        ) : null}
      </div>
    </Link>
  );
}
