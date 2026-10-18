import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "管理后台 | Mini Mall",
};

export default async function AdminDashboardPage() {
  const [
    productTotal,
    productActive,
    categoryTotal,
    orderTotal,
    orderPending,
    userTotal,
  ] = await Promise.all([
    prisma.product.count(),
    prisma.product.count({ where: { active: true } }),
    prisma.category.count(),
    prisma.order.count(),
    prisma.order.count({ where: { status: "PENDING" } }),
    prisma.user.count(),
  ]);

  const stats = [
    { label: "商品总数", value: productTotal, hint: `上架 ${productActive} 件` },
    { label: "分类总数", value: categoryTotal, hint: "包含空分类" },
    { label: "订单总数", value: orderTotal, hint: `待支付 ${orderPending} 单` },
    { label: "注册用户", value: userTotal, hint: "包含管理员" },
  ];

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">
          管理后台
        </h1>
        <p className="mt-1 text-sm text-zinc-500">Mini Mall 运营概览。</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm"
          >
            <p className="text-sm text-zinc-500">{stat.label}</p>
            <p className="mt-2 text-3xl font-semibold text-zinc-900">
              {stat.value}
            </p>
            <p className="mt-1 text-xs text-zinc-400">{stat.hint}</p>
          </div>
        ))}
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        <Link
          href="/admin/categories"
          className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm transition hover:border-emerald-300 hover:shadow-md"
        >
          <h2 className="font-medium text-zinc-900">分类管理</h2>
          <p className="mt-1 text-sm text-zinc-500">
            创建、编辑和删除商品分类。
          </p>
        </Link>

        <Link
          href="/admin/products"
          className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm transition hover:border-emerald-300 hover:shadow-md"
        >
          <h2 className="font-medium text-zinc-900">商品管理</h2>
          <p className="mt-1 text-sm text-zinc-500">
            新增、编辑和删除商品。
          </p>
        </Link>

        <Link
          href="/admin/orders"
          className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm transition hover:border-emerald-300 hover:shadow-md"
        >
          <h2 className="font-medium text-zinc-900">订单管理</h2>
          <p className="mt-1 text-sm text-zinc-500">
            查看全部订单并推进状态。
          </p>
        </Link>
      </div>
    </div>
  );
}
