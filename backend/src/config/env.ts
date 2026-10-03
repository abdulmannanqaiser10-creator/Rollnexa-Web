import { config } from "dotenv";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const backendRoot = resolve(fileURLToPath(new URL(".", import.meta.url)), "../..");

config({ path: resolve(backendRoot, ".env") });
config({ path: resolve(backendRoot, "../frontend/.env") });
config({ path: resolve(backendRoot, "../frontend/.env.local") });

const isProduction = (process.env.NODE_ENV || "development") === "production";

function originOf(value?: string): string | null {
  if (!value) return null;
  try {
    return new URL(value).origin;
  } catch {
    return null;
  }
}

export const env = {
  port: Number(process.env.PORT || 5000),
  nodeEnv: process.env.NODE_ENV || "development",
  frontendUrl:
    process.env.FRONTEND_URL ||
    process.env.BETTER_AUTH_URL ||
    "http://localhost:3000",
  corsOrigins: [
    originOf(process.env.FRONTEND_URL),
    originOf(process.env.BETTER_AUTH_URL),
    originOf(process.env.APP_URL),
    originOf(process.env.NEXT_PUBLIC_SITE_URL),
    ...(isProduction
      ? []
      : ["http://localhost:3000", "http://127.0.0.1:3000"]),
  ].filter((value, index, list): value is string => Boolean(value) && list.indexOf(value) === index),
};
