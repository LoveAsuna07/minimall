import { NextResponse } from "next/server";
import { requireUserApi } from "@/lib/auth";
import { removeCartItem, updateCartItemQuantity } from "@/lib/cart";
import { cartErrorResponse } from "@/lib/cart-api";
import { updateCartItemSchema } from "@/lib/validation";

export const dynamic = "force-dynamic";

type CartItemRouteContext = {
  params: Promise<{ id: string }>;
};

// PUT /api/cart/:id — 修改数量
export async function PUT(
  request: Request,
  context: CartItemRouteContext,
) {
  const auth = await requireUserApi();
  if ("response" in auth) {
    return auth.response;
  }

  const { id } = await context.params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "请求体必须是合法的 JSON" }, { status: 400 });
  }

  const parsed = updateCartItemSchema.safeParse(body);
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
    const item = await updateCartItemQuantity(
      auth.user.id,
      id,
      parsed.data.quantity,
    );
    return NextResponse.json({ item });
  } catch (error) {
    return cartErrorResponse(error);
  }
}

// DELETE /api/cart/:id — 删除购物车项
export async function DELETE(
  _request: Request,
  context: CartItemRouteContext,
) {
  const auth = await requireUserApi();
  if ("response" in auth) {
    return auth.response;
  }

  const { id } = await context.params;

  try {
    await removeCartItem(auth.user.id, id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return cartErrorResponse(error);
  }
}
