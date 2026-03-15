import Link from "next/link";
import { getTranslations } from "next-intl/server";

export type AgentsPromoData = {
  title?: string;
  subtitle?: string;
  description?: string;
  benefits?: string[];
  ctaLabel?: string;
  ctaHref?: string;
} | null;

const AgentsPromo: React.FC<{ agentsPromoData?: AgentsPromoData }> = async ({
  agentsPromoData,
}) => {
  const t = await getTranslations("Home.contact");
  const title = agentsPromoData?.title || t("title");
  const subtitle = agentsPromoData?.subtitle || "";
  const description = agentsPromoData?.description || "";
  const benefits =
    Array.isArray(agentsPromoData?.benefits) &&
    agentsPromoData.benefits.length > 0
      ? agentsPromoData.benefits.slice(0, 3)
      : [];
  const ctaLabel = agentsPromoData?.ctaLabel || t("getInTouch");
  const ctaHref = agentsPromoData?.ctaHref || "#";
  const href =
    !ctaHref || ctaHref === "#"
      ? "#"
      : ctaHref.startsWith("http") || ctaHref.startsWith("/")
        ? ctaHref
        : `/${ctaHref}`;

  return (
    <section className="py-16 md:py-24">
      <div className="container max-w-8xl mx-auto px-5 2xl:px-0">
        <div className="relative rounded-t-2xl overflow-hidden">
          <video
            className="w-full absolute top-0 left-0 object-cover -z-10"
            autoPlay
            loop
            muted
            aria-label="Video background showing luxurious real estate"
          >
            <source
              src="https://videos.pexels.com/video-files/7233782/7233782-hd_1920_1080_25fps.mp4"
              type="video/mp4"
            />
          </video>

          <div className="bg-black/30   py-10">
            <div className="flex flex-col items-center gap-8">
              <h2 className="text-white lg:text-52 md:text-40 text-3xl max-w-3/4 text-center font-medium">
                {title}
              </h2>
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
              <Link
                href={href}
                className="bg-white py-4 px-8 rounded-full text-dark hover:bg-dark hover:text-white duration-300"
              >
                {ctaLabel}
              </Link>
            </div>
          </div>
        </div>
        <div className="w-full py-5 bg-primary rounded-b-2xl overflow-hidden">
          <div className="flex items-center gap-40 animate-slide">
            <p className="text-white whitespace-nowrap relative after:absolute after:w-20 after:h-px after:bg-white after:top-3 after:-right-32">
              {t("marquee1")}
            </p>
            <p className="text-white whitespace-nowrap relative after:absolute after:w-20 after:h-px after:bg-white after:top-3 after:-right-32">
              {t("marquee2")}
            </p>
            <p className="text-white whitespace-nowrap relative after:absolute after:w-20 after:h-px after:bg-white after:top-3 after:-right-32">
              {t("marquee1")}
            </p>
            <p className="text-white whitespace-nowrap relative after:absolute after:w-20 after:h-px after:bg-white after:top-3 after:-right-32">
              {t("marquee2")}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AgentsPromo;
