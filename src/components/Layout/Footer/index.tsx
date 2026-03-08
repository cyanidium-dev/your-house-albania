'use client'
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { Icon } from "@iconify/react"
import { getFooterLinks } from "@/data/footer";
import type { ResolvedSiteSettings } from "@/lib/sanity/siteSettingsAdapter";

type FooterProps = {
  siteSettings?: ResolvedSiteSettings;
};

const SOCIAL_ICONS: Record<string, string> = {
  twitter: 'ph:x-logo-bold',
  x: 'ph:x-logo-bold',
  facebook: 'ph:facebook-logo-bold',
  instagram: 'ph:instagram-logo-bold',
  linkedin: 'ph:linkedin-logo-bold',
};

function getSocialIcon(platform: string): string {
  return SOCIAL_ICONS[platform.toLowerCase()] ?? 'ph:link';
}

const Footer = ({ siteSettings }: FooterProps) => {
  const locale = useLocale();
  const t = useTranslations('Footer');

  const quickLinks = (siteSettings?.footerQuickLinks?.length ?? 0) > 0
    ? siteSettings!.footerQuickLinks
    : getFooterLinks().map((f) => ({ href: f.href, label: t(`links.${f.key}`) }));
  const col1Links = quickLinks.slice(0, Math.ceil(quickLinks.length / 2));
  const col2Links = quickLinks.slice(Math.ceil(quickLinks.length / 2));

  return (
    <footer className="relative z-10 w-full min-w-full bg-dark transition-[background-color,border-color,box-shadow,opacity] duration-[220ms] ease-out">
      <div className="container mx-auto w-full max-w-8xl pt-14 px-4 sm:px-6 lg:px-0">
        <div className="flex lg:items-center justify-between items-end lg:gap-11 pb-14 border-b border-white/10 lg:flex-nowrap flex-wrap gap-6">
          <p className="text-white text-sm lg:max-w-1/5">
            {t('newsletter')}
          </p>
          <div className="flex lg:flex-row flex-col items-center lg:gap-10 gap-3">
            <div className="flex gap-2 lg:order-1 order-2">
              <input type="email" placeholder={t('emailPlaceholder')} className="rounded-full py-4 px-6 bg-white/10 placeholder:text-white text-white focus-visible:outline-0" />
              <button className="text-dark bg-white py-4 px-8 font-semibold rounded-full hover:bg-primary hover:text-white duration-300 hover:cursor-pointer">
                {t('subscribe')}
              </button>
            </div>
            <p className="text-white/40 text-sm lg:max-w-[45%] order-1 lg:order-2">
              {t('disclaimer')}
            </p>
          </div>
          <div className="flex items-center gap-6">
            {(siteSettings?.socialLinks?.length ?? 0) > 0
              ? siteSettings!.socialLinks.map((s, i) => (
                  <Link key={s.platform + i} href={s.url} target="_blank" rel="noopener noreferrer">
                    <Icon icon={getSocialIcon(s.platform)} width={24} height={24} className="text-white hover:text-primary duration-300" />
                  </Link>
                ))
              : (
                <>
                  <Link href="#">
                    <Icon icon="ph:x-logo-bold" width={24} height={24} className="text-white hover:text-primary duration-300" />
                  </Link>
                  <Link href="#">
                    <Icon icon="ph:facebook-logo-bold" width={24} height={24} className="text-white hover:text-primary duration-300" />
                  </Link>
                  <Link href="#">
                    <Icon icon="ph:instagram-logo-bold" width={24} height={24} className="text-white hover:text-primary duration-300" />
                  </Link>
                </>
              )}
          </div>
        </div>
        <div className="py-16 border-b border-white/10">
          <div className="grid grid-cols-12 sm:gap-10 gap-y-6">
            <div className="md:col-span-7 col-span-12">
              <h2 className="text-white leading-[1.2] text-40 font-medium mb-6 lg:max-w-3/4">
                {t('cta')}
              </h2>
              <Link href={`/${locale}/contactus`} className="bg-primary text-base font-semibold py-4 px-8 rounded-full text-white hover:bg-white hover:text-dark duration-300 hover:cursor-pointer">
                {t('getInTouch')}
              </Link>
            </div>
            <div className="md:col-span-3 sm:col-span-6 col-span-12">
              <div className="flex flex-col gap-4 w-fit">
                {col1Links.map((item, index) => (
                  <div key={index}>
                    <Link href={`/${locale}${item.href}`} className="text-white/40 text-xm hover:text-white transition-colors duration-300 ease-out">
                      {item.label}
                    </Link>
                  </div>
                ))}
              </div>
            </div>
            <div className="md:col-span-2 sm:col-span-6 col-span-12">
              <div className="flex flex-col gap-4 w-fit">
                {col2Links.map((item, index) => (
                  <div key={index}>
                    <Link href={`/${locale}${item.href}`} className="text-white/40 text-xm hover:text-white transition-colors duration-300 ease-out">
                      {item.label}
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
        <div className="flex justify-between md:flex-nowrap flex-wrap items-center py-6 gap-6">
          <p className="text-white/40 text-sm">
            {siteSettings?.copyrightText ? (
              siteSettings.copyrightText
            ) : (
              <>
                {new Date().getFullYear() === 2025 ? '2025' : `2025-${new Date().getFullYear()}`} Domlivo | all rights reserved | made and owned by{' '}
                <Link href="https://code-site.art" className="text-white/40 hover:text-primary transition-colors duration-300 ease-out" target="_blank" rel="noopener noreferrer">code-site.art</Link>
              </>
            )}
          </p>
          <div className="flex gap-8 items-center">
            <Link href="#" className="text-white/40 hover:text-primary text-sm transition-colors duration-300 ease-out">
              {t('termsOfService')}
            </Link>
            <Link href="#" className="text-white/40 hover:text-primary text-sm transition-colors duration-300 ease-out">
              {t('privacyPolicy')}
            </Link>
          </div>
        </div>
      </div>
    </footer >
  );
};

export default Footer;