"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { ProductImage } from "@/components/product-image";
import type { CartItemView, CartView } from "@/lib/cart-types";
import { formatCents } from "@/lib/format";

type CartManagerProps = {
  initialCart: CartView;
};

export function CartManager({ initialCart }: CartManagerProps) {
  const router = useRouter();
  const [items, setItems] = useState<CartItemView[]>(initialCart.items);
  const [error, setError] = useState<string | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const busyRef = useRef(false);

  const total = items.reduce(
    (sum, item) =>
      item.available ? sum + item.product.price * item.quantity : sum,
    0,
  );
  // 件数与合计保持同一口径：只统计可购买项
  const count = items.reduce(
    (sum, item) => (item.available ? sum + item.quantity : sum),
    0,
  );
  // 下单要求购物车中所有商品都可购买
  const canCheckout =
    items.length > 0 && items.every((item) => item.available);

  // 修改数量；库存与上架状态由服务端再次校验
  async function updateQuantity(item: CartItemView, nextQuantity: number) {
    if (busyRef.current) {
      return;
    }
    if (nextQuantity < 1 || nextQuantity > item.product.stock) {
      return;
    }

    busyRef.current = true;
    setPendingId(item.id);
    setError(null);

    try {
      const response = await fetch(`/api/cart/${item.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quantity: nextQuantity }),
      });
      const data = await response.json().catch(() => null);

      if (!response.ok) {
        setError(data?.error ?? "修改数量失败");
        return;
      }

      setItems((previous) =>
        previous.map((current) =>
          current.id === item.id
            ? {
                ...current,
                quantity: nextQuantity,
                subtotal: current.product.active
                  ? current.product.price * nextQuantity
                  : 0,
                available:
                  current.product.active &&
                  current.product.stock >= nextQuantity,
              }
            : current,
        ),
      );
      // 同步顶栏购物车角标
      router.refresh();
    } catch {
      setError("网络错误，请稍后重试");
    } finally {
      busyRef.current = false;
      setPendingId(null);
    }
  }

  // 删除购物车项
  async function removeItem(item: CartItemView) {
    if (busyRef.current) {
      return;
    }
    if (!window.confirm(`确定从购物车移除「${item.product.name}」吗？`)) {
      return;
    }

    busyRef.current = true;
    setPendingId(item.id);
    setError(null);

    try {
      const response = await fetch(`/api/cart/${item.id}`, {
        method: "DELETE",
      });
      const data = await response.json().catch(() => null);

      if (!response.ok) {
        setError(data?.error ?? "删除失败");
        return;
      }

      setItems((previous) =>
        previous.filter((current) => current.id !== item.id),
      );
      // 同步顶栏购物车角标
      router.refresh();
    } catch {
      setError("网络错误，请稍后重试");
    } finally {
      busyRef.current = false;
      setPendingId(null);
    }
  }

  if (items.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-zinc-300 bg-white px-6 py-20 text-center">
        <p className="text-lg font-medium text-zinc-900">购物车是空的</p>
        <p className="mt-1 text-sm text-zinc-500">去挑几件喜欢的商品吧。</p>
        <Link
          href="/"
          className="mt-4 inline-block rounded-lg bg-emerald-600 px-4 py-2 text-sm text-white transition hover:bg-emerald-700"
        >
          去逛逛
        </Link>
      </div>
    );
  }

  const busy = pendingId !== null;
  const quantityButtonClass =
    "inline-flex h-8 w-8 items-center justify-center rounded-lg border border-zinc-200 text-sm text-zinc-700 transition hover:border-emerald-300 hover:text-emerald-700 disabled:cursor-not-allowed disabled:opacity-40";

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <section className="space-y-3">
        {error ? (
          <p
            role="alert"
            className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700"
          >
            {error}
          </p>
        ) : null}

        {items.map((item) => {
          const inactive = !item.product.active;
          const overStock =
            item.product.active && item.quantity > item.product.stock;
          const pending = pendingId === item.id;

          return (
            <article
              key={item.id}
              className={`flex flex-col gap-4 rounded-xl border border-zinc-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center ${
                inactive ? "opacity-60" : ""
              }`}
            >
              <Link
                href={`/products/${item.product.id}`}
                className="shrink-0 overflow-hidden rounded-lg bg-zinc-100"
              >
                <ProductImage
                  src={item.product.imageUrl}
                  alt={item.product.name}
                  className="h-24 w-24 object-cover"
                />
              </Link>

              <div className="min-w-0 flex-1">
                <Link
                  href={`/products/${item.product.id}`}
                  className="font-medium text-zinc-900 transition hover:text-emerald-700"
                >
                  {item.product.name}
                </Link>
                <p className="mt-1 text-sm text-zinc-500">
                  单价 {formatCents(item.product.price)}
                </p>
                {inactive ? (
                  <p className="mt-1 text-xs text-red-600">商品已下架</p>
                ) : null}
                {overStock ? (
                  <p className="mt-1 text-xs text-amber-600">
                    库存不足，仅剩 {item.product.stock} 件
                  </p>
                ) : null}
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => void updateQuantity(item, item.quantity - 1)}
                  disabled={busy || inactive || item.quantity <= 1}
                  className={quantityButtonClass}
                  aria-label="减少数量"
                >
                  −
                </button>
                <span className="w-8 text-center text-sm text-zinc-900">
                  {item.quantity}
                </span>
                <button
                  type="button"
                  onClick={() => void updateQuantity(item, item.quantity + 1)}
                  disabled={
                    busy || inactive || item.quantity >= item.product.stock
                  }
                  className={quantityButtonClass}
                  aria-label="增加数量"
                >
                  ＋
                </button>
              </div>

              <div className="w-24 text-right">
                <p className="font-semibold text-zinc-900">
                  {formatCents(item.product.price * item.quantity)}
                </p>
                <button
                  type="button"
                  onClick={() => void removeItem(item)}
                  disabled={busy}
                  className="mt-1 text-xs text-red-600 transition hover:underline disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {pending ? "处理中…" : "删除"}
                </button>
              </div>
            </article>
          );
        })}
      </section>

      <aside className="h-fit rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-medium text-zinc-900">订单摘要</h2>
        <dl className="mt-4 space-y-2 text-sm">
          <div className="flex justify-between">
            <dt className="text-zinc-500">商品数量</dt>
            <dd className="text-zinc-900">{count} 件</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-zinc-500">商品小计</dt>
            <dd className="text-zinc-900">{formatCents(total)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-zinc-500">运费</dt>
            <dd className="text-zinc-400">结算时计算</dd>
          </div>
          <div className="flex justify-between border-t border-zinc-100 pt-3 text-base font-semibold">
            <dt className="text-zinc-900">合计</dt>
            <dd className="text-emerald-700">{formatCents(total)}</dd>
          </div>
        </dl>
        <p className="mt-2 text-xs text-zinc-400">满 ¥99 包邮，否则运费 ¥10。</p>

        {canCheckout ? (
          <Link
            href="/checkout"
            className="mt-5 flex h-11 items-center justify-center rounded-xl bg-emerald-600 text-sm font-medium text-white transition hover:bg-emerald-700"
          >
            提交订单
          </Link>
        ) : (
          <>
            <p className="mt-4 text-xs text-red-600">
              部分商品已下架或库存不足，请先移除后再提交订单。
            </p>
            <span className="mt-2 flex h-11 cursor-not-allowed items-center justify-center rounded-xl bg-zinc-200 text-sm font-medium text-zinc-500">
              提交订单
            </span>
          </>
        )}

        <Link
          href="/"
          className="mt-3 flex h-10 items-center justify-center rounded-xl border border-zinc-200 text-sm text-zinc-700 transition hover:bg-zinc-50"
        >
          继续购物
        </Link>
      </aside>
    </div>
  );
}
