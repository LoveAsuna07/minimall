import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { requireAdminApi } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { readJsonBody } from "@/lib/request";
import { productInputSchema } from "@/lib/validation";

export const dynamic = "force-dynamic";

type ProductRouteContext = {
  params: Promise<{ id: string }>;
};

const categorySelect = {
  category: { select: { id: true, name: true, slug: true } },
} as const;

// GET /api/admin/products/:id — 商品详情
export async function GET(
  _request: Request,
  context: ProductRouteContext,
) {
  const auth = await requireAdminApi();
  if ("response" in auth) {
    return auth.response;
  }

  const { id } = await context.params;
  const product = await prisma.product.findUnique({
    where: { id },
    include: categorySelect,
  });

  if (!product) {
    return NextResponse.json({ error: "商品不存在" }, { status: 404 });
  }

  return NextResponse.json({ product });
}

// PUT /api/admin/products/:id — 更新商品
export async function PUT(
  request: Request,
  context: ProductRouteContext,
) {
  const auth = await requireAdminApi();
  if ("response" in auth) {
    return auth.response;
  }

  const { id } = await context.params;

  const json = await readJsonBody(request);
  if (!json.ok) {
    return NextResponse.json({ error: "请求体必须是合法的 JSON" }, { status: 400 });
  }

  const parsed = productInputSchema.safeParse(json.body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "输入校验失败",
        fieldErrors: parsed.error.flatten().fieldErrors,
      },
      { status: 400 },
    );
  }

  const category = await prisma.category.findUnique({
    where: { id: parsed.data.categoryId },
    select: { id: true },
  });

  if (!category) {
    return NextResponse.json({ error: "分类不存在" }, { status: 400 });
  }

  try {
    const product = await prisma.product.update({
      where: { id },
      data: {
        name: parsed.data.name,
        description: parsed.data.description,
        price: parsed.data.price,
        imageUrl: parsed.data.imageUrl,
        stock: parsed.data.stock,
        categoryId: parsed.data.categoryId,
        active: parsed.data.active,
      },
      include: categorySelect,
    });

    return NextResponse.json({ product });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2025"
    ) {
      return NextResponse.json({ error: "商品不存在" }, { status: 404 });
    }
    throw error;
  }
}

// DELETE /api/admin/products/:id — 删除商品
export async function DELETE(
  _request: Request,
  context: ProductRouteContext,
) {
  const auth = await requireAdminApi();
  if ("response" in auth) {
    return auth.response;
  }

  const { id } = await context.params;

  // 并发删除时 deleteMany 不会抛 P2025
  const result = await prisma.product.deleteMany({ where: { id } });
  if (result.count === 0) {
    return NextResponse.json({ error: "商品不存在" }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
