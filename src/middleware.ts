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
  return withoutLocaleCookieOnCacheableDocuments(request, intlMiddleware(request));
}

/**
 * Drop `Set-Cookie: NEXT_LOCALE` from responses on URLs that already name their
 * locale.
 *
 * A response carrying `Set-Cookie` is never stored by the CDN, and Next marks
 * it `private, no-store`. next-intl sets that cookie on *every* response, so
 * once `[locale]` became the root segment and the pages started prerendering,
 * all 1,644 URLs were still served uncached — the cookie had quietly taken over
 * from `headers()` as the thing keeping the whole site dynamic.
 *
 * Nothing is lost by dropping it here. The cookie's job is to remember a
 * visitor's choice for a later visit to the bare domain, and the choice is
 * recorded by next-intl's own navigation helpers, which write it in the browser
 * (`navigation/shared/syncLocaleCookie`) rather than relying on this response.
 * Redirects keep the header — `/` → `/{locale}` is where detection actually
 * happens, and a redirect is uncacheable regardless.
 */
function withoutLocaleCookieOnCacheableDocuments(
  request: NextRequest,
  response: Response,
): Response {
  if (response.status >= 300 && response.status < 400) return response;

  const first = request.nextUrl.pathname.split("/")[1] ?? "";
  if (!LOCALES.includes(first)) return response;

  response.headers.delete("set-cookie");
  return response;
}

export const config = {
  matcher: ["/((?!api|_next|_vercel|editor|.*\\..*).*)"],
};
