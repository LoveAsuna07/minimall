"use server";

import type { CartActionState } from "@/lib/action-state";
import { requireUser } from "@/lib/auth";
import { addCartItem, CartOperationError } from "@/lib/cart";

// 加入购物车；未登录时由 requireUser 跳转登录页
export async function addToCartAction(
  _previous: CartActionState,
  formData: FormData,
): Promise<CartActionState> {
  void _previous;

  const productId = String(formData.get("productId") ?? "");
  const nextPath = String(formData.get("next") ?? "/");
  const user = await requireUser(nextPath);

  if (!productId) {
    return { ok: false, message: "缺少商品信息" };
  }

  try {
    await addCartItem(user.id, productId, 1);
    return { ok: true, message: "已加入购物车" };
  } catch (error) {
    if (error instanceof CartOperationError) {
      const suffix =
        error.available !== undefined ? `，仅剩 ${error.available} 件` : "";
      return { ok: false, message: `${error.message}${suffix}` };
    }
    throw error;
  }
}
