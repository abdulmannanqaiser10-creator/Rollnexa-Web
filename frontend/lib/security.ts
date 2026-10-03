import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export { getSecurityHeaders } from "@/lib/security-headers";

const DEFAULT_MAX_BODY_SIZE = 1024 * 1024;
export const MACHINE_UPLOAD_MAX_BYTES = 5 * 1024 * 1024;


const rateLimitStore = new Map<string, { count: number; resetAt: number }>();
const MAX_RATE_LIMIT_KEYS = 10_000;
let nextRateLimitPruneAt = 0;

function pruneRateLimitStore(now: number) {
  if (now < nextRateLimitPruneAt && rateLimitStore.size < MAX_RATE_LIMIT_KEYS) {
    return;
  }
  nextRateLimitPruneAt = now + 30_000;
  for (const [key, bucket] of rateLimitStore) {
    if (bucket.resetAt <= now) rateLimitStore.delete(key);
  }
  if (rateLimitStore.size > MAX_RATE_LIMIT_KEYS) {
    const excess = rateLimitStore.size - MAX_RATE_LIMIT_KEYS;
    let removed = 0;
    for (const key of rateLimitStore.keys()) {
      if (removed >= excess) break;
      rateLimitStore.delete(key);
      removed += 1;
    }
  }
}

const ALLOWED_ORIGINS = () => {
  const origins = new Set<string>();
  for (const value of [
    process.env.BETTER_AUTH_URL,
    process.env.APP_URL,
    process.env.NEXT_PUBLIC_SITE_URL,
  ]) {
    if (!value) continue;
    try {
      origins.add(new URL(value).origin);
    } catch {
      // ignore invalid env URLs
    }
  }
  if (process.env.NODE_ENV !== "production") {
    origins.add("http://localhost:3000");
    origins.add("http://127.0.0.1:3000");
  }
  return origins;
};

function getClientKey(request: Request) {
  const forwarded = request.headers.get("x-forwarded-for") || "";
  const realIp = request.headers.get("x-real-ip") || "";
  return forwarded.split(",")[0]?.trim() || realIp.trim() || "unknown";
}

export function getRateLimitKey(prefix: string, request: Request) {
  return `${prefix}:${getClientKey(request)}`;
}

export function checkRateLimit(
  request: Request,
  prefix: string,
  limit = 20,
  windowMs = 60_000
) {
  const now = Date.now();
  if (process.env.RATE_LIMIT_DISABLED === "true") {
    return { allowed: true, remaining: limit };
  }
  pruneRateLimitStore(now);
  const key = getRateLimitKey(prefix, request);
  const current = rateLimitStore.get(key);

  if (!current || current.resetAt <= now) {
    rateLimitStore.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: limit - 1 };
  }

  if (current.count >= limit) {
    logSecurityEvent("rate_limit_exceeded", {
      prefix,
      client: getClientKey(request),
    });
    return { allowed: false, remaining: 0, resetAt: current.resetAt };
  }

  current.count += 1;
  return { allowed: true, remaining: limit - current.count };
}

export function rateLimitResponse(resetAt?: number) {
  const headersInit = new Headers({
    "Retry-After": String(
      Math.max(1, Math.ceil(((resetAt || Date.now() + 60_000) - Date.now()) / 1000))
    ),
  });
  return NextResponse.json(
    { error: "Too many requests. Please try again later." },
    { status: 429, headers: headersInit }
  );
}

export async function requireApiSession(role?: "BUYER" | "SELLER" | "ADMIN") {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session?.user?.id) {
    logSecurityEvent("auth_required", { role });
    return {
      session: null,
      response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) as Response,
    };
  }

  if (role && session.user.role !== role) {
    logSecurityEvent("forbidden_role", {
      userId: session.user.id,
      required: role,
      actual: session.user.role,
    });
    return {
      session: null,
      response: NextResponse.json({ error: "Forbidden" }, { status: 403 }) as Response,
    };
  }

  try {
    const account = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { accountStatus: true },
    });

    if (
      account?.accountStatus === "BLOCKED" ||
      account?.accountStatus === "SUSPENDED"
    ) {
      logSecurityEvent("blocked_account", {
        userId: session.user.id,
        status: account.accountStatus,
      });
      return {
        session: null,
        response: NextResponse.json(
          { error: "Account is not allowed to perform this action." },
          { status: 403 }
        ) as Response,
      };
    }
  } catch (error) {
    console.error("[security] account status check failed", error);
  }

  return { session, response: undefined as Response | undefined };
}

/** Strip HTML-like characters and normalize whitespace for user-generated text. */
const HTML_TAG_RE = /<[^\s>][^>]*>?/g;
const CONTROL_CHARS_RE = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F\u200B-\u200F\u2028\u2029\uFEFF]/g;
const DANGEROUS_URI_RE = /\b(?:javascript|vbscript)\s*:/gi;
const INLINE_HANDLER_RE = /\bon[a-z]+\s*=/gi;

export function sanitizeText(value: string) {
  return value
    .replace(CONTROL_CHARS_RE, "")
    .replace(HTML_TAG_RE, " ")
    .replace(/[<>]/g, "")
    .replace(DANGEROUS_URI_RE, "")
    .replace(INLINE_HANDLER_RE, "")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Open-redirect guard for `callbackUrl` / `returnTo` style params.
 * Only same-site absolute paths are accepted (`//host`, `\\host` and
 * scheme-relative tricks are rejected).
 */
export { isSafeCallbackPath } from "@/lib/edge-security";

export function validateBody<T>(schema: z.ZodSchema<T>, body: unknown) {
  return schema.safeParse(body);
}

export async function enforceRequestSize(
  request: Request,
  maxBytes = DEFAULT_MAX_BODY_SIZE
) {
  const contentLength = request.headers.get("content-length");
  if (contentLength && Number(contentLength) > maxBytes) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Payload too large" }, { status: 413 }) as Response,
    };
  }

  return { ok: true, response: undefined as Response | undefined };
}

/**
 * Same-origin check for cookie-authenticated mutating requests.
 * Allows requests without Origin (native apps / same-site navigations) when Referer matches.
 */
export function assertSameOrigin(request: Request) {
  const allowed = ALLOWED_ORIGINS();
  try {
    allowed.add(new URL(request.url).origin);
  } catch {
    // ignore
  }
  if (allowed.size === 0) return { ok: true as const };

  const origin = request.headers.get("origin");
  if (origin) {
    if (allowed.has(origin)) return { ok: true as const };
    logSecurityEvent("csrf_origin_rejected", { origin });
    return {
      ok: false as const,
      response: NextResponse.json({ error: "Invalid request origin" }, { status: 403 }),
    };
  }

  const referer = request.headers.get("referer");
  if (referer) {
    try {
      const refererOrigin = new URL(referer).origin;
      if (allowed.has(refererOrigin)) return { ok: true as const };
    } catch {
      // fall through
    }
    logSecurityEvent("csrf_referer_rejected", { referer });
    return {
      ok: false as const,
      response: NextResponse.json({ error: "Invalid request origin" }, { status: 403 }),
    };
  }

  // No Origin/Referer: allow in development; require in production for mutations
  if (process.env.NODE_ENV === "production") {
    logSecurityEvent("csrf_missing_origin", { path: new URL(request.url).pathname });
    return {
      ok: false as const,
      response: NextResponse.json({ error: "Invalid request origin" }, { status: 403 }),
    };
  }

  return { ok: true as const };
}

export function detectImageMime(buffer: Buffer): "image/jpeg" | "image/png" | "image/webp" | null {
  if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return "image/jpeg";
  }
  if (
    buffer.length >= 8 &&
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47
  ) {
    return "image/png";
  }
  if (
    buffer.length >= 12 &&
    buffer.toString("ascii", 0, 4) === "RIFF" &&
    buffer.toString("ascii", 8, 12) === "WEBP"
  ) {
    return "image/webp";
  }
  return null;
}

export function logSecurityEvent(
  event: string,
  details?: Record<string, unknown>
) {
  console.warn(
    JSON.stringify({
      type: "security",
      event,
      at: new Date().toISOString(),
      ...details,
    })
  );
}

export function safeErrorMessage(
  fallback: string,
  error?: unknown,
  exposeInDev = false
) {
  if (exposeInDev && process.env.NODE_ENV !== "production" && error instanceof Error) {
    return error.message || fallback;
  }
  return fallback;
}
