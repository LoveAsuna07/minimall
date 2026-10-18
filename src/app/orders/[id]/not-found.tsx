import Link from "next/link";

export default function OrderNotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-50 px-4 text-center">
      <h1 className="text-2xl font-semibold text-zinc-900">订单不存在</h1>
      <p className="mt-2 text-sm text-zinc-500">
        该订单可能已被删除，或者不属于当前账号。
      </p>
      <Link
        href="/orders"
        className="mt-6 rounded-lg bg-emerald-600 px-4 py-2 text-sm text-white transition hover:bg-emerald-700"
      >
        返回我的订单
      </Link>
    </div>
  );
}
