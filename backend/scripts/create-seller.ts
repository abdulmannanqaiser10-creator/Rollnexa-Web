import "dotenv/config";
import { randomBytes } from "node:crypto";
import { hashPassword } from "@better-auth/utils/password";
import { createScriptPrisma } from "./lib/script-db";

async function main() {
  if (process.env.NODE_ENV === "production") throw new Error("This local seller bootstrap script cannot run in production.");
  const name = process.env.SELLER_NAME?.trim();
  const email = process.env.SELLER_EMAIL?.trim().toLowerCase();
  if (!name || name.length > 120) throw new Error("Set SELLER_NAME (1 to 120 characters).");
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error("Set a valid SELLER_EMAIL.");

  const temporaryPassword = randomBytes(24).toString("base64url");
  const hashedPassword = await hashPassword(temporaryPassword);
  const { prisma } = createScriptPrisma();
  try {
    const user = await prisma.user.upsert({
      where: { email },
      create: { name, email, emailVerified: false, role: "SELLER", accountStatus: "ACTIVE", profile: { create: {} } },
      update: { name, role: "SELLER", accountStatus: "ACTIVE" },
      select: { id: true, email: true },
    });
    await prisma.profile.upsert({ where: { userId: user.id }, create: { userId: user.id }, update: {} });
    const account = await prisma.account.findFirst({ where: { userId: user.id, providerId: "credential" } });
    if (account) {
      await prisma.account.update({ where: { id: account.id }, data: { issuer: "local:credential", accountId: user.id, password: hashedPassword } });
    } else {
      await prisma.account.create({ data: { userId: user.id, providerId: "credential", issuer: "local:credential", accountId: user.id, password: hashedPassword } });
    }
    console.log("Seller login created/repaired:");
    console.log(`  email: ${user.email}`);
    console.log(`  temporary password: ${temporaryPassword}`);
    console.log("Change the password after your first login.");
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error("Could not create seller login:", error instanceof Error ? error.message : error);
  process.exit(1);
});
