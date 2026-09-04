import { PrismaClient } from "@prisma/generated";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export function getMongoDbUri(): string {
  const raw = process.env.MONGODB_URI?.trim();
  if (!raw) {
    throw new Error(
      "MONGODB_URI is not set. Add MONGODB_URI=mongodb://127.0.0.1:27018/rollnexa_marketplace?replicaSet=rs0 to .env (run npm run db:mongo first)."
    );
  }

  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    throw new Error("MONGODB_URI is not a valid MongoDB connection URL.");
  }

  if (url.protocol !== "mongodb:" && url.protocol !== "mongodb+srv:") {
    throw new Error("MONGODB_URI must start with mongodb:// or mongodb+srv://.");
  }

  return raw;
}

function createPrismaClient() {
  getMongoDbUri();
  return new PrismaClient();
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

export async function connectDatabase() {
  await prisma.$connect();
  console.log("[database] Connected to local MongoDB.");
}
