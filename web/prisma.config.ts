import { defineConfig } from "prisma/config";

// ponytail: ใช้ loadEnvFile ของ Node แทน dotenv ใน Docker ไม่มีไฟล์ .env ค่าจะมาจาก environment
try {
  process.loadEnvFile();
} catch {}

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: { path: "prisma/migrations" },
  datasource: { url: process.env.DATABASE_URL },
});
