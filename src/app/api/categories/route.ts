import { NextResponse } from "next/server";
import { getCategoriesWithCounts } from "@/lib/products";

export const dynamic = "force-dynamic";

// GET /api/categories — 分类列表及各分类的上架商品数
export async function GET() {
  const categories = await getCategoriesWithCounts();
  return NextResponse.json(categories);
}
