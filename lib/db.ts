import "server-only";
import "dotenv/config";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../app/generated/prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  pgPool: Pool | undefined;
};

/**
 * Neon and many hosts ship sslmode=require. Current `pg` treats that as
 * verify-full and warns; make the secure mode explicit without changing
 * credentials or host.
 */
export function normalizeDatabaseUrl(raw: string): string {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    throw new Error("DATABASE_URL is not a valid PostgreSQL connection URL.");
  }

  const sslmode = url.searchParams.get("sslmode");
  if (
    !sslmode ||
    sslmode === "prefer" ||
    sslmode === "require" ||
    sslmode === "verify-ca"
  ) {
    url.searchParams.set("sslmode", "verify-full");
  }

  return url.toString();
}

function createPrismaClient() {
  const raw = process.env.DATABASE_URL?.trim();
  if (!raw) {
    throw new Error(
      "DATABASE_URL is not set. Add it to .env and remove empty DATABASE_URL overrides from .env.local."
    );
  }

  const connectionString = normalizeDatabaseUrl(raw);
  const pool =
    globalForPrisma.pgPool ??
    new Pool({
      connectionString,
      max: 10,
    });

  // Reuse the pool across HMR / warm serverless invocations.
  globalForPrisma.pgPool = pool;

  const adapter = new PrismaPg(pool);
  return new PrismaClient({ adapter });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
