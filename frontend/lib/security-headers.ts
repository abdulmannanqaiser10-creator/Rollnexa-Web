/**
 * Edge-safe security helpers (no Prisma / Better Auth / Node-only imports).
 * Used by proxy.ts and next.config headers.
 *
 * Keep this file byte-identical with backend/src/lib/security-headers.ts.
 */

const isProduction = process.env.NODE_ENV === "production";

/**
 * Hosts the browser may open connections to.
 * A permissive `connect-src` is an exfiltration vector, so only the APIs the
 * client actually talks to are listed. Server-to-server calls are unaffected.
 */
const CONNECT_SRC_ALLOWLIST = [
  "'self'",
  "https://api.cloudinary.com",
  "https://api.getsafepay.com",
  "https://sandbox.api.getsafepay.com",
].join(" ");

const DEV_CONNECT_SRC = `${CONNECT_SRC_ALLOWLIST} https: wss: ws:`;

export function getContentSecurityPolicy(options?: { dev?: boolean }) {
  const dev = options?.dev ?? !isProduction;
  const scriptSrc = dev ? "'self' 'unsafe-inline' 'unsafe-eval'" : "'self' 'unsafe-inline'";

  return [
    "default-src 'self'",
    `script-src ${scriptSrc}`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https:",
    "font-src 'self' data: https:",
    `connect-src ${dev ? DEV_CONNECT_SRC : CONNECT_SRC_ALLOWLIST}`,
    "media-src 'self' https:",
    "manifest-src 'self'",
    "worker-src 'self' blob:",
    "frame-src 'self' https://*.getsafepay.com",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    ...(dev ? [] : ["upgrade-insecure-requests"]),
  ].join("; ");
}

export function getSecurityHeaders(options?: { cacheControl?: string }) {
  return {
    "Content-Security-Policy": getContentSecurityPolicy(),
    "X-Frame-Options": "DENY",
    "X-Content-Type-Options": "nosniff",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "Permissions-Policy":
      "geolocation=(), microphone=(), camera=(), payment=(), usb=(), autoplay=()",
    "Strict-Transport-Security": "max-age=31536000; includeSubDomains; preload",
    "X-DNS-Prefetch-Control": "on",
    "X-Permitted-Cross-Domain-Policies": "none",
    "Cross-Origin-Opener-Policy": "same-origin",
    "Cross-Origin-Resource-Policy": "same-origin",
    "Origin-Agent-Cluster": "?1",
    ...(options?.cacheControl
      ? { "Cache-Control": options.cacheControl }
      : {}),
  } as const;
}
