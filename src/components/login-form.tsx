"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { loginAction } from "@/actions/auth";
import { initialAuthState } from "@/lib/action-state";

type LoginFormProps = {
  next: string;
};

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full rounded-xl bg-emerald-600 px-4 py-3 text-sm font-medium text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending ? "登录中…" : "登录"}
    </button>
  );
}

export function LoginForm({ next }: LoginFormProps) {
  const [state, formAction] = useActionState(loginAction, initialAuthState);

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="next" value={next} />

      <div>
        <label
          htmlFor="login-email"
          className="block text-sm font-medium text-zinc-700"
        >
          邮箱
        </label>
        <input
          id="login-email"
          name="email"
          type="email"
          required
          autoComplete="email"
          className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
        />
        {state.fieldErrors?.email?.[0] ? (
          <p className="mt-1 text-sm text-red-600">{state.fieldErrors.email[0]}</p>
        ) : null}
      </div>

      <div>
        <label
          htmlFor="login-password"
          className="block text-sm font-medium text-zinc-700"
        >
          密码
        </label>
        <input
          id="login-password"
          name="password"
          type="password"
          required
          autoComplete="current-password"
          className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
        />
        {state.fieldErrors?.password?.[0] ? (
          <p className="mt-1 text-sm text-red-600">
            {state.fieldErrors.password[0]}
          </p>
        ) : null}
      </div>

      {state.message ? (
        <p
          role="alert"
          className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700"
        >
          {state.message}
        </p>
      ) : null}

      <SubmitButton />
    </form>
  );
}
