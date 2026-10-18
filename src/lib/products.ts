import "server-only";
import { cache } from "react";
import { Prisma } from "@prisma/client";
import { PRODUCT_PAGE_SIZE } from "@/lib/constants";
import { prisma } from "@/lib/prisma";

export type ProductListParams = {
  search?: string;
  category?: string;
  page?: number;
};

const productInclude = {
  category: { select: { id: true, name: true, slug: true } },
} satisfies Prisma.ProductInclude;

// SQLite LIKE 中 % 和 _ 是通配符，用 ! 转义后再以 ESCAPE '!' 查询
function escapeLike(value: string): string {
  return value.replace(/[!%_]/g, (char) => `!${char}`);
}

// 搜索条件直接在 SQL 中过滤，避免把所有匹配 id 物化到 IN 子句
function buildSearchFrom(category: string | undefined, pattern: string): Prisma.Sql {
  const conditions: Prisma.Sql[] = [
    Prisma.sql`p."active" = 1`,
    Prisma.sql`(
      p."name" LIKE ${pattern} ESCAPE '!'
      OR p."description" LIKE ${pattern} ESCAPE '!'
    )`,
  ];

  if (category) {
    conditions.push(Prisma.sql`c."slug" = ${category}`);
  }

  return Prisma.sql`
    FROM "Product" p
    LEFT JOIN "Category" c ON c."id" = p."categoryId"
    WHERE ${Prisma.join(conditions, " AND ")}
  `;
}

async function countSearchResults(
  category: string | undefined,
  pattern: string,
): Promise<number> {
  const from = buildSearchFrom(category, pattern);
  const rows = await prisma.$queryRaw<Array<{ count: number | bigint }>>(
    Prisma.sql`SELECT COUNT(*) AS "count" ${from}`,
  );
  return Number(rows[0]?.count ?? 0);
}

async function searchPageIds(
  category: string | undefined,
  pattern: string,
  skip: number,
  take: number,
): Promise<string[]> {
  const from = buildSearchFrom(category, pattern);
  const rows = await prisma.$queryRaw<Array<{ id: string }>>(
    Prisma.sql`
      SELECT p."id" AS "id" ${from}
      ORDER BY p."createdAt" DESC, p."id" DESC
      LIMIT ${take} OFFSET ${skip}
    `,
  );
  return rows.map((row) => row.id);
}

// 公开商品列表：只返回上架商品，支持名称/描述模糊搜索与分类 slug 筛选
export async function getProductList(params: ProductListParams) {
  const search = params.search?.trim();
  const category = params.category?.trim();
  const requestedPage =
    Number.isFinite(params.page) && (params.page ?? 0) > 0
      ? Math.floor(params.page as number)
      : 1;

  if (search) {
    const pattern = `%${escapeLike(search)}%`;
    const total = await countSearchResults(category, pattern);
    const totalPages = Math.max(1, Math.ceil(total / PRODUCT_PAGE_SIZE));
    const page = Math.min(requestedPage, totalPages);

    // 只把当前页的商品 id 取回，再按 id 顺序补齐关联数据
    const ids = await searchPageIds(
      category,
      pattern,
      (page - 1) * PRODUCT_PAGE_SIZE,
      PRODUCT_PAGE_SIZE,
    );

    const rows = await prisma.product.findMany({
      where: { id: { in: ids }, active: true },
      include: productInclude,
    });
    const byId = new Map(rows.map((product) => [product.id, product]));
    const products = ids.flatMap((id) => {
      const product = byId.get(id);
      return product ? [product] : [];
    });

    return {
      products,
      page,
      pageSize: PRODUCT_PAGE_SIZE,
      total,
      totalPages,
    };
  }

  const where: Prisma.ProductWhereInput = {
    active: true,
    ...(category ? { category: { slug: category } } : {}),
  };

  const total = await prisma.product.count({ where });
  const totalPages = Math.max(1, Math.ceil(total / PRODUCT_PAGE_SIZE));
  const page = Math.min(requestedPage, totalPages);

  const products = await prisma.product.findMany({
    where,
    include: productInclude,
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    skip: (page - 1) * PRODUCT_PAGE_SIZE,
    take: PRODUCT_PAGE_SIZE,
  });

  return {
    products,
    page,
    pageSize: PRODUCT_PAGE_SIZE,
    total,
    totalPages,
  };
}

// 商品详情；使用 React cache 避免 generateMetadata 与页面重复查询
export const getProductById = cache(async (id: string) => {
  return prisma.product.findFirst({
    where: { id, active: true },
    include: productInclude,
  });
});

// 公开分类列表，统计每个分类下的上架商品数
export async function getCategoriesWithCounts() {
  const categories = await prisma.category.findMany({
    orderBy: { name: "asc" },
    include: {
      _count: {
        select: {
          products: { where: { active: true } },
        },
      },
    },
  });

  return categories.map((category) => ({
    id: category.id,
    name: category.name,
    slug: category.slug,
    productCount: category._count.products,
  }));
}

type ProductListResult = Awaited<ReturnType<typeof getProductList>>;
export type ProductListItem = ProductListResult["products"][number];
