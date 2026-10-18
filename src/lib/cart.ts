import "server-only";
import type { CartItemView, CartProduct, CartView } from "@/lib/cart-types";
import { prisma } from "@/lib/prisma";

const cartProductSelect = {
  id: true,
  name: true,
  price: true,
  imageUrl: true,
  stock: true,
  active: true,
} as const;

type CartItemWithProduct = {
  id: string;
  quantity: number;
  product: CartProduct;
};

export type CartErrorCode =
  | "PRODUCT_NOT_FOUND"
  | "PRODUCT_INACTIVE"
  | "ITEM_NOT_FOUND"
  | "INSUFFICIENT_STOCK";

export class CartOperationError extends Error {
  constructor(
    public readonly code: CartErrorCode,
    message: string,
    public readonly available?: number,
  ) {
    super(message);
    this.name = "CartOperationError";
  }
}

function toView(item: CartItemWithProduct): CartItemView {
  return {
    id: item.id,
    quantity: item.quantity,
    product: item.product,
    subtotal: item.product.active ? item.product.price * item.quantity : 0,
    available: item.product.active && item.product.stock >= item.quantity,
  };
}

// 获取购物车，只把可购买项计入合计
export async function getCart(userId: string): Promise<CartView> {
  const items = await prisma.cartItem.findMany({
    where: { userId },
    include: { product: { select: cartProductSelect } },
    orderBy: { createdAt: "asc" },
  });

  const views = items.map(toView);

  return {
    items: views,
    total: views.reduce(
      (sum, item) =>
        item.available ? sum + item.product.price * item.quantity : sum,
      0,
    ),
    count: views.reduce((sum, item) => sum + item.quantity, 0),
  };
}

// 加入购物车：事务内校验库存，超出时抛错并回滚
export async function addCartItem(
  userId: string,
  productId: string,
  quantity: number,
): Promise<CartItemWithProduct> {
  return prisma.$transaction(
    async (tx) => {
      const product = await tx.product.findFirst({
        where: { id: productId, active: true },
        select: { id: true, stock: true },
      });

      if (!product) {
        throw new CartOperationError(
          "PRODUCT_NOT_FOUND",
          "商品不存在或已下架",
        );
      }

      const item = await tx.cartItem.upsert({
        where: { userId_productId: { userId, productId } },
        create: { userId, productId, quantity },
        update: { quantity: { increment: quantity } },
        include: { product: { select: cartProductSelect } },
      });

      if (item.quantity > product.stock) {
        throw new CartOperationError(
          "INSUFFICIENT_STOCK",
          "库存不足",
          product.stock,
        );
      }

      return item;
    },
    { timeout: 15_000 },
  );
}

// 修改数量：校验归属、上架状态与库存
export async function updateCartItemQuantity(
  userId: string,
  itemId: string,
  quantity: number,
): Promise<CartItemWithProduct> {
  return prisma.$transaction(
    async (tx) => {
      const item = await tx.cartItem.findFirst({
        where: { id: itemId, userId },
        include: { product: { select: cartProductSelect } },
      });

      if (!item) {
        throw new CartOperationError("ITEM_NOT_FOUND", "购物车项不存在");
      }

      if (!item.product.active) {
        throw new CartOperationError("PRODUCT_INACTIVE", "商品已下架");
      }

      if (quantity > item.product.stock) {
        throw new CartOperationError(
          "INSUFFICIENT_STOCK",
          "库存不足",
          item.product.stock,
        );
      }

      return tx.cartItem.update({
        where: { id: item.id },
        data: { quantity },
        include: { product: { select: cartProductSelect } },
      });
    },
    { timeout: 15_000 },
  );
}

// 删除购物车项；按 id + userId 校验归属
export async function removeCartItem(
  userId: string,
  itemId: string,
): Promise<void> {
  const result = await prisma.cartItem.deleteMany({
    where: { id: itemId, userId },
  });

  if (result.count === 0) {
    throw new CartOperationError("ITEM_NOT_FOUND", "购物车项不存在");
  }
}
