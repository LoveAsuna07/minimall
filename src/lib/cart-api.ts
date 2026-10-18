import { NextResponse } from "next/server";
import { CartOperationError } from "@/lib/cart";

// 把购物车领域错误映射为 HTTP 响应
export function cartErrorResponse(error: unknown): NextResponse {
  if (error instanceof CartOperationError) {
    const status =
      error.code === "PRODUCT_NOT_FOUND" || error.code === "ITEM_NOT_FOUND"
        ? 404
        : 409;

    return NextResponse.json(
      { error: error.message, available: error.available },
      { status },
    );
  }

  throw error;
}
