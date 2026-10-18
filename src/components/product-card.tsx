import Link from "next/link";
import type { ProductListItem } from "@/lib/products";
import { formatCents } from "@/lib/format";
import { ProductImage } from "@/components/product-image";

type ProductCardProps = {
  product: ProductListItem;
};

export function ProductCard({ product }: ProductCardProps) {
  return (
    <Link
      href={`/products/${product.id}`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-md"
    >
      <div className="aspect-square overflow-hidden bg-zinc-100">
        <ProductImage
          src={product.imageUrl}
          alt={product.name}
          className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
        />
      </div>
      <div className="flex flex-1 flex-col p-4">
        <p className="text-xs text-zinc-500">{product.category.name}</p>
        <h3 className="mt-1 line-clamp-1 text-base font-medium text-zinc-900">
          {product.name}
        </h3>
        <div className="mt-auto flex items-center justify-between pt-3">
          <span className="text-lg font-semibold text-emerald-700">
            {formatCents(product.price)}
          </span>
          <span className="text-xs text-zinc-500">库存 {product.stock}</span>
        </div>
      </div>
    </Link>
  );
}
