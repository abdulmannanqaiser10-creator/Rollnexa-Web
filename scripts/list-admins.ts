import "dotenv/config";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../app/generated/prisma/client";

async function main() {
  const raw = process.env.DATABASE_URL?.trim();
  if (!raw) throw new Error("DATABASE_URL is not set");
  const pool = new Pool({ connectionString: raw, max: 2 });
  const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });
  try {
    const admins = await prisma.user.findMany({
      where: { role: "ADMIN" },
      select: { email: true, name: true, accountStatus: true },
    });
    console.log(JSON.stringify(admins, null, 2));
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
