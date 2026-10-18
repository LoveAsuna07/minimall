import { NextResponse } from "next/server";
import { getProductById } from "@/lib/products";

export const dynamic = "force-dynamic";

type ProductRouteContext = {
  params: Promise<{ id: string }>;
};

// GET /api/products/:id
export async function GET(_request: Request, context: ProductRouteContext) {
  const { id } = await context.params;
  const product = await getProductById(id);

  if (!product) {
    return NextResponse.json({ error: "商品不存在" }, { status: 404 });
  }

  return NextResponse.json(product);
}
