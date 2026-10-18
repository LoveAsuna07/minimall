import { Prisma } from "@prisma/client";

// Prisma 唯一约束冲突（P2002）
export function isUniqueConstraintError(
  error: unknown,
): error is Prisma.PrismaClientKnownRequestError {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2002"
  );
}

// 分类名称/slug 冲突时的中文提示
export function uniqueCategoryErrorMessage(
  error: Prisma.PrismaClientKnownRequestError,
): string {
  const target = error.meta?.target;
  const text = (
    Array.isArray(target) ? target.join(",") : String(target ?? "")
  ).toLowerCase();

  if (text.includes("slug")) {
    return "Slug 已存在";
  }
  if (text.includes("name")) {
    return "分类名称已存在";
  }
  return "分类名称或 Slug 已存在";
}
