import { NextRequest, NextResponse } from "next/server";
import { getSessionCookie } from "better-auth/cookies";
import { getSecurityHeaders } from "@/lib/security-headers";
import { guardRequest } from "@/lib/edge-security";

const publicRoutes = [
  "/",
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
  "/auth/callback",
  "/about",
  "/brands",
  "/categories",
  "/compare",
  "/contact",
  "/dealers",
  "/machines",
  "/privacy",
  "/terms",
  "/sell",
  "/robots.txt",
  "/sitemap.xml",
  "/opengraph-image",
  "/twitter-image",
];

const publicApiPrefixes = [
  "/api/auth",
  "/api/machines",
  "/api/compare",
  "/api/subscriptions/plans",
  "/api/reviews",
  "/api/storage",
];

const privatePrefixes = ["/admin", "/buyer", "/seller"];

function isPublicRoute(pathname: string): boolean {
  return publicRoutes.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );
}

function isPublicApi(pathname: string): boolean {
  return publicApiPrefixes.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );
}

function applyHeaders(
  response: NextResponse,
  pathname: string,
  isPrivate: boolean
) {
  const headers = getSecurityHeaders(
    isPrivate
      ? { cacheControl: "no-store, no-cache, must-revalidate, proxy-revalidate" }
      : pathname.startsWith("/api/")
        ? { cacheControl: "no-store" }
        : undefined
  );

  Object.entries(headers).forEach(([key, value]) => {
    response.headers.set(key, value);
  });

  if (isPrivate || (!isPublicRoute(pathname) && !pathname.startsWith("/api/"))) {
    response.headers.set("X-Robots-Tag", "noindex, nofollow");
  }
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isPrivate = privatePrefixes.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );

  // Central request guards: path traversal / null bytes, cross-site (CSRF)
  // rejection for mutating methods, and per-IP rate limiting on /api/*.
  const guard = guardRequest({
    method: request.method,
    url: request.url,
    headers: request.headers,
  });
  if (!guard.ok) {
    const denied = NextResponse.json(
      { error: guard.error },
      { status: guard.status, headers: guard.headers }
    );
    applyHeaders(denied, pathname, true);
    return denied;
  }

  if (
    request.headers.get("x-forwarded-proto") === "http" &&
    process.env.NODE_ENV === "production"
  ) {
    const redirectUrl = new URL(
      `https://${request.headers.get("host") || request.nextUrl.host}${pathname}${request.nextUrl.search}`,
      request.url
    );
    const httpsResponse = NextResponse.redirect(redirectUrl);
    applyHeaders(httpsResponse, pathname, isPrivate);
    return httpsResponse;
  }

  const response = NextResponse.next();
  applyHeaders(response, pathname, isPrivate);

  if (pathname.startsWith("/api/")) {
    if (isPublicApi(pathname)) {
      return response;
    }

    const sessionCookie = getSessionCookie(request);
    if (!sessionCookie) {
      const unauthorized = NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
      applyHeaders(unauthorized, pathname, true);
      return unauthorized;
    }

    return response;
  }

  if (isPublicRoute(pathname)) {
    return response;
  }

  const sessionCookie = getSessionCookie(request);

  if (!sessionCookie) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    const redirectResponse = NextResponse.redirect(loginUrl);
    applyHeaders(redirectResponse, pathname, true);
    return redirectResponse;
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
