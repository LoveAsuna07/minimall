import { NextResponse } from "next/server";
import { setSession } from "@/lib/auth";
import { authenticateUser } from "@/lib/auth-service";
import { loginInputSchema } from "@/lib/validation";

export const dynamic = "force-dynamic";

// POST /api/auth/login
export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "请求体必须是合法的 JSON" }, { status: 400 });
  }

  const parsed = loginInputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "输入校验失败",
        fieldErrors: parsed.error.flatten().fieldErrors,
      },
      { status: 400 },
    );
  }

  const user = await authenticateUser(
    parsed.data.email,
    parsed.data.password,
  );

  // 不区分“用户不存在”和“密码错误”，防止账号枚举
  if (!user) {
    return NextResponse.json({ error: "邮箱或密码错误" }, { status: 401 });
  }

  await setSession(user.id, user.role);
  return NextResponse.json({ user });
}
