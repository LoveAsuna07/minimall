import type { Metadata } from "next";
import { CartManager } from "@/components/cart-manager";
import { ShopShell } from "@/components/shop-shell";
import { requireUser } from "@/lib/auth";
import { getCart } from "@/lib/cart";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "购物车 | Mini Mall",
};

export default async function CartPage() {
  // 未登录会跳转到 /login?next=/cart
  const user = await requireUser("/cart");
  const cart = await getCart(user.id);

  return (
    <ShopShell>
      <main className="mx-auto max-w-6xl px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">
            购物车
          </h1>
          <p className="mt-1 text-sm text-zinc-500">
            调整数量后即可提交订单，满 ¥99 包邮。
          </p>
        </div>

        <CartManager initialCart={cart} />
      </main>
    </ShopShell>
  );
}
