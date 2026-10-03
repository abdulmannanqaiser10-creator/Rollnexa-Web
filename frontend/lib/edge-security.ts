/**
 * Edge-safe request guards: cross-site/CSRF defence, path safety and
 * in-memory rate limiting.
 *
 * Runs in three places so every entry point is covered:
 *   - frontend/proxy.ts            (Next.js requests)
 *   - backend/src/middleware/security.ts (Express, port 5000)
 *   - route handlers               (callers that need per-route budgets)
 *
 * No Prisma / Better Auth / node: imports — must stay loadable on the edge.
 *
 * Keep this file byte-identical with backend/src/lib/edge-security.ts.
 */

const isProduction = process.env.NODE_ENV === "production";

export const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

const MUTATING_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);

/**
 * Server-to-server endpoints: the caller is not a browser, so an Origin /
 * Sec-Fetch-Site header may be absent or a third party's. Auth still happens
 * inside the handler (bearer secret / signature verification).
 */
const NON_BROWSER_PATHS = [/\/webhook$/, /^\/api\/cron\//];

function intFromEnv(name: string, fallback: number): number {
  const raw = process.env[name];
  if (!raw) return fallback;
  const parsed = Number.parseInt(raw, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

export function rateLimitBudgets() {
  return {
    authWrite: intFromEnv("RATE_LIMIT_AUTH_WRITE_MAX", 20),
    authRead: intFromEnv("RATE_LIMIT_AUTH_READ_MAX", 180),
    apiWrite: intFromEnv("RATE_LIMIT_API_WRITE_MAX", 150),
    apiRead: intFromEnv("RATE_LIMIT_API_READ_MAX", 900),
  };
}

function rateLimitDisabled(): boolean {
  return process.env.RATE_LIMIT_DISABLED === "true";
}

// ── client identity ─────────────────────────────────────────────

export function getClientKey(headers: Headers): string {
  const forwarded = headers.get("x-forwarded-for") || "";
  const realIp = headers.get("x-real-ip") || "";
  const cfIp = headers.get("cf-connecting-ip") || "";
  return (
    realIp.trim() ||
    cfIp.trim() ||
    forwarded.split(",")[0]?.trim() ||
    "unknown"
  );
}

// ── allowed origins (CSRF) ──────────────────────────────────────

export function getAllowedOrigins(requestUrl: string): Set<string> {
  const origins = new Set<string>();
  for (const value of [
    process.env.BETTER_AUTH_URL,
    process.env.APP_URL,
    process.env.NEXT_PUBLIC_SITE_URL,
    process.env.FRONTEND_URL,
  ]) {
    if (!value) continue;
    try {
      origins.add(new URL(value).origin);
    } catch {
      // ignore malformed env URLs
    }
  }
  try {
    origins.add(new URL(requestUrl).origin);
  } catch {
    // ignore malformed request URLs
  }
  if (!isProduction) {
    origins.add("http://localhost:3000");
    origins.add("http://127.0.0.1:3000");
  }
  return origins;
}

// ── path safety ─────────────────────────────────────────────────

/** Reject null bytes, traversal attempts and over-long paths. */
export function checkPathSafety(pathname: string): SecurityDenial | null {
  if (pathname.includes("\0")) {
    return deny(400, "Invalid request path");
  }
  if (pathname.length > 2048) {
    return deny(400, "Invalid request path");
  }
  let decoded = pathname;
  try {
    decoded = decodeURIComponent(pathname);
  } catch {
    return deny(400, "Invalid request path");
  }
  if (decoded.includes("\0")) {
    return deny(400, "Invalid request path");
  }
  const normalized = decoded.replace(/\\/g, "/");
  if (/(^|\/)\.\.(\/|$)/.test(normalized)) {
    return deny(400, "Invalid request path");
  }
  return null;
}

// ── cross-site / CSRF ───────────────────────────────────────────

export interface SecurityDenial {
  ok: false;
  status: number;
  error: string;
}

function deny(status: number, error: string): SecurityDenial {
  return { ok: false, status, error };
}

/**
 * Open-redirect guard for `callbackUrl` / `returnTo` style params.
 * Accepts only same-site absolute paths — `//host`, `\\host`, scheme-relative
 * and credential-bearing URLs are rejected.
 */
export function isSafeCallbackPath(value: unknown): value is string {
  if (typeof value !== "string") return false;
  if (value.length === 0 || value.length > 2048) return false;
  if (!value.startsWith("/")) return false;
  if (value.startsWith("//") || value.startsWith("/\\")) return false;
  try {
    const base = "http://callback.invalid";
    const url = new URL(value, base);
    return url.origin === base && url.username === "" && url.password === "";
  } catch {
    return false;
  }
}

const ALLOW: { ok: true } = { ok: true };

function isNonBrowserPath(pathname: string): boolean {
  return NON_BROWSER_PATHS.some((pattern) => pattern.test(pathname));
}

/**
 * CSRF defence for cookie-authenticated mutating requests.
 *
 *  1. A browser that advertises `Sec-Fetch-Site: cross-site` is rejected.
 *  2. A cross-origin `Origin` header must match the site allowlist.
 *  3. Requests with neither header are treated as server-to-server.
 */
export function checkCrossSite(
  pathname: string,
  method: string,
  headers: Headers,
  requestUrl: string
): { ok: true } | SecurityDenial {
  if (SAFE_METHODS.has(method.toUpperCase())) return ALLOW;
  if (!MUTATING_METHODS.has(method.toUpperCase())) return ALLOW;
  if (isNonBrowserPath(pathname)) return ALLOW;

  const secFetchSite = headers.get("sec-fetch-site");
  if (secFetchSite && secFetchSite !== "same-origin" && secFetchSite !== "none") {
    return deny(403, "Invalid request origin");
  }

  const origin = headers.get("origin");
  if (origin && origin !== "null") {
    const allowed = getAllowedOrigins(requestUrl);
    if (!allowed.has(origin)) {
      return deny(403, "Invalid request origin");
    }
    return ALLOW;
  }

  const referer = headers.get("referer");
  if (referer) {
    try {
      const refererOrigin = new URL(referer).origin;
      const allowed = getAllowedOrigins(requestUrl);
      if (allowed.has(refererOrigin)) return ALLOW;
    } catch {
      // fall through
    }
    return deny(403, "Invalid request origin");
  }

  // Neither header: the caller is not a browser (cron, webhook, health probe).
  return ALLOW;
}

// ── rate limiting ───────────────────────────────────────────────

interface Bucket {
  count: number;
  resetAt: number;
}

const rateLimitStore = new Map<string, Bucket>();
const MAX_BUCKETS = 10_000;
let nextPruneAt = 0;

function pruneStore(now: number) {
  if (now < nextPruneAt && rateLimitStore.size < MAX_BUCKETS) return;
  nextPruneAt = now + 30_000;
  for (const [key, bucket] of rateLimitStore) {
    if (bucket.resetAt <= now) rateLimitStore.delete(key);
  }
  // Hard cap so a spoofed-IP flood cannot grow the map without bound.
  if (rateLimitStore.size > MAX_BUCKETS) {
    const excess = rateLimitStore.size - MAX_BUCKETS;
    let removed = 0;
    for (const key of rateLimitStore.keys()) {
      if (removed >= excess) break;
      rateLimitStore.delete(key);
      removed += 1;
    }
  }
}

export interface RateLimitDecision {
  allowed: boolean;
  remaining: number;
  resetAt: number;
}

export function checkRateLimit(
  headers: Headers,
  prefix: string,
  limit: number,
  windowMs = 60_000
): RateLimitDecision {
  if (rateLimitDisabled()) {
    return { allowed: true, remaining: limit, resetAt: Date.now() + windowMs };
  }

  const now = Date.now();
  pruneStore(now);

  const key = `${prefix}:${getClientKey(headers)}`;
  const current = rateLimitStore.get(key);

  if (!current || current.resetAt <= now) {
    rateLimitStore.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: limit - 1, resetAt: now + windowMs };
  }

  if (current.count >= limit) {
    return { allowed: false, remaining: 0, resetAt: current.resetAt };
  }

  current.count += 1;
  return { allowed: true, remaining: limit - current.count, resetAt: current.resetAt };
}

export function rateLimitHeaders(decision: RateLimitDecision): Record<string, string> {
  const retryAfter = Math.max(
    1,
    Math.ceil((decision.resetAt - Date.now()) / 1000)
  );
  return {
    "Retry-After": String(retryAfter),
    "X-RateLimit-Remaining": String(decision.remaining),
    "X-RateLimit-Reset": String(Math.ceil(decision.resetAt / 1000)),
  };
}

// ── combined guard ──────────────────────────────────────────────

export type GuardInput = {
  method: string;
  url: string;
  headers: Headers;
  /** Skip the rate limiter for routes that enforce their own budget. */
  skipRateLimit?: boolean;
};

export type GuardResult =
  | { ok: true }
  | { ok: false; status: number; error: string; headers?: Record<string, string> };

/**
 * Single entry point used by both the Next proxy and the Express server.
 * Returns the first denial, otherwise `ok`.
 */
export function guardRequest(input: GuardInput): GuardResult {
  const { method, headers } = input;
  let pathname = "/";
  try {
    pathname = new URL(input.url).pathname;
  } catch {
    return { ok: false, status: 400, error: "Invalid request URL" };
  }

  const pathDenial = checkPathSafety(pathname);
  if (pathDenial) return pathDenial;

  const methodUpper = method.toUpperCase();

  const crossSite = checkCrossSite(pathname, methodUpper, headers, input.url);
  if (!crossSite.ok) {
    return { ok: false, status: crossSite.status, error: crossSite.error };
  }

  if (pathname.startsWith("/api/") && !input.skipRateLimit) {
    const budgets = rateLimitBudgets();
    const isAuth = pathname.startsWith("/api/auth");
    const isWrite = MUTATING_METHODS.has(methodUpper);
    const decision = isAuth
      ? checkRateLimit(headers, isWrite ? "auth:write" : "auth:read", isWrite ? budgets.authWrite : budgets.authRead)
      : checkRateLimit(headers, isWrite ? "api:write" : "api:read", isWrite ? budgets.apiWrite : budgets.apiRead);

    if (!decision.allowed) {
      return {
        ok: false,
        status: 429,
        error: "Too many requests. Please try again later.",
        headers: rateLimitHeaders(decision),
      };
    }
  }

  return { ok: true };
}
