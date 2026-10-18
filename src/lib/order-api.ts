import { NextResponse } from "next/server";
import { OrderOperationError } from "@/lib/orders";

// 把订单领域错误映射为 HTTP 响应
export function orderErrorResponse(error: unknown): NextResponse {
  if (error instanceof OrderOperationError) {
    const status =
      error.code === "ORDER_NOT_FOUND"
        ? 404
        : error.code === "EMPTY_CART"
          ? 400
          : 409;

    return NextResponse.json(
      { error: error.message, items: error.items },
      { status },
    );
  }

  throw error;
}
