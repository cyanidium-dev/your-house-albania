'use client'
import Link from "next/link";
import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Icon } from "@iconify/react";
import PhoneInput from "react-phone-number-input";
import "react-phone-number-input/style.css";
import type { ResolvedSiteSettings } from "@/lib/sanity/siteSettingsAdapter";

type FooterProps = {
  siteSettings?: ResolvedSiteSettings;
};

function PhoneInputChevron() {
  return (
    <span className="phone-input-chevron ml-2 inline-flex shrink-0">
      <Icon icon="ph:caret-down" width={16} height={16} className="text-white" aria-hidden />
    </span>
  );
}

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
  const [phoneValue, setPhoneValue] = useState<string | undefined>(undefined);

  const quickLinks = siteSettings?.footerQuickLinks ?? [];
  const col1Links = quickLinks.slice(0, Math.ceil(quickLinks.length / 2));
  const col2Links = quickLinks.slice(Math.ceil(quickLinks.length / 2));

  return (
    <footer className="relative z-10 w-full bg-dark transition-[background-color,border-color,box-shadow,opacity] duration-[220ms] ease-out">
      <div className="container mx-auto max-w-8xl min-w-0 pt-14 px-5 2xl:px-0">
        <div className="flex lg:items-center justify-between items-end lg:gap-11 pb-14 border-b border-white/10 lg:flex-nowrap flex-wrap gap-6">
          <p className="text-white text-sm lg:max-w-1/5 min-w-0">
            {t('contactRequest')}
          </p>
          <div className="flex xl:flex-row flex-col items-stretch xl:items-center xl:gap-10 gap-3 min-w-0 w-full max-w-full">
            <div className="flex flex-col xl:flex-row gap-2 xl:order-1 order-2 min-w-0 w-full max-w-full">
              <PhoneInput
                international
                countryCallingCodeEditable={false}
                defaultCountry="UA"
                value={phoneValue}
                onChange={setPhoneValue}
                placeholder={t('phonePlaceholder')}
                autoComplete="tel"
                countrySelectProps={{ arrowComponent: PhoneInputChevron }}
                className="footer-cta-phone flex min-w-0 flex-1 rounded-full overflow-hidden bg-white/10 focus-within:ring-0"
                numberInputProps={{
                  className: "footer-cta-phone-input rounded-full py-4 px-6 bg-transparent border-0 placeholder:text-white/70 text-white focus-visible:outline-0 focus-visible:ring-0 min-w-0 flex-1",
                }}
              />
              <button type="button" className="text-dark bg-white py-4 px-8 font-semibold rounded-full hover:bg-primary hover:text-white duration-300 hover:cursor-pointer shrink-0 w-full xl:w-auto">
                {t('submitButton')}
              </button>
            </div>
            <p className="text-white/40 text-sm lg:max-w-[45%] order-1 lg:order-2 min-w-0">
              {t('helperText')}
            </p>
          </div>
          {(siteSettings?.socialLinks?.length ?? 0) > 0 ? (
            <div className="flex items-center gap-6">
              {siteSettings!.socialLinks.map((s, i) => (
                <Link key={s.platform + i} href={s.url} target="_blank" rel="noopener noreferrer">
                  <Icon icon={getSocialIcon(s.platform)} width={24} height={24} className="text-white hover:text-primary duration-300" />
                </Link>
              ))}
            </div>
          ) : null}
        </div>
        <div className="py-16 border-b border-white/10">
          <div className="grid grid-cols-12 sm:gap-10 gap-y-6">
            <div className="md:col-span-7 col-span-12">
              <h2 className="text-white leading-[1.2] text-40 font-medium mb-6 lg:max-w-3/4">
                {t('cta')}
              </h2>
              <Link href={`/${locale}/contacts`} className="bg-primary text-base font-semibold py-4 px-8 rounded-full text-white hover:bg-white hover:text-dark duration-300 hover:cursor-pointer">
                {t('getInTouch')}
              </Link>
              {(siteSettings?.phone || siteSettings?.email || siteSettings?.companyAddress) ? (
                <div className="mt-6 space-y-1">
                  {siteSettings?.phone ? <p className="text-white/60 text-sm">{siteSettings.phone}</p> : null}
                  {siteSettings?.email ? <p className="text-white/60 text-sm">{siteSettings.email}</p> : null}
                  {siteSettings?.companyAddress ? <p className="text-white/50 text-sm">{siteSettings.companyAddress}</p> : null}
                </div>
              ) : null}
            </div>
            {col1Links.length > 0 ? (
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
            ) : null}
            {col2Links.length > 0 ? (
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
            ) : null}
          </div>
        </div>
        <div className="flex justify-between md:flex-nowrap flex-wrap items-center py-6 gap-6">
          {siteSettings?.copyrightText ? (
            <p className="text-white/40 text-sm">{siteSettings.copyrightText}</p>
          ) : null}
          {(siteSettings?.policyLinks?.length ?? 0) > 0 ? (
            <div className="flex gap-8 items-center">
              {siteSettings!.policyLinks.map((item, idx) => (
                <Link key={`${item.href}-${idx}`} href={item.href} className="text-white/40 hover:text-primary text-sm transition-colors duration-300 ease-out">
                  {item.label}
                </Link>
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </footer >
  );
};

export default Footer;