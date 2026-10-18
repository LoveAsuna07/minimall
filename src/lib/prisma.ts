import "server-only";
import { PrismaClient } from "@prisma/client";

// 开发环境热更新时复用同一个 PrismaClient 实例，避免连接数暴涨
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
