import type { Metadata } from "next";
import { AdminOrderManager } from "@/components/admin-order-manager";
import { getAllOrders } from "@/lib/orders";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "订单管理 | Mini Mall",
};

export default async function AdminOrdersPage() {
  const orders = await getAllOrders();

  const initialOrders = orders.map((order) => ({
    id: order.id,
    orderNo: order.orderNo,
    total: order.total,
    status: order.status,
    createdAt: order.createdAt.toISOString(),
    itemCount: order._count.items,
    userName: order.user.name,
    userEmail: order.user.email,
  }));

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">
          订单管理
        </h1>
        <p className="mt-1 text-sm text-zinc-500">
          查看全部订单并推进订单状态。取消订单会回补库存。
        </p>
      </div>

      <AdminOrderManager initialOrders={initialOrders} />
    </div>
  );
}
