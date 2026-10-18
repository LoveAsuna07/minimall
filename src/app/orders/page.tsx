import type { Metadata } from "next";
import Link from "next/link";
import { OrderStatusBadge } from "@/components/order-status-badge";
import { ShopShell } from "@/components/shop-shell";
import { requireUser } from "@/lib/auth";
import { formatCents, formatDate } from "@/lib/format";
import { getUserOrders, sumOrderItemQuantity } from "@/lib/orders";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "我的订单 | Mini Mall",
};

export default async function OrdersPage() {
  const user = await requireUser("/orders");
  const orders = await getUserOrders(user.id);

  return (
    <ShopShell>
      <main className="mx-auto max-w-4xl px-4 py-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">
              我的订单
            </h1>
            <p className="mt-1 text-sm text-zinc-500">共 {orders.length} 个订单</p>
          </div>
          <Link
            href="/"
            className="text-sm text-emerald-700 transition hover:underline"
          >
            继续购物
          </Link>
        </div>

        {orders.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-zinc-300 bg-white px-6 py-20 text-center">
            <p className="text-lg font-medium text-zinc-900">还没有订单</p>
            <p className="mt-1 text-sm text-zinc-500">
              挑选商品并提交订单后会显示在这里。
            </p>
            <Link
              href="/"
              className="mt-4 inline-block rounded-lg bg-emerald-600 px-4 py-2 text-sm text-white transition hover:bg-emerald-700"
            >
              去逛逛
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {orders.map((order) => (
              <Link
                key={order.id}
                href={`/orders/${order.id}`}
                className="block rounded-xl border border-zinc-200 bg-white p-5 shadow-sm transition hover:border-emerald-300 hover:shadow-md"
              >
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <p className="font-mono text-sm text-zinc-500">
                      {order.orderNo}
                    </p>
                    <p className="mt-1 text-xs text-zinc-400">
                      下单时间：{formatDate(order.createdAt)}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-sm text-zinc-500">
                      {sumOrderItemQuantity(order.items)} 件商品
                    </span>
                    <span className="text-lg font-semibold text-zinc-900">
                      {formatCents(order.total)}
                    </span>
                    <OrderStatusBadge status={order.status} />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </ShopShell>
  );
}
