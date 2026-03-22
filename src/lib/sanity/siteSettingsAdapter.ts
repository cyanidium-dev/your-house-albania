import { resolveLocalizedString } from "./localized";

export type ResolvedSiteSettings = {
  logoUrl: string;
  siteName: string;
  siteTagline: string;
  phone: string;
  email: string;
  companyAddress: string;
  copyrightText: string;
  footerQuickLinks: { href: string; label: string }[];
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
  footerQuickLinks?: {
    _key?: string;
    href?: string;
    label?: Record<string, string>;
  }[];
  socialLinks?: { _key?: string; platform?: string; url?: string }[];
  policyLinks?: {
    _key?: string;
    href?: string;
    label?: Record<string, string>;
  }[];
};

const DEFAULT_PHONE = "";
const DEFAULT_EMAIL = "";

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
      footerQuickLinks: [],
      socialLinks: [],
      policyLinks: [],
    };
  }

  const footerQuickLinks = (raw.footerQuickLinks ?? [])
    .filter((q) => q?.href)
    .map((q) => ({
      href: q.href ?? "#",
      label: resolveLocalizedString(q.label as never, locale) || "Link",
    }));

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
    footerQuickLinks,
    socialLinks,
    policyLinks,
  };
}
