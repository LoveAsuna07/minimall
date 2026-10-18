import "server-only";
import { compare, hash } from "bcryptjs";

// bcryptjs 为纯 JS 实现，避免 Windows 下原生编译问题
export function hashPassword(password: string): Promise<string> {
  return hash(password, 10);
}

export function verifyPassword(
  password: string,
  passwordHash: string,
): Promise<boolean> {
  return compare(password, passwordHash);
}
