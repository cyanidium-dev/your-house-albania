import createMiddleware from "next-intl/middleware";
import { NextRequest, NextResponse } from "next/server";
import { routing } from "./i18n/routing";
import { getLegacyFallbackCatalogCountrySlug } from "./lib/routes/catalog";

const intlMiddleware = createMiddleware(routing);

const LOCALES = routing.locales as readonly string[];

/**
 * Legacy agent URLs were `/[locale]/agent/[agent]/[city]/…filters`.
 * Canonical form inserts `/{country}` before `[city]`. Country cannot be inferred here without CMS;
 * legacy bookmarks use the configured fallback (same slug as pre–multi-country deployments).
 */
function maybeRedirectLegacyAgentCityPath(pathname: string): string | null {
  const parts = pathname.split("/").filter(Boolean);
  if (parts.length < 4) return null;
  const locale = parts[0] ?? "";
  if (!LOCALES.includes(locale)) return null;
  if (parts[1] !== "agent") return null;
  const rest = parts.slice(3);
  if (rest.length === 0) return null;
  const country = getLegacyFallbackCatalogCountrySlug().toLowerCase();
  if (rest[0].toLowerCase() === country) return null;
  return `/${locale}/agent/${parts[2]}/${country}/${rest.join("/")}`;
}

export default function middleware(request: NextRequest) {
  const url = request.nextUrl.clone();
  // Legacy redirect: /al/... -> /sq/...
  if (url.pathname.startsWith("/al/")) {
    url.pathname = url.pathname.replace(/^\/al\//, "/sq/");
    return NextResponse.redirect(url);
  }
  const agentRedirect = maybeRedirectLegacyAgentCityPath(url.pathname);
  if (agentRedirect) {
    url.pathname = agentRedirect;
    return NextResponse.redirect(url);
  }
  return intlMiddleware(request);
}

export const config = {
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
};
