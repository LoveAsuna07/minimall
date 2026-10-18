import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AddToCartButton } from "@/components/add-to-cart-button";
import { ProductImage } from "@/components/product-image";
import { ShopShell } from "@/components/shop-shell";
import { formatCents } from "@/lib/format";
import { getProductById } from "@/lib/products";

export const dynamic = "force-dynamic";

type ProductPageProps = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({
  params,
}: ProductPageProps): Promise<Metadata> {
  const { id } = await params;
  const product = await getProductById(id);

  return {
    title: product ? `${product.name} | Mini Mall` : "商品不存在 | Mini Mall",
  };
}

export default async function ProductDetailPage({ params }: ProductPageProps) {
  const { id } = await params;
  const product = await getProductById(id);

  if (!product) {
    notFound();
  }

  return (
    <ShopShell>
      <main className="mx-auto max-w-6xl px-4 py-8">
        <Link
          href="/"
          className="text-sm text-zinc-500 transition hover:text-zinc-900"
        >
          ← 返回商品列表
        </Link>

        <div className="mt-6 grid gap-8 lg:grid-cols-2">
          <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white">
            <ProductImage
              src={product.imageUrl}
              alt={product.name}
              className="aspect-square w-full object-cover"
            />
          </div>

          <div className="flex flex-col">
            <Link
              href={`/?category=${product.category.slug}`}
              className="text-sm font-medium text-emerald-700 hover:underline"
            >
              {product.category.name}
            </Link>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-zinc-900">
              {product.name}
            </h1>
            <p className="mt-4 text-3xl font-semibold text-emerald-700">
              {formatCents(product.price)}
            </p>
            <p className="mt-2 text-sm text-zinc-500">库存 {product.stock} 件</p>

            <div className="mt-6 border-t border-zinc-200 pt-6">
              <h2 className="text-sm font-medium text-zinc-900">商品描述</h2>
              <p className="mt-2 whitespace-pre-line text-sm leading-7 text-zinc-600">
                {product.description || "暂无描述"}
              </p>
            </div>

            <div className="mt-8">
              <AddToCartButton
                productId={product.id}
                stock={product.stock}
                nextPath={`/products/${product.id}`}
              />
            </div>

            <p className="mt-4 text-xs text-zinc-400">
              满 ¥99 包邮，否则运费 ¥10。支付为模拟流程。
            </p>
          </div>
        </div>
      </main>
    </ShopShell>
  );
}
