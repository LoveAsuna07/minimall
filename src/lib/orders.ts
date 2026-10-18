import "server-only";
import { randomBytes } from "node:crypto";
import type { Prisma } from "@prisma/client";
import {
  ADMIN_ORDER_TRANSITIONS,
  FREE_SHIPPING_THRESHOLD,
  SHIPPING_FEE,
  isOrderStatus,
} from "@/lib/constants";
import { prisma } from "@/lib/prisma";

export type OrderWithItems = Prisma.OrderGetPayload<{
  include: { items: true };
}>;

export type OrderErrorItem = {
  productId: string;
  name: string;
  requested: number;
  available: number;
};

export type OrderErrorCode =
  | "EMPTY_CART"
  | "PRODUCT_UNAVAILABLE"
  | "INSUFFICIENT_STOCK"
  | "ORDER_NOT_FOUND"
  | "INVALID_STATUS";

export class OrderOperationError extends Error {
  constructor(
    public readonly code: OrderErrorCode,
    message: string,
    public readonly items?: OrderErrorItem[],
  ) {
    super(message);
    this.name = "OrderOperationError";
  }
}

type ShippingInfo = {
  shipName: string;
  shipPhone: string;
  shipAddress: string;
};

function generateOrderNo(): string {
  const stamp = new Date()
    .toISOString()
    .replace(/[-:TZ.]/g, "")
    .slice(0, 14);
  const random = randomBytes(4).toString("hex").toUpperCase();
  return `MM${stamp}${random}`;
}

function stockErrorItems(
  items: Array<{
    productId: string;
    quantity: number;
    product: { name: string; stock: number };
  }>,
): OrderErrorItem[] {
  return items.map((item) => ({
    productId: item.productId,
    name: item.product.name,
    requested: item.quantity,
    available: item.product.stock,
  }));
}

// 从购物车创建订单：创建订单 → 扣减库存 → 清空购物车
export async function createOrderFromCart(
  userId: string,
  shipping: ShippingInfo,
): Promise<OrderWithItems> {
  return prisma.$transaction(
    async (tx) => {
      const cartItems = await tx.cartItem.findMany({
        where: { userId },
        include: { product: true },
        orderBy: { createdAt: "asc" },
      });

      if (cartItems.length === 0) {
        throw new OrderOperationError("EMPTY_CART", "购物车为空");
      }

      const unavailable = cartItems.filter((item) => !item.product.active);
      if (unavailable.length > 0) {
        throw new OrderOperationError(
          "PRODUCT_UNAVAILABLE",
          "部分商品已下架，请先从购物车移除",
          unavailable.map((item) => ({
            productId: item.productId,
            name: item.product.name,
            requested: item.quantity,
            available: 0,
          })),
        );
      }

      const insufficient = cartItems.filter(
        (item) => item.quantity > item.product.stock,
      );
      if (insufficient.length > 0) {
        throw new OrderOperationError(
          "INSUFFICIENT_STOCK",
          "部分商品库存不足",
          stockErrorItems(insufficient),
        );
      }

      // 条件扣减库存，防止其他订单并发超卖
      for (const item of cartItems) {
        const result = await tx.product.updateMany({
          where: {
            id: item.productId,
            active: true,
            stock: { gte: item.quantity },
          },
          data: { stock: { decrement: item.quantity } },
        });

        if (result.count !== 1) {
          const latest = await tx.product.findUnique({
            where: { id: item.productId },
            select: { name: true, stock: true },
          });
          throw new OrderOperationError(
            "INSUFFICIENT_STOCK",
            "部分商品库存不足",
            [
              {
                productId: item.productId,
                name: latest?.name ?? item.product.name,
                requested: item.quantity,
                available: latest?.stock ?? 0,
              },
            ],
          );
        }
      }

      const subtotal = cartItems.reduce(
        (sum, item) => sum + item.product.price * item.quantity,
        0,
      );
      const shippingFee =
        subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_FEE;

      const order = await tx.order.create({
        data: {
          orderNo: generateOrderNo(),
          userId,
          status: "PENDING",
          subtotal,
          shipping: shippingFee,
          total: subtotal + shippingFee,
          shipName: shipping.shipName,
          shipPhone: shipping.shipPhone,
          shipAddress: shipping.shipAddress,
          items: {
            create: cartItems.map((item) => ({
              productId: item.productId,
              name: item.product.name,
              price: item.product.price,
              quantity: item.quantity,
              imageUrl: item.product.imageUrl,
            })),
          },
        },
        include: { items: true },
      });

      await tx.cartItem.deleteMany({ where: { userId } });

      return order;
    },
    { timeout: 15_000 },
  );
}

// 后台订单列表
export async function getAllOrders() {
  return prisma.order.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      user: { select: { name: true, email: true } },
      _count: { select: { items: true } },
    },
  });
}

// 我的订单列表
export async function getUserOrders(userId: string) {
  return prisma.order.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { items: true } } },
  });
}

// 订单详情；按 id + userId 查询，防止越权
export async function getUserOrder(userId: string, orderId: string) {
  return prisma.order.findFirst({
    where: { id: orderId, userId },
    include: { items: true },
  });
}

// 模拟支付：PENDING → PAID
export async function payOrder(
  userId: string,
  orderId: string,
): Promise<OrderWithItems> {
  return prisma.$transaction(async (tx) => {
    const order = await tx.order.findFirst({
      where: { id: orderId, userId },
      select: { id: true, status: true },
    });

    if (!order) {
      throw new OrderOperationError("ORDER_NOT_FOUND", "订单不存在");
    }

    if (order.status !== "PENDING") {
      throw new OrderOperationError(
        "INVALID_STATUS",
        "当前订单状态不可支付",
      );
    }

    const result = await tx.order.updateMany({
      where: { id: orderId, userId, status: "PENDING" },
      data: { status: "PAID", paidAt: new Date() },
    });

    if (result.count !== 1) {
      throw new OrderOperationError(
        "INVALID_STATUS",
        "订单状态已变化，请刷新后重试",
      );
    }

    const updated = await tx.order.findFirst({
      where: { id: orderId, userId },
      include: { items: true },
    });

    if (!updated) {
      throw new OrderOperationError("ORDER_NOT_FOUND", "订单不存在");
    }
    return updated;
  });
}

// 后台更新订单状态；按 ADMIN_ORDER_TRANSITIONS 校验流转
export async function adminUpdateOrderStatus(
  orderId: string,
  target: string,
): Promise<OrderWithItems> {
  return prisma.$transaction(async (tx) => {
    const order = await tx.order.findUnique({
      where: { id: orderId },
      include: { items: true },
    });

    if (!order) {
      throw new OrderOperationError("ORDER_NOT_FOUND", "订单不存在");
    }

    if (!isOrderStatus(order.status) || !isOrderStatus(target)) {
      throw new OrderOperationError("INVALID_STATUS", "订单状态无效");
    }

    const allowed = ADMIN_ORDER_TRANSITIONS[order.status];
    if (!allowed.includes(target)) {
      throw new OrderOperationError(
        "INVALID_STATUS",
        "当前订单状态不可变更为该状态",
      );
    }

    const data: Prisma.OrderUpdateInput = { status: target };
    if (target === "PAID" && !order.paidAt) {
      data.paidAt = new Date();
    }

    await tx.order.update({ where: { id: order.id }, data });

    if (target === "CANCELLED") {
      for (const item of order.items) {
        if (item.productId) {
          await tx.product.updateMany({
            where: { id: item.productId },
            data: { stock: { increment: item.quantity } },
          });
        }
      }
    }

    const updated = await tx.order.findUnique({
      where: { id: order.id },
      include: { items: true },
    });

    if (!updated) {
      throw new OrderOperationError("ORDER_NOT_FOUND", "订单不存在");
    }
    return updated;
  });
}

// 取消订单：任意未取消状态均可取消，并回补库存
export async function cancelOrder(
  userId: string,
  orderId: string,
): Promise<OrderWithItems> {
  return prisma.$transaction(async (tx) => {
    const order = await tx.order.findFirst({
      where: { id: orderId, userId },
      include: { items: true },
    });

    if (!order) {
      throw new OrderOperationError("ORDER_NOT_FOUND", "订单不存在");
    }

    if (order.status === "CANCELLED") {
      throw new OrderOperationError(
        "INVALID_STATUS",
        "订单已取消，请勿重复操作",
      );
    }

    await tx.order.update({
      where: { id: order.id },
      data: { status: "CANCELLED" },
    });

    // 回补库存；商品已被删除时跳过
    for (const item of order.items) {
      if (item.productId) {
        await tx.product.updateMany({
          where: { id: item.productId },
          data: { stock: { increment: item.quantity } },
        });
      }
    }

    const updated = await tx.order.findFirst({
      where: { id: order.id },
      include: { items: true },
    });

    if (!updated) {
      throw new OrderOperationError("ORDER_NOT_FOUND", "订单不存在");
    }
    return updated;
  });
}
