import createMiddleware from "next-intl/middleware";
import { NextRequest, NextResponse } from "next/server";
import { routing } from "./i18n/routing";

const intlMiddleware = createMiddleware(routing);

export default function middleware(request: NextRequest) {
  const url = request.nextUrl.clone();
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
