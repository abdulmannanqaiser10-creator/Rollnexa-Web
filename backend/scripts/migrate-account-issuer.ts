import "dotenv/config";
import { createScriptPrisma } from "./lib/script-db";

async function main() {
  const { prisma } = createScriptPrisma();
  try {
    const result = await prisma.account.updateMany({
      where: { providerId: "credential", issuer: null },
      data: { issuer: "local:credential" },
    });
    console.log(`Updated ${result.count} credential account(s) for current Better Auth sign-in.`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error("Account issuer backfill failed:", error instanceof Error ? error.message : error);
  process.exit(1);
});
