import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";

// เก็บ client ไว้ใน globalThis กัน dev hot-reload เปิด connection ซ้ำ
const g = globalThis as unknown as { prisma?: PrismaClient };

export const db =
  g.prisma ?? new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });

if (process.env.NODE_ENV !== "production") g.prisma = db;
