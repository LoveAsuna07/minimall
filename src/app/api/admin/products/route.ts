import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { readJsonBody } from "@/lib/request";
import { productInputSchema } from "@/lib/validation";

export const dynamic = "force-dynamic";

const categorySelect = {
  category: { select: { id: true, name: true, slug: true } },
} as const;

// GET /api/admin/products — 全部商品（含下架）
export async function GET() {
  const auth = await requireAdminApi();
  if ("response" in auth) {
    return auth.response;
  }

  const products = await prisma.product.findMany({
    orderBy: { createdAt: "desc" },
    include: categorySelect,
  });

  return NextResponse.json(products);
}

// POST /api/admin/products — 新增商品
export async function POST(request: Request) {
  const auth = await requireAdminApi();
  if ("response" in auth) {
    return auth.response;
  }

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

  const product = await prisma.product.create({
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

  return NextResponse.json({ product }, { status: 201 });
}
