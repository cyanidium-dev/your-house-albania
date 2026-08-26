import { resolveLocaleHref } from "@/lib/routes/resolveLocaleHref";
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
  /** Localized short footer intro; empty if unset in CMS. */
  footerIntro: string;
  footerApp: ResolvedFooterApp;
  socialLinks: { platform: string; url: string; channel?: string }[];
  policyLinks: { href: string; label: string }[];
  /** Footer "Guides" column (ТЗ-16); empty hides the column. */
  footerGuideLinks: { href: string; label: string }[];
};

type RawSiteSettings = {
  logo?: { asset?: { url?: string } };
  siteName?: Record<string, string>;
  siteTagline?: Record<string, string>;
  contactPhone?: string;
  contactEmail?: string;
  companyAddress?: string;
  footerIntro?: Record<string, string> | string;
  footerApp?: {
    enabled?: boolean;
    iosUrl?: string;
    androidUrl?: string;
  };
  socialLinks?: { _key?: string; platform?: string; url?: string; channel?: string }[];
  policyLinks?: RawPolicyLink[];
  footerGuideLinks?: RawPolicyLink[];
};

export type RawPolicyLink = { _key?: string; href?: string; label?: Record<string, string> };

/** Trim + locale-resolve CMS policy links; drop any with empty href or label. */
export function normalizePolicyLinks(
  raw: RawPolicyLink[] | null | undefined,
  locale: string,
): { href: string; label: string }[] {
  return (raw ?? []).flatMap((p) => {
    const href = typeof p?.href === "string" ? p.href.trim() : "";
    const label = resolveLocalizedString(p?.label as never, locale)?.trim() || "";
    if (!href || !label) return [];
    return [{ href: resolveLocaleHref(href, locale), label }];
  });
}

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
      footerIntro: "",
      footerApp: { enabled: false, iosUrl: "", androidUrl: "" },
      socialLinks: [],
      policyLinks: [],
      footerGuideLinks: [],
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
      channel: s.channel,
    }));

  const policyLinks = normalizePolicyLinks(raw.policyLinks, locale);
  // Same shape and rules as policy links — the normalizer is generic.
  const footerGuideLinks = normalizePolicyLinks(raw.footerGuideLinks, locale);

  return {
    logoUrl: (raw.logo as { asset?: { url?: string } })?.asset?.url ?? "",
    siteName: resolveLocalizedString(raw.siteName as never, locale) || "",
    siteTagline: resolveLocalizedString(raw.siteTagline as never, locale) || "",
    phone: raw.contactPhone ?? DEFAULT_PHONE,
    email: raw.contactEmail ?? DEFAULT_EMAIL,
    companyAddress: raw.companyAddress ?? "",
    footerIntro,
    footerApp: mapFooterApp(raw.footerApp),
    socialLinks,
    policyLinks,
    footerGuideLinks,
  };
}
