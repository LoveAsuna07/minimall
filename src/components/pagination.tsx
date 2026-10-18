import Link from "next/link";
import { buildProductListHref } from "@/lib/url";

type PaginationProps = {
  page: number;
  totalPages: number;
  search: string;
  category: string;
};

type PageItem = number | "ellipsis";

// 生成首页、末页与当前页附近的页码，其余用省略号折叠
function pageItems(current: number, total: number): PageItem[] {
  if (total <= 7) {
    return Array.from({ length: total }, (_, index) => index + 1);
  }

  const pages = new Set([1, total, current - 1, current, current + 1]);
  const sorted = [...pages]
    .filter((page) => page >= 1 && page <= total)
    .sort((a, b) => a - b);

  const items: PageItem[] = [];
  let previous = 0;
  for (const page of sorted) {
    if (previous && page - previous > 1) {
      items.push("ellipsis");
    }
    items.push(page);
    previous = page;
  }
  return items;
}

export function Pagination({ page, totalPages, search, category }: PaginationProps) {
  if (totalPages <= 1) {
    return null;
  }

  const linkClass =
    "inline-flex h-9 min-w-9 items-center justify-center rounded-lg border border-zinc-200 bg-white px-3 text-sm text-zinc-700 transition hover:border-emerald-300 hover:text-emerald-700";
  const disabledClass =
    "inline-flex h-9 min-w-9 items-center justify-center rounded-lg border border-zinc-100 bg-zinc-50 px-3 text-sm text-zinc-300";

  return (
    <nav aria-label="分页" className="mt-10 flex flex-wrap items-center justify-center gap-2">
      {page > 1 ? (
        <Link
          href={buildProductListHref({ page: page - 1, search, category })}
          className={linkClass}
        >
          上一页
        </Link>
      ) : (
        <span className={disabledClass}>上一页</span>
      )}

      {pageItems(page, totalPages).map((item, index) =>
        item === "ellipsis" ? (
          <span key={`ellipsis-${index}`} className="px-1 text-zinc-400">
            …
          </span>
        ) : item === page ? (
          <span
            key={item}
            aria-current="page"
            className="inline-flex h-9 min-w-9 items-center justify-center rounded-lg bg-emerald-600 px-3 text-sm font-medium text-white"
          >
            {item}
          </span>
        ) : (
          <Link
            key={item}
            href={buildProductListHref({ page: item, search, category })}
            className={linkClass}
          >
            {item}
          </Link>
        ),
      )}

      {page < totalPages ? (
        <Link
          href={buildProductListHref({ page: page + 1, search, category })}
          className={linkClass}
        >
          下一页
        </Link>
      ) : (
        <span className={disabledClass}>下一页</span>
      )}
    </nav>
  );
}
