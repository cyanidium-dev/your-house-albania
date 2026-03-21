import Link from "next/link";
import Image from "next/image";

export type AgentsPromoData = {
  title?: string;
  subtitle?: string;
  description?: string;
  benefits?: string[];
  ctaLabel?: string;
  ctaHref?: string;
  mediaType?: "image" | "video";
  mediaImageUrl?: string;
  mediaImageAlt?: string;
  mediaVideoUrl?: string;
} | null;

const AgentsPromo: React.FC<{ agentsPromoData?: AgentsPromoData }> = async ({
  agentsPromoData,
}) => {
  const title = agentsPromoData?.title;
  const subtitle = agentsPromoData?.subtitle;
  const description = agentsPromoData?.description;
  const benefits =
    Array.isArray(agentsPromoData?.benefits) &&
    agentsPromoData.benefits.length > 0
      ? agentsPromoData.benefits.slice(0, 3)
      : [];
  const ctaLabel = agentsPromoData?.ctaLabel;
  const ctaHref = agentsPromoData?.ctaHref;
  const mediaType = agentsPromoData?.mediaType;
  const mediaImageUrl = agentsPromoData?.mediaImageUrl;
  const mediaImageAlt = agentsPromoData?.mediaImageAlt || title || "Agents";
  const mediaVideoUrl = agentsPromoData?.mediaVideoUrl;
  const href = ctaHref
    ? ctaHref.startsWith("http") || ctaHref.startsWith("/")
      ? ctaHref
      : `/${ctaHref}`
    : "#";

  const hasContent = Boolean(title || subtitle || description || benefits.length > 0 || (ctaLabel && ctaHref));
  if (!hasContent) return null

  return (
    <section className="py-16 md:py-24">
      <div className="container max-w-8xl mx-auto px-5 2xl:px-0">
        <div className="relative rounded-2xl overflow-hidden border border-dark/10 dark:border-white/20 bg-dark/90 dark:bg-black py-10">
            {mediaType === "image" && mediaImageUrl ? (
              <div className="absolute inset-0 -z-10">
                <Image
                  src={mediaImageUrl}
                  alt={mediaImageAlt}
                  fill
                  className="object-cover object-center"
                  unoptimized={mediaImageUrl.startsWith("http")}
                />
                <div className="absolute inset-0 bg-black/40" />
              </div>
            ) : null}
            {mediaType === "video" && mediaVideoUrl ? (
              <div className="absolute inset-0 -z-10">
                <video className="w-full h-full object-cover object-center" autoPlay loop muted playsInline aria-label="Agents promo video">
                  <source src={mediaVideoUrl} />
                </video>
                <div className="absolute inset-0 bg-black/40" />
              </div>
            ) : null}
            <div className="flex flex-col items-center gap-8">
              {title ? <h2 className="text-white lg:text-52 md:text-40 text-3xl max-w-3/4 text-center font-medium">{title}</h2> : null}
              {subtitle && (
                <p className="text-white/90 text-center text-lg max-w-2xl">
                  {subtitle}
                </p>
              )}
              {description && (
                <p className="text-white/80 text-center text-base max-w-2xl">
                  {description}
                </p>
              )}
              {benefits.length > 0 && (
                <ul className="flex flex-col gap-2 text-white/90 text-center max-w-xl">
                  {benefits.map((b, i) => (
                    <li
                      key={i}
                      className="flex items-center justify-center gap-2"
                    >
                      <span className="w-2 h-2 rounded-full bg-white shrink-0" />
                      {b}
                    </li>
                  ))}
                </ul>
              )}
              {ctaLabel && ctaHref ? (
                <Link
                  href={href}
                  className="bg-white py-4 px-8 rounded-full text-dark hover:bg-primary hover:text-white duration-300"
                >
                  {ctaLabel}
                </Link>
              ) : null}
            </div>
        </div>
      </div>
    </section>
  );
};

export default AgentsPromo;

