"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { AuthActionState } from "@/lib/action-state";
import { clearSession, safeNext, setSession } from "@/lib/auth";
import { authenticateUser, createUser } from "@/lib/auth-service";
import { isUniqueConstraintError } from "@/lib/prisma-errors";
import { loginInputSchema, registerFormSchema } from "@/lib/validation";

function getNext(formData: FormData): string {
  return safeNext(String(formData.get("next") ?? "")) ?? "/";
}

// 登录：校验邮箱密码并创建会话
export async function loginAction(
  _previous: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  void _previous;

  const next = getNext(formData);
  const parsed = loginInputSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return {
      ok: false,
      message: "请检查输入",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  // 不区分“邮箱不存在”和“密码错误”，避免账号枚举
  const user = await authenticateUser(
    parsed.data.email,
    parsed.data.password,
  );

  if (!user) {
    return { ok: false, message: "邮箱或密码错误" };
  }

  await setSession(user.id, user.role);
  revalidatePath("/", "layout");
  redirect(next);
}

// 注册：创建普通用户并自动登录
export async function registerAction(
  _previous: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  void _previous;

  const next = getNext(formData);
  const parsed = registerFormSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });

  if (!parsed.success) {
    return {
      ok: false,
      message: "请检查输入",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  try {
    const user = await createUser({
      name: parsed.data.name,
      email: parsed.data.email,
      password: parsed.data.password,
    });
    await setSession(user.id, user.role);
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      return {
        ok: false,
        message: "该邮箱已被注册",
        fieldErrors: { email: ["该邮箱已被注册"] },
      };
    }
    throw error;
  }

  revalidatePath("/", "layout");
  redirect(next);
}

// 退出登录
export async function logoutAction(): Promise<void> {
  await clearSession();
  revalidatePath("/", "layout");
  redirect("/");
}
