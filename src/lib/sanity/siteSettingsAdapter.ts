import { resolveLocalizedString } from "./localized";

export type ResolvedFooterApp = {
  enabled: boolean;
  iosUrl: string;
  androidUrl: string;
};

export type ResolvedSiteSettings = {
  logoUrl: string;
  siteName: string;
  siteTagline: string;
  phone: string;
  email: string;
  companyAddress: string;
  copyrightText: string;
  /** Localized short footer intro; empty if unset in CMS. */
  footerIntro: string;
  footerTelegramUrl: string;
  footerWhatsappUrl: string;
  footerApp: ResolvedFooterApp;
  footerCodesiteUrl: string;
  footerWebbondUrl: string;
  socialLinks: { platform: string; url: string }[];
  policyLinks: { href: string; label: string }[];
};

type RawSiteSettings = {
  logo?: { asset?: { url?: string } };
  siteName?: Record<string, string>;
  siteTagline?: Record<string, string>;
  contactPhone?: string;
  contactEmail?: string;
  companyAddress?: string;
  copyrightText?: Record<string, string>;
  footerIntro?: Record<string, string> | string;
  footerTelegramUrl?: string;
  footerWhatsappUrl?: string;
  footerApp?: {
    enabled?: boolean;
    iosUrl?: string;
    androidUrl?: string;
  };
  footerCodesiteUrl?: string;
  footerWebbondUrl?: string;
  socialLinks?: { _key?: string; platform?: string; url?: string }[];
  policyLinks?: {
    _key?: string;
    href?: string;
    label?: Record<string, string>;
  }[];
};

const DEFAULT_PHONE = "";
const DEFAULT_EMAIL = "";

function trimUrl(s: unknown): string {
  return typeof s === "string" ? s.trim() : "";
}

function mapFooterApp(raw: RawSiteSettings["footerApp"]): ResolvedFooterApp {
  const fa = raw;
  if (!fa || typeof fa !== "object") {
    return { enabled: false, iosUrl: "", androidUrl: "" };
  }
  return {
    enabled: Boolean(fa.enabled),
    iosUrl: trimUrl(fa.iosUrl),
    androidUrl: trimUrl(fa.androidUrl),
  };
}

/** Maps raw Sanity siteSettings to resolved fields for Header/Footer. Uses fallbacks per field. */
export function mapSiteSettingsToResolved(
  raw: RawSiteSettings | null | undefined,
  locale: string,
): ResolvedSiteSettings {
  if (!raw) {
    return {
      logoUrl: "",
      siteName: "",
      siteTagline: "",
      phone: DEFAULT_PHONE,
      email: DEFAULT_EMAIL,
      companyAddress: "",
      copyrightText: "",
      footerIntro: "",
      footerTelegramUrl: "",
      footerWhatsappUrl: "",
      footerApp: { enabled: false, iosUrl: "", androidUrl: "" },
      footerCodesiteUrl: "",
      footerWebbondUrl: "",
      socialLinks: [],
      policyLinks: [],
    };
  }

  const footerIntroRaw = raw.footerIntro;
  const footerIntro =
    typeof footerIntroRaw === "string"
      ? footerIntroRaw.trim()
      : resolveLocalizedString(footerIntroRaw as never, locale) || "";

  const socialLinks = (raw.socialLinks ?? [])
    .filter((s) => s?.url)
    .map((s) => ({
      platform: s.platform ?? "Link",
      url: s.url ?? "#",
    }));

  const policyLinks = (raw.policyLinks ?? [])
    .filter((p) => p?.href)
    .map((p) => ({
      href: p.href ?? "",
      label: resolveLocalizedString(p.label as never, locale) || "",
    }))
    .filter((p) => p.href && p.label);

  return {
    logoUrl: (raw.logo as { asset?: { url?: string } })?.asset?.url ?? "",
    siteName: resolveLocalizedString(raw.siteName as never, locale) || "",
    siteTagline: resolveLocalizedString(raw.siteTagline as never, locale) || "",
    phone: raw.contactPhone ?? DEFAULT_PHONE,
    email: raw.contactEmail ?? DEFAULT_EMAIL,
    companyAddress: raw.companyAddress ?? "",
    copyrightText:
      resolveLocalizedString(raw.copyrightText as never, locale) || "",
    footerIntro,
    footerTelegramUrl: trimUrl(raw.footerTelegramUrl),
    footerWhatsappUrl: trimUrl(raw.footerWhatsappUrl),
    footerApp: mapFooterApp(raw.footerApp),
    footerCodesiteUrl: trimUrl(raw.footerCodesiteUrl),
    footerWebbondUrl: trimUrl(raw.footerWebbondUrl),
    socialLinks,
    policyLinks,
  };
}
