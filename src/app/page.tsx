import type { Metadata } from "next";
import Link from "next/link";
import { Pagination } from "@/components/pagination";
import { ProductCard } from "@/components/product-card";
import { ShopShell } from "@/components/shop-shell";
import { getCategoriesWithCounts, getProductList } from "@/lib/products";
import { buildProductListHref } from "@/lib/url";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Mini Mall — 精选好物",
  description: "浏览全部商品，按名称或描述搜索，并按分类筛选。",
};

type HomePageProps = {
  searchParams: Promise<{
    search?: string | string[];
    category?: string | string[];
    page?: string | string[];
  }>;
};

function first(value: string | string[] | undefined): string {
  if (Array.isArray(value)) {
    return value[0] ?? "";
  }
  return value ?? "";
}

export default async function HomePage({ searchParams }: HomePageProps) {
  const params = await searchParams;
  const search = first(params.search).trim();
  const category = first(params.category).trim();
  const pageValue = Number.parseInt(first(params.page), 10);
  const page = Number.isFinite(pageValue) && pageValue > 0 ? pageValue : 1;

  const [list, categories] = await Promise.all([
    getProductList({ search, category, page }),
    getCategoriesWithCounts(),
  ]);

  const totalProducts = categories.reduce(
    (sum, item) => sum + item.productCount,
    0,
  );
  const activeCategoryName = categories.find((item) => item.slug === category)?.name;

  const tabClass = (active: boolean) =>
    active
      ? "inline-flex items-center gap-2 rounded-full bg-emerald-600 px-4 py-2 text-sm font-medium text-white"
      : "inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-white px-4 py-2 text-sm text-zinc-700 transition hover:border-emerald-300 hover:text-emerald-700";

  return (
    <ShopShell>
      <main className="mx-auto max-w-6xl px-4 py-8">
        {/* 搜索与主要入口 */}
        <section className="rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-700 px-6 py-10 text-white sm:px-10">
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            发现今天的好物
          </h1>
          <p className="mt-2 max-w-xl text-sm text-emerald-50 sm:text-base">
            浏览全部商品，或按名称、描述搜索。满 ¥99 包邮。
          </p>
          <form
            action="/"
            method="get"
            className="mt-6 flex max-w-xl flex-col gap-2 sm:flex-row"
          >
            {category ? (
              <input type="hidden" name="category" value={category} />
            ) : null}
            <input
              type="search"
              name="search"
              defaultValue={search}
              placeholder="搜索商品名称或描述"
              className="h-11 flex-1 rounded-xl border border-white/20 bg-white/95 px-4 text-sm text-zinc-900 outline-none placeholder:text-zinc-400 focus:ring-2 focus:ring-white/60"
            />
            <button
              type="submit"
              className="h-11 rounded-xl bg-zinc-900 px-6 text-sm font-medium text-white transition hover:bg-zinc-800"
            >
              搜索
            </button>
          </form>
        </section>

        {/* 分类标签 */}
        <section className="mt-8">
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href={buildProductListHref({ search })}
              className={tabClass(!category)}
            >
              全部
              <span
                className={
                  !category ? "text-xs text-emerald-100" : "text-xs text-zinc-400"
                }
              >
                {totalProducts}
              </span>
            </Link>
            {categories.map((item) => (
              <Link
                key={item.id}
                href={buildProductListHref({ search, category: item.slug })}
                className={tabClass(category === item.slug)}
              >
                {item.name}
                <span
                  className={
                    category === item.slug
                      ? "text-xs text-emerald-100"
                      : "text-xs text-zinc-400"
                  }
                >
                  {item.productCount}
                </span>
              </Link>
            ))}
          </div>
        </section>

        {/* 商品网格 */}
        <section className="mt-6">
          <div className="mb-4 flex items-center justify-between gap-4">
            <p className="text-sm text-zinc-600">
              {search
                ? `“${search}” 的搜索结果`
                : (activeCategoryName ?? "全部商品")}
              <span className="ml-2 text-zinc-400">共 {list.total} 件</span>
            </p>
            {search || category || list.page > 1 ? (
              <Link
                href="/"
                className="shrink-0 text-sm text-emerald-700 hover:underline"
              >
                清除筛选
              </Link>
            ) : null}
          </div>

          {list.products.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-zinc-300 bg-white px-6 py-20 text-center">
              <p className="text-lg font-medium text-zinc-900">没有找到匹配的商品</p>
              <p className="mt-1 text-sm text-zinc-500">试试其他关键词或分类。</p>
              <Link
                href="/"
                className="mt-4 inline-block rounded-lg bg-emerald-600 px-4 py-2 text-sm text-white transition hover:bg-emerald-700"
              >
                查看全部商品
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {list.products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}

          <Pagination
            page={list.page}
            totalPages={list.totalPages}
            search={search}
            category={category}
          />
        </section>
      </main>
    </ShopShell>
  );
}
