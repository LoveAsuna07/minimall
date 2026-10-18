import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { prisma } from "@/lib/prisma";

export const SESSION_COOKIE = "mm_session";

// 会话有效期 7 天
const SESSION_TTL_SECONDS = 7 * 24 * 60 * 60;

export type SessionUser = {
  id: string;
  email: string;
  name: string;
  role: string;
};

export type SessionInfo = {
  userId: string;
  role: string;
};

type SessionPayload = SessionInfo & {
  exp: number;
};

// ---------- 密码 ----------

// 实现位于 password.ts，这里统一对外导出
export { hashPassword, verifyPassword } from "@/lib/password";

// ---------- 签名 Cookie ----------

function getAuthSecret(): string {
  const secret = process.env.AUTH_SECRET;
  if (!secret) {
    throw new Error("缺少 AUTH_SECRET 环境变量，无法签发会话 Cookie");
  }
  return secret;
}

function sign(encodedPayload: string): string {
  return createHmac("sha256", getAuthSecret())
    .update(encodedPayload)
    .digest("base64url");
}

function verifySignature(encodedPayload: string, signature: string): boolean {
  const expected = Buffer.from(sign(encodedPayload));
  const actual = Buffer.from(signature);
  return (
    expected.length === actual.length && timingSafeEqual(expected, actual)
  );
}

function encodePayload(payload: SessionPayload): string {
  return Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
}

function decodePayload(encodedPayload: string): SessionPayload | null {
  try {
    const parsed: unknown = JSON.parse(
      Buffer.from(encodedPayload, "base64url").toString("utf8"),
    );

    if (
      typeof parsed !== "object" ||
      parsed === null ||
      typeof (parsed as SessionPayload).userId !== "string" ||
      typeof (parsed as SessionPayload).role !== "string" ||
      typeof (parsed as SessionPayload).exp !== "number"
    ) {
      return null;
    }

    const payload = parsed as SessionPayload;
    if (payload.exp <= Math.floor(Date.now() / 1000)) {
      return null;
    }
    return payload;
  } catch {
    return null;
  }
}

// 写入签名后的用户信息到 httpOnly Cookie
export async function setSession(userId: string, role: string): Promise<void> {
  const payload: SessionPayload = {
    userId,
    role,
    exp: Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS,
  };

  const encodedPayload = encodePayload(payload);
  const token = `${encodedPayload}.${sign(encodedPayload)}`;

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  });
}

// 从 Cookie 读取并验证当前会话
export async function getSession(): Promise<SessionInfo | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) {
    return null;
  }

  const parts = token.split(".");
  if (parts.length !== 2) {
    return null;
  }

  const [encodedPayload, signature] = parts;
  if (!encodedPayload || !signature) {
    return null;
  }

  if (!verifySignature(encodedPayload, signature)) {
    return null;
  }

  const payload = decodePayload(encodedPayload);
  if (!payload) {
    return null;
  }

  return { userId: payload.userId, role: payload.role };
}

// 获取当前用户的完整信息（以数据库为准）
// 用 cache() 做请求内去重：同一请求中页面守卫与 SiteHeader 只查询一次
export const getCurrentUser = cache(
  async (): Promise<SessionUser | null> => {
    const session = await getSession();
    if (!session) {
      return null;
    }

    return prisma.user.findUnique({
      where: { id: session.userId },
      select: { id: true, email: true, name: true, role: true },
    });
  },
);

// 清除会话 Cookie
export async function clearSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}

// ---------- 页面/接口守卫 ----------

// 只允许站内单斜杠路径，防止开放重定向
export function safeNext(value: string | null | undefined): string | null {
  if (!value || value.length > 2048) {
    return null;
  }

  // 拒绝控制字符与反斜杠：URL 解析器可能剥离控制字符或把反斜杠规范化为斜杠
  if (/[\u0000-\u001F\u007F\\]/.test(value)) {
    return null;
  }

  if (!value.startsWith("/") || value.startsWith("//")) {
    return null;
  }

  return value;
}

// 页面级守卫：未登录跳转登录页，登录后回到原页面
export async function requireUser(nextPath = "/"): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) {
    const next = safeNext(nextPath) ?? "/";
    redirect(`/login?next=${encodeURIComponent(next)}`);
  }
  return user;
}

// 页面级管理员守卫：普通用户跳回首页
export async function requireAdmin(nextPath = "/admin"): Promise<SessionUser> {
  const user = await requireUser(nextPath);
  if (user.role !== "ADMIN") {
    redirect("/");
  }
  return user;
}

// API 级登录守卫：返回 JSON 错误响应而不是重定向
export async function requireUserApi(): Promise<
  { user: SessionUser } | { response: Response }
> {
  const user = await getCurrentUser();
  if (!user) {
    return { response: Response.json({ error: "未登录" }, { status: 401 }) };
  }
  return { user };
}

// API 级管理员守卫：返回 JSON 错误响应而不是重定向
export async function requireAdminApi(): Promise<
  { user: SessionUser } | { response: Response }
> {
  const user = await getCurrentUser();
  if (!user) {
    return { response: Response.json({ error: "未登录" }, { status: 401 }) };
  }
  if (user.role !== "ADMIN") {
    return { response: Response.json({ error: "无权限" }, { status: 403 }) };
  }
  return { user };
}
