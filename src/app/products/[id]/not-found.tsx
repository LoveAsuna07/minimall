import Link from "next/link";

export default function ProductNotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-50 px-4 text-center">
      <h1 className="text-2xl font-semibold text-zinc-900">商品不存在或已下架</h1>
      <p className="mt-2 text-sm text-zinc-500">
        它可能已被删除，或者你访问的链接有误。
      </p>
      <Link
        href="/"
        className="mt-6 rounded-lg bg-emerald-600 px-4 py-2 text-sm text-white transition hover:bg-emerald-700"
      >
        返回商品列表
      </Link>
    </div>
  );
}
