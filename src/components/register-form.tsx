"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { registerAction } from "@/actions/auth";
import { initialAuthState } from "@/lib/action-state";

type RegisterFormProps = {
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
      {pending ? "注册中…" : "注册"}
    </button>
  );
}

export function RegisterForm({ next }: RegisterFormProps) {
  const [state, formAction] = useActionState(registerAction, initialAuthState);

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="next" value={next} />

      <div>
        <label
          htmlFor="register-name"
          className="block text-sm font-medium text-zinc-700"
        >
          昵称
        </label>
        <input
          id="register-name"
          name="name"
          required
          maxLength={30}
          autoComplete="nickname"
          className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
        />
        {state.fieldErrors?.name?.[0] ? (
          <p className="mt-1 text-sm text-red-600">{state.fieldErrors.name[0]}</p>
        ) : null}
      </div>

      <div>
        <label
          htmlFor="register-email"
          className="block text-sm font-medium text-zinc-700"
        >
          邮箱
        </label>
        <input
          id="register-email"
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
          htmlFor="register-password"
          className="block text-sm font-medium text-zinc-700"
        >
          密码
        </label>
        <input
          id="register-password"
          name="password"
          type="password"
          required
          minLength={6}
          maxLength={64}
          autoComplete="new-password"
          className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
        />
        <p className="mt-1 text-xs text-zinc-500">至少 6 位字符。</p>
        {state.fieldErrors?.password?.[0] ? (
          <p className="mt-1 text-sm text-red-600">
            {state.fieldErrors.password[0]}
          </p>
        ) : null}
      </div>

      <div>
        <label
          htmlFor="register-confirm-password"
          className="block text-sm font-medium text-zinc-700"
        >
          确认密码
        </label>
        <input
          id="register-confirm-password"
          name="confirmPassword"
          type="password"
          required
          autoComplete="new-password"
          className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
        />
        {state.fieldErrors?.confirmPassword?.[0] ? (
          <p className="mt-1 text-sm text-red-600">
            {state.fieldErrors.confirmPassword[0]}
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
