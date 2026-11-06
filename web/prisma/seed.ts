import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import { seedCatalog } from "../src/seed/catalog";

// ponytail: เหมือน prisma.config.ts — ใน Docker ไม่มี .env ค่ามาจาก environment
try {
  process.loadEnvFile();
} catch {}

const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });

seedCatalog(db)
  .then(() => console.log("seed: catalog ok"))
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
