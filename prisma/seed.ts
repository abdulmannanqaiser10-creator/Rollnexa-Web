import "dotenv/config";
import { createScriptPrisma } from "../scripts/lib/script-db";

const categories = [
  {
    name: "Road Roller",
    slug: "road-roller",
    description: "Road construction and soil compaction machines.",
  },
  {
    name: "Excavator",
    slug: "excavator",
    description: "Heavy machines used for digging and excavation.",
  },
  {
    name: "Bulldozer",
    slug: "bulldozer",
    description: "Heavy machines used for pushing soil and materials.",
  },
  {
    name: "Crane",
    slug: "crane",
    description: "Heavy lifting and construction machines.",
  },
  {
    name: "Loader",
    slug: "loader",
    description: "Machines used for loading and moving materials.",
  },
  {
    name: "Motor Grader",
    slug: "motor-grader",
    description: "Machines used for leveling and grading surfaces.",
  },
  {
    name: "Asphalt Paver",
    slug: "asphalt-paver",
    description: "Machines used for laying asphalt roads.",
  },
  {
    name: "Dump Truck",
    slug: "dump-truck",
    description: "Heavy trucks used for transporting construction materials.",
  },
];

const brands = [
  { name: "Caterpillar", slug: "caterpillar" },
  { name: "JCB", slug: "jcb" },
  { name: "Volvo", slug: "volvo" },
  { name: "Komatsu", slug: "komatsu" },
  { name: "HAMM", slug: "hamm" },
  { name: "Dynapac", slug: "dynapac" },
];

async function main() {
  const { prisma, pool } = createScriptPrisma();

  try {
    console.log("🌱 Seeding database...");

    for (const category of categories) {
      await prisma.category.upsert({
        where: { slug: category.slug },
        update: { name: category.name, description: category.description },
        create: category,
      });
    }
    console.log(`✅ ${categories.length} categories seeded.`);

    for (const brand of brands) {
      await prisma.brand.upsert({
        where: { slug: brand.slug },
        update: { name: brand.name },
        create: brand,
      });
    }
    console.log(`✅ ${brands.length} brands seeded.`);

    console.log("✅ Database seeded successfully!");
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

main().catch((e) => {
  console.error("❌ Seeding failed:", e.message);
  process.exit(1);
});
