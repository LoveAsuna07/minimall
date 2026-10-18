import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/auth";
import {
  isUniqueConstraintError,
  uniqueCategoryErrorMessage,
} from "@/lib/prisma-errors";
import { prisma } from "@/lib/prisma";
import { categoryInputSchema } from "@/lib/validation";

export const dynamic = "force-dynamic";

// GET /api/admin/categories — 分类列表
export async function GET() {
  const auth = await requireAdminApi();
  if ("response" in auth) {
    return auth.response;
  }

  const categories = await prisma.category.findMany({
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { products: true } } },
  });

  return NextResponse.json(categories);
}

// POST /api/admin/categories — 新建分类
export async function POST(request: Request) {
  const auth = await requireAdminApi();
  if ("response" in auth) {
    return auth.response;
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "请求体必须是合法的 JSON" }, { status: 400 });
  }

  const parsed = categoryInputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "输入校验失败", fieldErrors: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  try {
    const category = await prisma.category.create({ data: parsed.data });
    return NextResponse.json(category, { status: 201 });
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      return NextResponse.json(
        { error: uniqueCategoryErrorMessage(error) },
        { status: 409 },
      );
    }
    throw error;
  }
}
