import "dotenv/config";
import { createScriptPrisma } from "./lib/script-db";

async function main() {
  const { prisma } = createScriptPrisma();
  try {
    // Prisma's MongoDB connector cannot express "field is missing" in a `where`
    // (`issuer: null` matches nothing), so select the rows and filter in code.
    const accounts = await prisma.account.findMany({
      where: { providerId: "credential" },
      select: { id: true, issuer: true },
    });
    const pending = accounts.filter((account) => !account.issuer);
    for (const account of pending) {
      await prisma.account.update({
        where: { id: account.id },
        data: { issuer: "local:credential" },
      });
    }
    console.log(`Updated ${pending.length} credential account(s) for current Better Auth sign-in.`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error("Account issuer backfill failed:", error instanceof Error ? error.message : error);
  process.exit(1);
});
