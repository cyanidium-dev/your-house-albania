import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";
import { NextResponse } from "next/server";

const intlMiddleware = createMiddleware(routing);

export default function middleware(request: Request) {
  const url = new URL(request.url);
  // Legacy redirect: /al/... -> /sq/...
  if (url.pathname.startsWith("/al/")) {
    url.pathname = url.pathname.replace(/^\/al\//, "/sq/");
    return NextResponse.redirect(url);
  }
  return intlMiddleware(request);
}

export const config = {
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
};
