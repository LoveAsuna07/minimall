import { NextResponse } from "next/server";
import { requireUserApi } from "@/lib/auth";
import { addCartItem, getCart } from "@/lib/cart";
import { cartErrorResponse } from "@/lib/cart-api";
import { readJsonBody } from "@/lib/request";
import { addCartItemSchema } from "@/lib/validation";

export const dynamic = "force-dynamic";

// GET /api/cart — 当前用户购物车
export async function GET() {
  const auth = await requireUserApi();
  if ("response" in auth) {
    return auth.response;
  }

  const cart = await getCart(auth.user.id);
  return NextResponse.json(cart);
}

// POST /api/cart — 加入购物车（已存在则累加数量）
export async function POST(request: Request) {
  const auth = await requireUserApi();
  if ("response" in auth) {
    return auth.response;
  }

  const json = await readJsonBody(request);
  if (!json.ok) {
    return NextResponse.json(
      { error: "请求体必须是合法的 JSON" },
      { status: 400 },
    );
  }

  const parsed = addCartItemSchema.safeParse(json.body);
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
    const item = await addCartItem(
      auth.user.id,
      parsed.data.productId,
      parsed.data.quantity,
    );
    return NextResponse.json({ item });
  } catch (error) {
    return cartErrorResponse(error);
  }
}
