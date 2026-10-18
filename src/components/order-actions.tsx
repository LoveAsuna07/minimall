"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type OrderActionsProps = {
  orderId: string;
  status: string;
};

export function OrderActions({ orderId, status }: OrderActionsProps) {
  const router = useRouter();
  const [pending, setPending] = useState<"pay" | "cancel" | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function run(action: "pay" | "cancel") {
    if (pending) {
      return;
    }
    if (
      action === "cancel" &&
      !window.confirm("确定取消该订单吗？取消后库存会回补。")
    ) {
      return;
    }

    setPending(action);
    setError(null);

    try {
      const response = await fetch(`/api/orders/${orderId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const data = await response.json().catch(() => null);

      if (!response.ok) {
        setError(data?.error ?? "操作失败");
        return;
      }

      // 重新渲染服务端组件，刷新订单状态
      router.refresh();
    } catch {
      setError("网络错误，请稍后重试");
    } finally {
      setPending(null);
    }
  }

  return (
    <div>
      <div className="flex flex-wrap gap-3">
        {status === "PENDING" ? (
          <button
            type="button"
            onClick={() => void run("pay")}
            disabled={pending !== null}
            className="rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {pending === "pay" ? "支付中…" : "模拟支付"}
          </button>
        ) : null}

        {status !== "CANCELLED" ? (
          <button
            type="button"
            onClick={() => void run("cancel")}
            disabled={pending !== null}
            className="rounded-xl border border-zinc-300 px-5 py-2.5 text-sm font-medium text-zinc-700 transition hover:border-red-300 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {pending === "cancel" ? "取消中…" : "取消订单"}
          </button>
        ) : null}
      </div>

      {error ? (
        <p role="alert" className="mt-3 text-sm text-red-600">
          {error}
        </p>
      ) : null}

      {status === "CANCELLED" ? (
        <p className="mt-2 text-sm text-zinc-500">该订单已取消。</p>
      ) : null}
    </div>
  );
}
