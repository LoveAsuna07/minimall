"use client";

import { useRef, useState } from "react";
import { OrderStatusBadge } from "@/components/order-status-badge";
import {
  ADMIN_ORDER_TRANSITIONS,
  isOrderStatus,
  type OrderStatus,
} from "@/lib/constants";
import { formatCents, formatDate } from "@/lib/format";

type AdminOrder = {
  id: string;
  orderNo: string;
  total: number;
  status: string;
  createdAt: string;
  itemCount: number;
  userName: string;
  userEmail: string;
};

type AdminOrderManagerProps = {
  initialOrders: AdminOrder[];
};

const ACTION_LABELS: Record<string, string> = {
  PAID: "标记已支付",
  SHIPPED: "标记已发货",
  COMPLETED: "标记已完成",
  CANCELLED: "取消订单",
};

function nextStatuses(status: string): OrderStatus[] {
  if (!isOrderStatus(status)) {
    return [];
  }
  return ADMIN_ORDER_TRANSITIONS[status];
}

export function AdminOrderManager({
  initialOrders,
}: AdminOrderManagerProps) {
  const [orders, setOrders] = useState<AdminOrder[]>(initialOrders);
  const [pending, setPending] = useState<{
    orderId: string;
    target: string;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const busyRef = useRef(false);

  async function updateStatus(order: AdminOrder, target: string) {
    if (busyRef.current) {
      return;
    }
    if (
      target === "CANCELLED" &&
      !window.confirm(
        `确定取消订单 ${order.orderNo} 吗？取消后会回补库存。`,
      )
    ) {
      return;
    }

    busyRef.current = true;
    setPending({ orderId: order.id, target });
    setError(null);

    try {
      const response = await fetch(`/api/admin/orders/${order.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: target }),
      });
      const data = await response.json().catch(() => null);

      if (!response.ok) {
        setError(data?.error ?? "更新订单状态失败");
        return;
      }

      const updatedStatus = data.order.status as string;
      setOrders((previous) =>
        previous.map((item) =>
          item.id === order.id ? { ...item, status: updatedStatus } : item,
        ),
      );
    } catch {
      setError("网络错误，请稍后重试");
    } finally {
      busyRef.current = false;
      setPending(null);
    }
  }

  return (
    <section className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-200 px-5 py-4">
        <h2 className="text-lg font-medium text-zinc-900">订单列表</h2>
        <span className="text-sm text-zinc-500">共 {orders.length} 个订单</span>
      </div>

      {error ? (
        <p
          role="alert"
          className="mx-5 mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700"
        >
          {error}
        </p>
      ) : null}

      {orders.length === 0 ? (
        <p className="px-5 py-12 text-center text-sm text-zinc-500">
          还没有订单。
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-zinc-50 text-xs uppercase tracking-wide text-zinc-500">
              <tr>
                <th className="px-5 py-3 font-medium">订单</th>
                <th className="px-5 py-3 font-medium">用户</th>
                <th className="px-5 py-3 font-medium">商品数</th>
                <th className="px-5 py-3 font-medium">金额</th>
                <th className="px-5 py-3 font-medium">状态</th>
                <th className="px-5 py-3 text-right font-medium">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {orders.map((order) => {
                const targets = nextStatuses(order.status);
                const busy = pending !== null;

                return (
                  <tr
                    key={order.id}
                    className="align-top transition-colors hover:bg-zinc-50/70"
                  >
                    <td className="px-5 py-3">
                      <div className="font-mono text-sm text-zinc-900">
                        {order.orderNo}
                      </div>
                      <div className="mt-1 text-xs text-zinc-400">
                        {formatDate(order.createdAt)}
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <div className="text-zinc-900">{order.userName}</div>
                      <div className="text-xs text-zinc-400">
                        {order.userEmail}
                      </div>
                    </td>
                    <td className="px-5 py-3 text-zinc-600">
                      {order.itemCount} 件
                    </td>
                    <td className="px-5 py-3 font-medium text-zinc-900">
                      {formatCents(order.total)}
                    </td>
                    <td className="px-5 py-3">
                      <OrderStatusBadge status={order.status} />
                    </td>
                    <td className="px-5 py-3">
                      {targets.length === 0 ? (
                        <span className="block text-right text-xs text-zinc-300">
                          —
                        </span>
                      ) : (
                        <div className="flex flex-wrap justify-end gap-2">
                          {targets.map((target) => {
                            const acting =
                              pending?.orderId === order.id &&
                              pending.target === target;
                            const isCancel = target === "CANCELLED";

                            return (
                              <button
                                key={target}
                                type="button"
                                onClick={() =>
                                  void updateStatus(order, target)
                                }
                                disabled={busy}
                                className={
                                  isCancel
                                    ? "rounded-md border border-zinc-300 px-2 py-1 text-xs font-medium text-red-600 transition hover:border-red-300 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                                    : "rounded-md bg-emerald-600 px-2 py-1 text-xs font-medium text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
                                }
                              >
                                {acting
                                  ? "处理中…"
                                  : ACTION_LABELS[target]}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <p className="border-t border-zinc-100 px-5 py-3 text-xs text-zinc-400">
        状态流转：待付款 → 已支付 → 已发货 → 已完成；取消订单会回补库存。
      </p>
    </section>
  );
}
