import { NextResponse } from "next/server";
import { getProductList } from "@/lib/products";

export const dynamic = "force-dynamic";

// GET /api/products?search=&category=&page=
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search") ?? undefined;
  const category = searchParams.get("category") ?? undefined;
  const pageParam = searchParams.get("page");
  const parsedPage = pageParam ? Number.parseInt(pageParam, 10) : 1;
  const page = Number.isFinite(parsedPage) ? parsedPage : 1;

  const result = await getProductList({ search, category, page });

  return NextResponse.json({
    products: result.products,
    pagination: {
      page: result.page,
      pageSize: result.pageSize,
      total: result.total,
      totalPages: result.totalPages,
    },
  });
}
