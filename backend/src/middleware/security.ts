import type { Request, Response, NextFunction } from "express";
import { getSecurityHeaders } from "@/lib/security-headers";
import { guardRequest } from "@/lib/edge-security";

/**
 * Express-side mirror of the guards in frontend/proxy.ts so the API is
 * protected even when it is reached directly on its own port (bypassing the
 * Next.js rewrite).
 */
function toHeaders(req: Request): Headers {
  const headers = new Headers();
  for (const [key, value] of Object.entries(req.headers)) {
    if (value === undefined || value === null) continue;
    headers.set(key, Array.isArray(value) ? value.join(", ") : value);
  }
  return headers;
}

export function securityMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const isApi = req.path === "/api" || req.path.startsWith("/api/");
  const headers = getSecurityHeaders(
    isApi ? { cacheControl: "no-store" } : undefined
  );
  for (const [key, value] of Object.entries(headers)) {
    res.setHeader(key, value);
  }

  let url = req.originalUrl || req.url;
  try {
    const host = req.get("host");
    if (host) url = `${req.protocol}://${host}${req.originalUrl || req.url}`;
  } catch {
    // fall back to the path-only URL
  }

  const guard = guardRequest({
    method: req.method,
    url,
    headers: toHeaders(req),
  });

  if (!guard.ok) {
    if (guard.headers) {
      for (const [key, value] of Object.entries(guard.headers)) {
        res.setHeader(key, value);
      }
    }
    res.status(guard.status).json({ error: guard.error });
    return;
  }

  next();
}
