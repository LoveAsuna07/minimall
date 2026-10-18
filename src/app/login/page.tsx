import type { Metadata } from "next";
import Link from "next/link";
import { LoginForm } from "@/components/login-form";
import { safeNext } from "@/lib/auth";

export const metadata: Metadata = {
  title: "登录 | Mini Mall",
};

type LoginPageProps = {
  searchParams: Promise<{ next?: string | string[] }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const rawNext = Array.isArray(params.next) ? params.next[0] : params.next;
  const next = safeNext(rawNext) ?? "/";

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 px-4 py-10">
      <div className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm">
        <Link
          href="/"
          className="text-sm text-zinc-500 transition hover:text-zinc-900"
        >
          ← 返回商城
        </Link>
        <h1 className="mt-4 text-2xl font-semibold tracking-tight text-zinc-900">
          登录
        </h1>
        <p className="mt-1 text-sm text-zinc-500">登录后可加入购物车和下单。</p>

        <div className="mt-6">
          <LoginForm next={next} />
        </div>

        <p className="mt-6 text-sm text-zinc-600">
          还没有账号？{" "}
          <Link
            href={`/register?next=${encodeURIComponent(next)}`}
            className="font-medium text-emerald-700 hover:underline"
          >
            注册
          </Link>
        </p>
      </div>
    </div>
  );
}
