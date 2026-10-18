// 商品列表每页数量
export const PRODUCT_PAGE_SIZE = 9;

// 运费规则：满 ¥99 包邮，否则 ¥10
export const SHIPPING_FEE = 1000;
export const FREE_SHIPPING_THRESHOLD = 9900;

// 订单状态；数据库中是字符串，这里用联合类型约束
export const ORDER_STATUSES = [
  "PENDING",
  "PAID",
  "SHIPPED",
  "COMPLETED",
  "CANCELLED",
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  PENDING: "待付款",
  PAID: "已支付",
  SHIPPED: "已发货",
  COMPLETED: "已完成",
  CANCELLED: "已取消",
};

// 状态徽章的静态 class，避免 Tailwind 动态拼接
export const ORDER_STATUS_CLASSES: Record<OrderStatus, string> = {
  PENDING: "bg-amber-50 text-amber-700",
  PAID: "bg-emerald-50 text-emerald-700",
  SHIPPED: "bg-blue-50 text-blue-700",
  COMPLETED: "bg-zinc-100 text-zinc-700",
  CANCELLED: "bg-red-50 text-red-700",
};

export function isOrderStatus(value: string): value is OrderStatus {
  return (ORDER_STATUSES as readonly string[]).includes(value);
}

// 后台可执行的订单状态流转；取消可从任意未取消状态发起
export const ADMIN_ORDER_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  PENDING: ["PAID", "CANCELLED"],
  PAID: ["SHIPPED", "CANCELLED"],
  SHIPPED: ["COMPLETED", "CANCELLED"],
  COMPLETED: ["CANCELLED"],
  CANCELLED: [],
};
