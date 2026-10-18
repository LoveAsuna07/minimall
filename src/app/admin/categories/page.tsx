import type { Metadata } from "next";
import { CategoryManager } from "@/components/category-manager";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "分类管理 | Mini Mall",
};

export default async function AdminCategoriesPage() {
  const categories = await prisma.category.findMany({
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { products: true } } },
  });

  // 传给客户端组件前转成可序列化的纯数据
  const initialCategories = categories.map((category) => ({
    id: category.id,
    name: category.name,
    slug: category.slug,
    createdAt: category.createdAt.toISOString(),
    updatedAt: category.updatedAt.toISOString(),
    _count: category._count,
  }));

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">分类管理</h1>
        <p className="mt-1 text-sm text-zinc-500">
          创建、编辑和删除商品分类。分类下仍有商品时不能删除。
        </p>
      </div>
      <CategoryManager initialCategories={initialCategories} />
    </div>
  );
}
