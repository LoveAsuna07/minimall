import type { Metadata } from "next";
import { ProductManager } from "@/components/product-manager";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "商品管理 | Mini Mall",
};

export default async function AdminProductsPage() {
  const [products, categories] = await Promise.all([
    prisma.product.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        category: { select: { id: true, name: true, slug: true } },
      },
    }),
    prisma.category.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true, slug: true },
    }),
  ]);

  const initialProducts = products.map((product) => ({
    id: product.id,
    name: product.name,
    description: product.description,
    price: product.price,
    imageUrl: product.imageUrl,
    stock: product.stock,
    active: product.active,
    category: product.category,
  }));

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">
          商品管理
        </h1>
        <p className="mt-1 text-sm text-zinc-500">
          新增、编辑和删除商品。删除商品不会影响历史订单中的快照。
        </p>
      </div>

      <ProductManager
        initialProducts={initialProducts}
        categories={categories}
      />
    </div>
  );
}
