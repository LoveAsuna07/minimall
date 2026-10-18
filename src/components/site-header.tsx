import Link from "next/link";
import { logoutAction } from "@/actions/auth";
import { getCurrentUser } from "@/lib/auth";

// 站点通用顶栏：展示登录状态与后台入口
export async function SiteHeader() {
  const user = await getCurrentUser();

  return (
    <header className="border-b border-zinc-200 bg-white">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-4">
        <Link
          href="/"
          className="text-xl font-bold tracking-tight text-zinc-900 transition hover:text-emerald-700"
        >
          Mini Mall
        </Link>

        <nav className="flex flex-wrap items-center gap-4 text-sm text-zinc-600">
          <Link href="/" className="transition hover:text-zinc-900">
            全部商品
          </Link>

          {user?.role === "ADMIN" ? (
            <Link href="/admin" className="transition hover:text-zinc-900">
              管理后台
            </Link>
          ) : null}

          {user ? (
            <>
              <span className="text-zinc-400">你好，{user.name}</span>
              <form action={logoutAction}>
                <button
                  type="submit"
                  className="text-zinc-600 transition hover:text-zinc-900"
                >
                  退出
                </button>
              </form>
            </>
          ) : (
            <>
              <Link href="/login" className="transition hover:text-zinc-900">
                登录
              </Link>
              <Link
                href="/register"
                className="rounded-lg bg-emerald-600 px-3 py-1.5 text-white transition hover:bg-emerald-700"
              >
                注册
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
