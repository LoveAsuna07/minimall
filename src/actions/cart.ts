"use server";

import type { CartItem } from "@prisma/client";
import type { CartActionState } from "@/lib/action-state";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isUniqueConstraintError } from "@/lib/prisma-errors";

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

  const product = await prisma.product.findFirst({
    where: { id: productId, active: true },
  });

  if (!product) {
    return { ok: false, message: "商品不存在或已下架" };
  }

  if (product.stock <= 0) {
    return { ok: false, message: "商品暂时缺货" };
  }

  // 使用原子增量更新，避免并发加购时丢失数量
  let item: CartItem;
  try {
    item = await prisma.cartItem.upsert({
      where: { userId_productId: { userId: user.id, productId } },
      create: { userId: user.id, productId, quantity: 1 },
      update: { quantity: { increment: 1 } },
    });
  } catch (error) {
    if (!isUniqueConstraintError(error)) {
      throw error;
    }
    // 并发创建同一购物车项时，改为增量更新重试
    item = await prisma.cartItem.update({
      where: { userId_productId: { userId: user.id, productId } },
      data: { quantity: { increment: 1 } },
    });
  }

  // 数量超过库存时回退到库存上限
  if (item.quantity > product.stock) {
    await prisma.cartItem.update({
      where: { id: item.id },
      data: { quantity: product.stock },
    });
    return { ok: false, message: "已达该商品的库存上限" };
  }

  // 当前页面没有展示购物车状态；等购物车页面/Header 数量实现后再按需 revalidate
  return { ok: true, message: "已加入购物车" };
}
