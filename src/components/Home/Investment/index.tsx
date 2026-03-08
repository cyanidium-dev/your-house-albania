import Image from "next/image";
import Link from "next/link";
import { getTranslations } from "next-intl/server";

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
} | null;

const Investment: React.FC<{ locale: string; investmentData?: InvestmentData }> = async ({
  locale,
  investmentData,
}) => {
  const t = await getTranslations("Home.contact");
  const title = investmentData?.title || t("title");
  const description = investmentData?.description || "";
  const benefits = Array.isArray(investmentData?.benefits) && investmentData.benefits.length > 0
    ? investmentData.benefits
    : [t("marquee1"), t("marquee2")];
  const ctaLabel = investmentData?.ctaLabel || t("getInTouch");
  const ctaHref = investmentData?.ctaHref || "#";
  const href = ctaHref.startsWith("/") ? `/${locale}${ctaHref}` : ctaHref;

  const primaryAlt = investmentData?.primaryImageAlt || title;
  const secondaryAlt = investmentData?.secondaryImageAlt || "";

  return (
    <section>
      <div className="container max-w-8xl mx-auto px-5 2xl:px-0">
        <div className="grid lg:grid-cols-2 gap-10">
          <div className="grid grid-cols-2 gap-4">
            {investmentData?.primaryImageUrl ? (
              <div className="relative rounded-2xl overflow-hidden aspect-[320/386]">
                <Image
                  src={investmentData.primaryImageUrl}
                  alt={primaryAlt}
                  fill
                  className="object-cover object-center"
                  sizes="25vw"
                  unoptimized={investmentData.primaryImageUrl.startsWith("http")}
                />
              </div>
            ) : (
              <div className="relative rounded-2xl overflow-hidden aspect-[320/386] bg-dark/10">
                <video
                  className="w-full h-full object-cover object-center"
                  autoPlay
                  loop
                  muted
                  aria-label="Investment property"
                >
                  <source src="https://videos.pexels.com/video-files/7233782/7233782-hd_1920_1080_25fps.mp4" type="video/mp4" />
                </video>
              </div>
            )}
            {investmentData?.secondaryImageUrl ? (
              <div className="relative rounded-2xl overflow-hidden aspect-[320/386]">
                <Image
                  src={investmentData.secondaryImageUrl}
                  alt={secondaryAlt || "Investment"}
                  fill
                  className="object-cover object-center"
                  sizes="25vw"
                  unoptimized={investmentData.secondaryImageUrl.startsWith("http")}
                />
              </div>
            ) : (
              <div className="relative rounded-2xl overflow-hidden aspect-[320/386] bg-dark/10" />
            )}
          </div>
          <div className="flex flex-col justify-center gap-8">
            <h2 className="text-dark dark:text-white lg:text-52 md:text-40 text-3xl font-medium">
              {title}
            </h2>
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
            <Link
              href={href}
              className="bg-primary py-4 px-8 rounded-full text-white hover:bg-dark duration-300 w-fit"
            >
              {ctaLabel}
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Investment;
