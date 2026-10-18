import { NextResponse } from "next/server";
import { setSession } from "@/lib/auth";
import { createUser } from "@/lib/auth-service";
import { isUniqueConstraintError } from "@/lib/prisma-errors";
import { registerInputSchema } from "@/lib/validation";

export const dynamic = "force-dynamic";

// POST /api/auth/register
export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "请求体必须是合法的 JSON" }, { status: 400 });
  }

  const parsed = registerInputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "输入校验失败",
        fieldErrors: parsed.error.flatten().fieldErrors,
      },
      { status: 400 },
    );
  }

  try {
    const user = await createUser(parsed.data);
    await setSession(user.id, user.role);
    return NextResponse.json({ user }, { status: 201 });
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      return NextResponse.json(
        { error: "该邮箱已被注册" },
        { status: 409 },
      );
    }
    throw error;
  }
}
