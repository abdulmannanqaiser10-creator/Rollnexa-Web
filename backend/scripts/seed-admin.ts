import "dotenv/config";
import { createScriptPrisma } from "./lib/script-db";
import { seedDevAdmin } from "./lib/seed-dev-admin";

const name =
  process.env.ADMIN_NAME?.trim() ||
  process.env.DEV_ADMIN_NAME?.trim() ||
  "Rollnexa Admin";
const email =
  process.env.ADMIN_EMAIL?.trim() ||
  process.env.DEV_ADMIN_EMAIL?.trim() ||
  "admin@rollnexa.com";
const password =
  process.env.ADMIN_PASSWORD?.trim() || process.env.DEV_ADMIN_PASSWORD?.trim();

async function main() {
  if (!password) {
    console.error(
      "ADMIN_PASSWORD (or DEV_ADMIN_PASSWORD) is required. Add it to your local .env file (never commit it)."
    );
    process.exit(1);
  }

  const { prisma } = createScriptPrisma();

  try {
    const user = await seedDevAdmin({ prisma, name, email, password });

    console.log("Dev admin configured:");
    console.log(`  name: ${name}`);
    console.log(`  email: ${user.email}`);
    console.log(`  role: ${user.role}`);
    console.log("  password: [set via ADMIN_PASSWORD / DEV_ADMIN_PASSWORD — not logged]");
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error("Failed to seed dev admin:", error instanceof Error ? error.message : error);
  process.exit(1);
});
