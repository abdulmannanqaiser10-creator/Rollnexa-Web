import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../../app/generated/prisma/client";

function normalizeDatabaseUrl(raw: string): string {
  const url = new URL(raw);
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

export function createScriptPrisma() {
  const raw = process.env.DATABASE_URL?.trim();
  if (!raw) {
    throw new Error("DATABASE_URL is not set");
  }

  const pool = new Pool({
    connectionString: normalizeDatabaseUrl(raw),
    max: 2,
  });

  return {
    prisma: new PrismaClient({ adapter: new PrismaPg(pool) }),
    pool,
  };
}
