import type { ReactNode } from "react";
import Link from "next/link";
import { requireAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  await requireAdmin("/admin");

  return (
    <div className="min-h-screen bg-zinc-50">
      <header className="border-b border-zinc-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <div className="flex items-center gap-6">
            <Link href="/admin" className="text-lg font-semibold tracking-tight text-zinc-900">
              Mini Mall 管理后台
            </Link>
            <nav className="flex items-center gap-4 text-sm text-zinc-600">
              <Link href="/admin" className="transition-colors hover:text-zinc-900">
                仪表盘
              </Link>
              <Link href="/admin/categories" className="transition-colors hover:text-zinc-900">
                分类管理
              </Link>
            </nav>
          </div>
          <Link href="/" className="text-sm text-zinc-500 transition-colors hover:text-zinc-900">
            返回商城
          </Link>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
    </div>
  );
}
