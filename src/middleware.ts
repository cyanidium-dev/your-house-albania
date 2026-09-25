import createMiddleware from "next-intl/middleware";
import { NextRequest, NextResponse } from "next/server";
import { routing } from "./i18n/routing";
import { getLegacyFallbackCatalogCountrySlug } from "./lib/routes/catalog";
import { isSitePathIndexable, PARTIAL_LOCALE_ROBOTS_HEADER } from "./lib/seo/localeIndexing";
import { listingQueryPublicPathname, listingQueryRewritePathname } from "./lib/routes/listingQueryRewrite";
import { defaultLocaleRedirectTarget } from "./lib/routes/localelessRedirect";

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
  // `/en/Albania/Durres` answered 200 with a canonical tag (audit 2026-09-20):
  // a second address for the page, rendered by the most expensive route. Every
  // path the site generates is lower-case, so an upper-case ASCII letter is
  // always someone's typo or a mangled link. ASCII only: nothing else in a
  // slug is touched.
  if (/[A-Z]/.test(url.pathname)) {
    url.pathname = url.pathname.replace(/[A-Z]/g, (c) => c.toLowerCase());
    return NextResponse.redirect(url, 308);
  }
  // A deep path with no locale gets a permanent 308 to the default locale
  // rather than next-intl's 307 — see lib/routes/localelessRedirect.
  const localelessTarget = defaultLocaleRedirectTarget(url.pathname, LOCALES, routing.defaultLocale);
  if (localelessTarget) {
    url.pathname = localelessTarget;
    return NextResponse.redirect(url, 308);
  }
  const agentRedirect = maybeRedirectLegacyAgentCityPath(url.pathname);
  if (agentRedirect) {
    url.pathname = agentRedirect;
    return NextResponse.redirect(url);
  }
  // The query-reading listing route is internal; its path is not an address.
  const publicListingPath = listingQueryPublicPathname(url.pathname, LOCALES);
  if (publicListingPath) {
    url.pathname = publicListingPath;
    return NextResponse.redirect(url, 308);
  }
  return withPartialLocaleRobots(
    request,
    withoutLocaleCookieOnCacheableDocuments(
      request,
      withListingQueryRewrite(request, intlMiddleware(request)),
    ),
  );
}

/**
 * Send a listing URL that carries a query (`?page=2`, filters, sort) to the
 * route that reads it, so the path-only listing route never touches
 * `searchParams` and stays cached. See `lib/routes/listingQueryRewrite`.
 *
 * Only a response that lets the request through is replaced: a redirect or a
 * rewrite of next-intl's own stands. The request header next-intl would have
 * forwarded is forwarded here too.
 */
function withListingQueryRewrite(request: NextRequest, response: NextResponse): NextResponse {
  if (!response.headers.has("x-middleware-next")) return response;
  const target = listingQueryRewritePathname(
    request.nextUrl.pathname,
    request.nextUrl.searchParams,
    LOCALES,
  );
  if (!target) return response;

  const url = request.nextUrl.clone();
  url.pathname = target;
  const headers = new Headers(request.headers);
  headers.set("X-NEXT-INTL-LOCALE", target.split("/")[1] ?? "");
  return NextResponse.rewrite(url, { request: { headers } });
}

/**
 * `noindex, follow` on pages of a partly translated locale whose content is not
 * written in it yet (see `lib/seo/localeIndexing`). A header rather than page
 * metadata, so no page — present or future — can forget it.
 */
function withPartialLocaleRobots(request: NextRequest, response: Response): Response {
  if (response.status >= 300 && response.status < 400) return response;
  if (isSitePathIndexable(request.nextUrl.pathname)) return response;
  response.headers.set("X-Robots-Tag", PARTIAL_LOCALE_ROBOTS_HEADER);
  return response;
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
