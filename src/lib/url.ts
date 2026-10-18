export type ProductListQuery = {
  search?: string;
  category?: string;
  page?: number;
};

// 统一构建商品列表 URL；分类标签与分页共用，避免参数遗漏
export function buildProductListHref({
  search = "",
  category = "",
  page = 1,
}: ProductListQuery): string {
  const params = new URLSearchParams();
  if (search) {
    params.set("search", search);
  }
  if (category) {
    params.set("category", category);
  }
  if (page > 1) {
    params.set("page", String(page));
  }

  const query = params.toString();
  return query ? `/?${query}` : "/";
}
