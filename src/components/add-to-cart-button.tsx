"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { addToCartAction } from "@/actions/cart";
import { initialCartState } from "@/lib/action-state";

type AddToCartButtonProps = {
  productId: string;
  stock: number;
  nextPath: string;
};

function SubmitButton({ disabled }: { disabled: boolean }) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={disabled || pending}
      className="inline-flex w-full items-center justify-center rounded-xl bg-emerald-600 px-6 py-3 text-base font-medium text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-zinc-300 sm:w-auto"
    >
      {pending ? "加入中…" : disabled ? "暂时缺货" : "加入购物车"}
    </button>
  );
}

export function AddToCartButton({
  productId,
  stock,
  nextPath,
}: AddToCartButtonProps) {
  const [state, formAction] = useActionState(addToCartAction, initialCartState);

  return (
    <form action={formAction}>
      <input type="hidden" name="productId" value={productId} />
      <input type="hidden" name="next" value={nextPath} />
      <SubmitButton disabled={stock <= 0} />
      {state.message ? (
        <p
          role="status"
          className={`mt-2 text-sm ${state.ok ? "text-emerald-600" : "text-red-600"}`}
        >
          {state.message}
        </p>
      ) : null}
    </form>
  );
}
