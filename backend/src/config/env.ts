import { config } from "dotenv";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const backendRoot = resolve(fileURLToPath(new URL(".", import.meta.url)), "../..");

config({ path: resolve(backendRoot, ".env") });
config({ path: resolve(backendRoot, "../frontend/.env") });
config({ path: resolve(backendRoot, "../frontend/.env.local") });

export const env = {
  port: Number(process.env.PORT || 5000),
  nodeEnv: process.env.NODE_ENV || "development",
  frontendUrl:
    process.env.FRONTEND_URL ||
    process.env.BETTER_AUTH_URL ||
    "http://localhost:3000",
  corsOrigins: [
    process.env.FRONTEND_URL,
    process.env.BETTER_AUTH_URL,
    process.env.APP_URL,
    process.env.NEXT_PUBLIC_SITE_URL,
    "http://localhost:3000",
    "http://127.0.0.1:3000",
  ].filter(Boolean) as string[],
};
