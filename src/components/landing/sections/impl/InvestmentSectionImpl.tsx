import Image from "next/image";
import Link from "next/link";

const PRIMARY_FALLBACK = "/images/investment/primary-fallback.jpg";
const SECONDARY_FALLBACK = "/images/investment/secondary-fallback.jpg";

export type InvestmentData = {
  title?: string;
  description?: string;
  benefits?: string[];
  ctaLabel?: string;
  ctaHref?: string;
  primaryImageUrl?: string;
  primaryImageAlt?: string;
  secondaryImageUrl?: string;
  secondaryImageAlt?: string;
  stats?: Array<{ label: string; value: string }>;
} | null;

const Investment: React.FC<{ locale: string; investmentData?: InvestmentData }> = async ({
  locale,
  investmentData,
}) => {
  const title = investmentData?.title;
  const description = investmentData?.description;
  const benefits = Array.isArray(investmentData?.benefits) ? investmentData.benefits : [];
  const ctaLabel = investmentData?.ctaLabel;
  const ctaHref = investmentData?.ctaHref;
  const stats = Array.isArray(investmentData?.stats) ? investmentData.stats : [];
  const hasContent = Boolean(title || description || benefits.length > 0 || (ctaLabel && ctaHref));

  if (!hasContent) return null

  const href = ctaHref
    ? ctaHref.startsWith("/") ? `/${locale}${ctaHref}` : ctaHref
    : "#";

  const primarySrc = investmentData?.primaryImageUrl || PRIMARY_FALLBACK;
  const secondarySrc = investmentData?.secondaryImageUrl || SECONDARY_FALLBACK;
  const primaryAlt = investmentData?.primaryImageAlt || title || "Investment";
  const secondaryAlt = investmentData?.secondaryImageAlt || "Investment";

  return (
    <section className="py-16 md:py-24">
      <div className="container max-w-8xl mx-auto px-5 2xl:px-0">
        <div className="grid lg:grid-cols-2 gap-10">
          <div className="grid grid-cols-2 gap-4">
            <div className="relative rounded-2xl overflow-hidden aspect-[320/386]">
              <Image
                src={primarySrc}
                alt={primaryAlt}
                fill
                className="object-cover object-center"
                sizes="25vw"
                unoptimized={primarySrc.startsWith("http")}
              />
            </div>
            <div className="relative rounded-2xl overflow-hidden aspect-[320/386]">
              <Image
                src={secondarySrc}
                alt={secondaryAlt}
                fill
                className="object-cover object-center"
                sizes="25vw"
                unoptimized={secondarySrc.startsWith("http")}
              />
            </div>
          </div>
          <div className="flex flex-col justify-center gap-8">
            {title ? (
              <h2 className="text-dark dark:text-white lg:text-52 md:text-40 text-3xl font-medium">
                {title}
              </h2>
            ) : null}
            {description && (
              <p className="text-base text-dark/50 dark:text-white/50">
                {description}
              </p>
            )}
            {benefits.length > 0 && (
              <ul className="flex flex-col gap-3">
                {benefits.slice(0, 3).map((b, i) => (
                  <li key={i} className="flex items-center gap-2 text-dark dark:text-white text-base">
                    <span className="w-2 h-2 rounded-full bg-primary shrink-0" />
                    {b}
                  </li>
                ))}
              </ul>
            )}
            {stats.length > 0 ? (
              <div className="grid grid-cols-2 gap-3">
                {stats.map((s, idx) => (
                  <div key={`${s.label}-${idx}`} className="rounded-xl border border-dark/10 dark:border-white/20 bg-white/60 dark:bg-white/5 p-3">
                    <div className="text-lg font-semibold text-dark dark:text-white">{s.value}</div>
                    <div className="text-xs text-dark/60 dark:text-white/60">{s.label}</div>
                  </div>
                ))}
              </div>
            ) : null}
            {ctaLabel && ctaHref ? (
              <Link
                href={href}
                className="bg-primary py-4 px-8 rounded-full text-white hover:bg-dark duration-300 w-fit"
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

export default Investment;

