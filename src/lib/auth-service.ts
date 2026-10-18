import "server-only";
import { hashPassword, verifyPassword } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export type AuthUser = {
  id: string;
  email: string;
  name: string;
  role: string;
};

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

// 创建普通用户；邮箱冲突时抛出 Prisma P2002，由调用方统一处理
export async function createUser(input: {
  name: string;
  email: string;
  password: string;
}): Promise<AuthUser> {
  const passwordHash = await hashPassword(input.password);

  return prisma.user.create({
    data: {
      name: input.name,
      email: normalizeEmail(input.email),
      passwordHash,
      role: "USER",
    },
    select: { id: true, email: true, name: true, role: true },
  });
}

// 校验邮箱与密码；失败统一返回 null，避免暴露具体原因
export async function authenticateUser(
  emailInput: string,
  password: string,
): Promise<AuthUser | null> {
  const user = await prisma.user.findUnique({
    where: { email: normalizeEmail(emailInput) },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      passwordHash: true,
    },
  });

  if (!user) {
    return null;
  }

  const valid = await verifyPassword(password, user.passwordHash);
  if (!valid) {
    return null;
  }

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
  };
}
