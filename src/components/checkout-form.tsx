"use client";

import { useRouter } from "next/navigation";
import { useState, type SubmitEvent } from "react";
import type { CartView } from "@/lib/cart-types";
import { FREE_SHIPPING_THRESHOLD, SHIPPING_FEE } from "@/lib/constants";
import { formatCents } from "@/lib/format";

type StockDetail = {
  productId: string;
  name: string;
  requested: number;
  available: number;
};

type CheckoutFormProps = {
  cart: CartView;
  defaultName: string;
};

export function CheckoutForm({ cart, defaultName }: CheckoutFormProps) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [details, setDetails] = useState<StockDetail[]>([]);

  const shipping = cart.total >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_FEE;
  const total = cart.total + shipping;

  async function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) {
      return;
    }

    setPending(true);
    setError(null);
    setDetails([]);

    const formData = new FormData(event.currentTarget);
    const body = {
      shipName: String(formData.get("shipName") ?? ""),
      shipPhone: String(formData.get("shipPhone") ?? ""),
      shipAddress: String(formData.get("shipAddress") ?? ""),
    };

    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await response.json().catch(() => null);

      if (!response.ok) {
        setError(data?.error ?? "提交订单失败");
        setDetails(Array.isArray(data?.items) ? data.items : []);
        return;
      }

      router.push(`/orders/${data.order.id}`);
      router.refresh();
    } catch {
      setError("网络错误，请稍后重试");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
      <section className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-medium text-zinc-900">收货信息</h2>
        <form className="mt-4 space-y-4" onSubmit={handleSubmit}>
          <div>
            <label
              htmlFor="ship-name"
              className="block text-sm font-medium text-zinc-700"
            >
              收货人
            </label>
            <input
              id="ship-name"
              name="shipName"
              required
              maxLength={50}
              defaultValue={defaultName}
              className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
            />
          </div>

          <div>
            <label
              htmlFor="ship-phone"
              className="block text-sm font-medium text-zinc-700"
            >
              手机号
            </label>
            <input
              id="ship-phone"
              name="shipPhone"
              required
              pattern="1[3-9][0-9]{9}"
              maxLength={11}
              inputMode="numeric"
              placeholder="例如：13800138000"
              className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
            />
          </div>

          <div>
            <label
              htmlFor="ship-address"
              className="block text-sm font-medium text-zinc-700"
            >
              收货地址
            </label>
            <textarea
              id="ship-address"
              name="shipAddress"
              required
              minLength={5}
              maxLength={200}
              rows={3}
              placeholder="省 / 市 / 区 / 详细地址"
              className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
            />
          </div>

          {error ? (
            <div
              role="alert"
              className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700"
            >
              <p>{error}</p>
              {details.length > 0 ? (
                <ul className="mt-1 list-inside list-disc text-xs">
                  {details.map((item) => (
                    <li key={item.productId}>
                      {item.name}：需要 {item.requested} 件，仅剩 {item.available} 件
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
          ) : null}

          <button
            type="submit"
            disabled={pending}
            className="w-full rounded-xl bg-emerald-600 px-4 py-3 text-sm font-medium text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {pending ? "提交中…" : "提交订单"}
          </button>
        </form>
      </section>

      <aside className="h-fit rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-medium text-zinc-900">订单摘要</h2>
        <ul className="mt-4 space-y-3 text-sm">
          {cart.items.map((item) => (
            <li key={item.id} className="flex justify-between gap-3">
              <span className="min-w-0 text-zinc-600">
                <span className="line-clamp-1">{item.product.name}</span>
                <span className="text-xs text-zinc-400">
                  {" "}
                  × {item.quantity}
                </span>
              </span>
              <span className="shrink-0 text-zinc-900">
                {formatCents(item.product.price * item.quantity)}
              </span>
            </li>
          ))}
        </ul>

        <dl className="mt-4 space-y-2 border-t border-zinc-100 pt-4 text-sm">
          <div className="flex justify-between">
            <dt className="text-zinc-500">商品小计</dt>
            <dd className="text-zinc-900">{formatCents(cart.total)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-zinc-500">运费</dt>
            <dd className="text-zinc-900">
              {shipping === 0 ? "包邮" : formatCents(shipping)}
            </dd>
          </div>
          <div className="flex justify-between border-t border-zinc-100 pt-3 text-base font-semibold">
            <dt className="text-zinc-900">合计</dt>
            <dd className="text-emerald-700">{formatCents(total)}</dd>
          </div>
        </dl>

        <p className="mt-2 text-xs text-zinc-400">
          支付为模拟流程，提交后订单状态为待付款。
        </p>
      </aside>
    </div>
  );
}
