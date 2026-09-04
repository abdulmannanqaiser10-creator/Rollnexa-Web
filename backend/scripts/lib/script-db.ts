import { PrismaClient } from "@prisma/generated";

function getMongoDbUri() {
  const raw = process.env.MONGODB_URI?.trim();
  if (!raw) {
    throw new Error("MONGODB_URI is not set");
  }

  return raw;
}

export function createScriptPrisma() {
  getMongoDbUri();

  return {
    prisma: new PrismaClient(),
  };
}
