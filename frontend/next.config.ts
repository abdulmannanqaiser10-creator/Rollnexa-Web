import type { NextConfig } from "next";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { getSecurityHeaders } from "./lib/security-headers";

const configDir = path.dirname(fileURLToPath(import.meta.url));
const monorepoRoot = path.join(configDir, "..");

const securityHeaders = Object.entries(getSecurityHeaders()).map(
  ([key, value]) => ({ key, value })
);

const nextConfig: NextConfig = {
  poweredByHeader: false,
  compress: true,
  serverExternalPackages: ["@prisma/client", "prisma"],
  // Explicit monorepo root so Turbopack does not infer from competing lockfiles.
  turbopack: {
    root: monorepoRoot,
    resolveAlias: {
      "@prisma/client/runtime/library":
        "./node_modules/@prisma/client/runtime/library.js",
    },
  },
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "images.pexels.com",
      },
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
      },
      {
        protocol: "http",
        hostname: "localhost",
      },
      {
        protocol: "http",
        hostname: "127.0.0.1",
      },
    ],
  },
  experimental: {
    optimizePackageImports: ["lucide-react", "framer-motion"],
  },
  async rewrites() {
    const apiBase = process.env.INTERNAL_API_URL || "http://localhost:5000";
    return [
      {
        source: "/api/:path*",
        destination: `${apiBase}/api/:path*`,
      },
    ];
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
