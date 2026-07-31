import "dotenv/config";
import { createScriptPrisma } from "./lib/script-db";
import { seedDevAdmin } from "../lib/admin/seed-dev-admin";

const name = process.env.DEV_ADMIN_NAME?.trim() || "Rollnexa";
const email = process.env.DEV_ADMIN_EMAIL?.trim() || "lexcoresolutions@gmail.com";
const password = process.env.DEV_ADMIN_PASSWORD?.trim();

async function main() {
  if (!password) {
    console.error(
      "DEV_ADMIN_PASSWORD is required. Add it to your local .env file (never commit it)."
    );
    process.exit(1);
  }

  const { prisma, pool } = createScriptPrisma();

  try {
    const user = await seedDevAdmin({ prisma, name, email, password });

    console.log("Dev admin configured:");
    console.log(`  name: ${name}`);
    console.log(`  email: ${user.email}`);
    console.log(`  role: ${user.role}`);
    console.log("  password: [set via DEV_ADMIN_PASSWORD — not logged]");
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

main().catch((error) => {
  console.error("Failed to seed dev admin:", error instanceof Error ? error.message : error);
  process.exit(1);
});
