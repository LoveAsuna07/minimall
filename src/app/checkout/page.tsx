import type { Metadata } from "next";
import Link from "next/link";
import { CheckoutForm } from "@/components/checkout-form";
import { ShopShell } from "@/components/shop-shell";
import { requireUser } from "@/lib/auth";
import { getCart } from "@/lib/cart";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "结算 | Mini Mall",
};

export default async function CheckoutPage() {
  const user = await requireUser("/checkout");
  const cart = await getCart(user.id);
  // 下单要求购物车中所有商品都可购买
  const hasUnavailable = cart.items.some((item) => !item.available);

  return (
    <ShopShell>
      <main className="mx-auto max-w-6xl px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">
            结算
          </h1>
          <p className="mt-1 text-sm text-zinc-500">
            确认收货信息后提交订单，支付为模拟流程。
          </p>
        </div>

        {cart.items.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-zinc-300 bg-white px-6 py-20 text-center">
            <p className="text-lg font-medium text-zinc-900">购物车是空的</p>
            <p className="mt-1 text-sm text-zinc-500">
              先添加商品后再提交订单。
            </p>
            <Link
              href="/"
              className="mt-4 inline-block rounded-lg bg-emerald-600 px-4 py-2 text-sm text-white transition hover:bg-emerald-700"
            >
              去逛逛
            </Link>
          </div>
        ) : hasUnavailable ? (
          <div className="rounded-2xl border border-dashed border-amber-300 bg-white px-6 py-16 text-center">
            <p className="text-lg font-medium text-zinc-900">
              部分商品已下架或库存不足
            </p>
            <p className="mt-1 text-sm text-zinc-500">
              请先返回购物车移除这些商品后再提交订单。
            </p>
            <Link
              href="/cart"
              className="mt-4 inline-block rounded-lg bg-emerald-600 px-4 py-2 text-sm text-white transition hover:bg-emerald-700"
            >
              返回购物车
            </Link>
          </div>
        ) : (
          <CheckoutForm cart={cart} defaultName={user.name} />
        )}
      </main>
    </ShopShell>
  );
}
