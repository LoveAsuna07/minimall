import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { OrderActions } from "@/components/order-actions";
import { OrderStatusBadge } from "@/components/order-status-badge";
import { ProductImage } from "@/components/product-image";
import { ShopShell } from "@/components/shop-shell";
import { requireUser } from "@/lib/auth";
import { formatCents, formatDate } from "@/lib/format";
import { getUserOrder } from "@/lib/orders";

export const dynamic = "force-dynamic";

type OrderDetailPageProps = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata(): Promise<Metadata> {
  return { title: "订单详情 | Mini Mall" };
}

export default async function OrderDetailPage({
  params,
}: OrderDetailPageProps) {
  const { id } = await params;
  const user = await requireUser(`/orders/${id}`);
  const order = await getUserOrder(user.id, id);

  if (!order) {
    notFound();
  }

  return (
    <ShopShell>
      <main className="mx-auto max-w-4xl px-4 py-8">
        <Link
          href="/orders"
          className="text-sm text-zinc-500 transition hover:text-zinc-900"
        >
          ← 返回我的订单
        </Link>

        <div className="mt-4 overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-4 border-b border-zinc-200 p-6">
            <div>
              <h1 className="text-xl font-semibold tracking-tight text-zinc-900">
                订单 {order.orderNo}
              </h1>
              <p className="mt-1 text-sm text-zinc-500">
                下单时间：{formatDate(order.createdAt)}
              </p>
              {order.paidAt ? (
                <p className="mt-1 text-sm text-zinc-500">
                  支付时间：{formatDate(order.paidAt)}
                </p>
              ) : null}
            </div>
            <OrderStatusBadge status={order.status} />
          </div>

          <div className="divide-y divide-zinc-100 px-6">
            {order.items.map((item) => (
              <div key={item.id} className="flex gap-4 py-4">
                <ProductImage
                  src={item.imageUrl}
                  alt={item.name}
                  className="h-20 w-20 rounded-lg object-cover"
                />
                <div className="min-w-0 flex-1">
                  {item.productId ? (
                    <Link
                      href={`/products/${item.productId}`}
                      className="font-medium text-zinc-900 transition hover:text-emerald-700"
                    >
                      {item.name}
                    </Link>
                  ) : (
                    <p className="font-medium text-zinc-900">{item.name}</p>
                  )}
                  <p className="mt-1 text-sm text-zinc-500">
                    {formatCents(item.price)} × {item.quantity}
                  </p>
                </div>
                <p className="font-medium text-zinc-900">
                  {formatCents(item.price * item.quantity)}
                </p>
              </div>
            ))}
          </div>

          <div className="border-t border-zinc-200 p-6">
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-zinc-500">商品小计</dt>
                <dd className="text-zinc-900">{formatCents(order.subtotal)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-zinc-500">运费</dt>
                <dd className="text-zinc-900">
                  {order.shipping === 0 ? "包邮" : formatCents(order.shipping)}
                </dd>
              </div>
              <div className="flex justify-between border-t border-zinc-100 pt-2 text-base font-semibold">
                <dt className="text-zinc-900">合计</dt>
                <dd className="text-emerald-700">{formatCents(order.total)}</dd>
              </div>
            </dl>

            <div className="mt-6 rounded-lg bg-zinc-50 p-4 text-sm">
              <h2 className="font-medium text-zinc-900">收货信息</h2>
              <p className="mt-1 text-zinc-600">
                {order.shipName} · {order.shipPhone}
              </p>
              <p className="text-zinc-600">{order.shipAddress}</p>
            </div>

            <div className="mt-6">
              <OrderActions orderId={order.id} status={order.status} />
            </div>
          </div>
        </div>
      </main>
    </ShopShell>
  );
}
