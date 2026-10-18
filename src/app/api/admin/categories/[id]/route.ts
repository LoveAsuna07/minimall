import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { requireAdminApi } from "@/lib/auth";
import {
  isUniqueConstraintError,
  uniqueCategoryErrorMessage,
} from "@/lib/prisma-errors";
import { prisma } from "@/lib/prisma";
import { readJsonBody } from "@/lib/request";
import { categoryInputSchema } from "@/lib/validation";

export const dynamic = "force-dynamic";

type CategoryRouteContext = {
  params: Promise<{ id: string }>;
};

// GET /api/admin/categories/:id — 分类详情
export async function GET(_request: Request, context: CategoryRouteContext) {
  const auth = await requireAdminApi();
  if ("response" in auth) {
    return auth.response;
  }

  const { id } = await context.params;
  const category = await prisma.category.findUnique({
    where: { id },
    include: { _count: { select: { products: true } } },
  });

  if (!category) {
    return NextResponse.json({ error: "分类不存在" }, { status: 404 });
  }

  return NextResponse.json(category);
}

// PUT /api/admin/categories/:id — 更新分类
export async function PUT(request: Request, context: CategoryRouteContext) {
  const auth = await requireAdminApi();
  if ("response" in auth) {
    return auth.response;
  }

  const { id } = await context.params;

  const json = await readJsonBody(request);
  if (!json.ok) {
    return NextResponse.json(
      { error: "请求体必须是合法的 JSON" },
      { status: 400 },
    );
  }

  const parsed = categoryInputSchema.safeParse(json.body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "输入校验失败", fieldErrors: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  try {
    const category = await prisma.category.update({
      where: { id },
      data: parsed.data,
    });
    return NextResponse.json(category);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2025") {
        return NextResponse.json({ error: "分类不存在" }, { status: 404 });
      }
      if (isUniqueConstraintError(error)) {
        return NextResponse.json(
          { error: uniqueCategoryErrorMessage(error) },
          { status: 409 },
        );
      }
    }
    throw error;
  }
}

// DELETE /api/admin/categories/:id — 删除分类
export async function DELETE(_request: Request, context: CategoryRouteContext) {
  const auth = await requireAdminApi();
  if ("response" in auth) {
    return auth.response;
  }

  const { id } = await context.params;
  const category = await prisma.category.findUnique({
    where: { id },
    include: { _count: { select: { products: true } } },
  });

  if (!category) {
    return NextResponse.json({ error: "分类不存在" }, { status: 404 });
  }

  if (category._count.products > 0) {
    return NextResponse.json(
      { error: `该分类下还有 ${category._count.products} 件商品，无法删除` },
      { status: 409 },
    );
  }

  try {
    // deleteMany 在并发删除时不会抛 P2025，改为根据 count 判断
    const result = await prisma.category.deleteMany({ where: { id } });
    if (result.count === 0) {
      return NextResponse.json({ error: "分类不存在" }, { status: 404 });
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2003"
    ) {
      return NextResponse.json(
        { error: "该分类仍被商品引用，无法删除" },
        { status: 409 },
      );
    }
    throw error;
  }
}
