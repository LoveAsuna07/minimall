"use client";

import Link from "next/link";
import { useRef, useState, type SubmitEvent } from "react";
import { ProductImage } from "@/components/product-image";
import { centsToYuanInput, formatCents, yuanToCents } from "@/lib/format";

type AdminCategory = {
  id: string;
  name: string;
  slug: string;
};

type AdminProduct = {
  id: string;
  name: string;
  description: string;
  price: number;
  imageUrl: string;
  stock: number;
  active: boolean;
  category: AdminCategory;
};

type ProductForm = {
  name: string;
  description: string;
  price: string;
  imageUrl: string;
  stock: string;
  categoryId: string;
  active: boolean;
};

type FieldErrors = Record<string, string[] | undefined>;

type ProductManagerProps = {
  initialProducts: AdminProduct[];
  categories: AdminCategory[];
};

function isValidHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function emptyForm(categories: AdminCategory[]): ProductForm {
  return {
    name: "",
    description: "",
    price: "",
    imageUrl: "",
    stock: "0",
    categoryId: categories[0]?.id ?? "",
    active: true,
  };
}

export function ProductManager({
  initialProducts,
  categories,
}: ProductManagerProps) {
  const [products, setProducts] = useState<AdminProduct[]>(initialProducts);
  const [form, setForm] = useState<ProductForm>(() => emptyForm(categories));
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const busyRef = useRef(false);

  function resetForm() {
    setForm(emptyForm(categories));
    setEditingId(null);
    setFieldErrors({});
  }

  function handleEdit(product: AdminProduct) {
    setEditingId(product.id);
    setForm({
      name: product.name,
      description: product.description,
      price: centsToYuanInput(product.price),
      imageUrl: product.imageUrl,
      stock: String(product.stock),
      categoryId: product.category.id,
      active: product.active,
    });
    setFieldErrors({});
    setError(null);
  }

  // 创建或更新商品
  async function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busyRef.current) {
      return;
    }

    const name = form.name.trim();
    const priceCents = yuanToCents(form.price);
    const stock = Number(form.stock);
    const localErrors: FieldErrors = {};

    if (!name) {
      localErrors.name = ["请输入商品名称"];
    }
    if (priceCents === null) {
      localErrors.price = ["请输入有效价格，最多两位小数"];
    }
    if (!Number.isInteger(stock) || stock < 0) {
      localErrors.stock = ["库存必须是非负整数"];
    }
    if (!isValidHttpUrl(form.imageUrl.trim())) {
      localErrors.imageUrl = ["请输入以 http:// 或 https:// 开头的图片 URL"];
    }
    if (!form.categoryId) {
      localErrors.categoryId = ["请选择分类"];
    }

    if (Object.keys(localErrors).length > 0) {
      setError("请检查输入");
      setFieldErrors(localErrors);
      return;
    }

    busyRef.current = true;
    setSaving(true);
    setError(null);
    setFieldErrors({});

    const isEditing = editingId !== null;
    const url = isEditing
      ? `/api/admin/products/${editingId}`
      : "/api/admin/products";

    try {
      const response = await fetch(url, {
        method: isEditing ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          description: form.description.trim(),
          price: priceCents,
          imageUrl: form.imageUrl.trim(),
          stock,
          categoryId: form.categoryId,
          active: form.active,
        }),
      });
      const data = await response.json().catch(() => null);

      if (!response.ok) {
        setError(data?.error ?? "保存失败");
        setFieldErrors(data?.fieldErrors ?? {});
        return;
      }

      const saved = data.product as AdminProduct;
      setProducts((previous) =>
        isEditing
          ? previous.map((product) =>
              product.id === saved.id ? saved : product,
            )
          : [saved, ...previous],
      );
      resetForm();
    } catch {
      setError("网络错误，请稍后重试");
    } finally {
      busyRef.current = false;
      setSaving(false);
    }
  }

  // 删除商品；历史订单中的快照不受影响
  async function handleDelete(product: AdminProduct) {
    if (busyRef.current) {
      return;
    }
    if (
      !window.confirm(
        `确定删除商品「${product.name}」吗？历史订单仍会保留商品快照。`,
      )
    ) {
      return;
    }

    busyRef.current = true;
    setDeletingId(product.id);
    setError(null);

    try {
      const response = await fetch(`/api/admin/products/${product.id}`, {
        method: "DELETE",
      });
      const data = await response.json().catch(() => null);

      if (!response.ok) {
        setError(data?.error ?? "删除失败");
        return;
      }

      setProducts((previous) =>
        previous.filter((item) => item.id !== product.id),
      );
      if (editingId === product.id) {
        resetForm();
      }
    } catch {
      setError("网络错误，请稍后重试");
    } finally {
      busyRef.current = false;
      setDeletingId(null);
    }
  }

  const busy = saving || deletingId !== null;
  const inputClass =
    "mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100";

  return (
    <div className="grid gap-6 xl:grid-cols-[380px_1fr]">
      <section className="h-fit rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-medium text-zinc-900">
          {editingId ? "编辑商品" : "新增商品"}
        </h2>

        {categories.length === 0 ? (
          <p className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-700">
            还没有分类，请先到{" "}
            <Link href="/admin/categories" className="underline">
              分类管理
            </Link>{" "}
            创建一个分类。
          </p>
        ) : null}

        <form className="mt-4 space-y-4" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="product-name" className="block text-sm font-medium text-zinc-700">
              商品名称
            </label>
            <input
              id="product-name"
              required
              maxLength={100}
              value={form.name}
              onChange={(event) => setForm({ ...form, name: event.target.value })}
              className={inputClass}
              placeholder="例如：无线降噪耳机"
            />
            {fieldErrors.name?.[0] ? (
              <p className="mt-1 text-sm text-red-600">{fieldErrors.name[0]}</p>
            ) : null}
          </div>

          <div>
            <label htmlFor="product-category" className="block text-sm font-medium text-zinc-700">
              分类
            </label>
            <select
              id="product-category"
              required
              value={form.categoryId}
              onChange={(event) =>
                setForm({ ...form, categoryId: event.target.value })
              }
              className={inputClass}
            >
              <option value="">请选择分类</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
            {fieldErrors.categoryId?.[0] ? (
              <p className="mt-1 text-sm text-red-600">
                {fieldErrors.categoryId[0]}
              </p>
            ) : null}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="product-price" className="block text-sm font-medium text-zinc-700">
                价格（元）
              </label>
              <input
                id="product-price"
                required
                inputMode="decimal"
                value={form.price}
                onChange={(event) =>
                  setForm({ ...form, price: event.target.value })
                }
                className={inputClass}
                placeholder="19.90"
              />
              {fieldErrors.price?.[0] ? (
                <p className="mt-1 text-sm text-red-600">
                  {fieldErrors.price[0]}
                </p>
              ) : null}
            </div>

            <div>
              <label htmlFor="product-stock" className="block text-sm font-medium text-zinc-700">
                库存
              </label>
              <input
                id="product-stock"
                required
                type="number"
                min={0}
                step={1}
                value={form.stock}
                onChange={(event) =>
                  setForm({ ...form, stock: event.target.value })
                }
                className={inputClass}
              />
              {fieldErrors.stock?.[0] ? (
                <p className="mt-1 text-sm text-red-600">
                  {fieldErrors.stock[0]}
                </p>
              ) : null}
            </div>
          </div>

          <div>
            <label htmlFor="product-image" className="block text-sm font-medium text-zinc-700">
              图片 URL
            </label>
            <input
              id="product-image"
              required
              type="url"
              value={form.imageUrl}
              onChange={(event) =>
                setForm({ ...form, imageUrl: event.target.value })
              }
              className={inputClass}
              placeholder="https://example.com/image.jpg"
            />
            {fieldErrors.imageUrl?.[0] ? (
              <p className="mt-1 text-sm text-red-600">
                {fieldErrors.imageUrl[0]}
              </p>
            ) : null}
            {isValidHttpUrl(form.imageUrl) ? (
              <ProductImage
                src={form.imageUrl}
                alt="图片预览"
                className="mt-2 h-16 w-16 rounded-lg border border-zinc-200 object-cover"
              />
            ) : null}
          </div>

          <div>
            <label htmlFor="product-description" className="block text-sm font-medium text-zinc-700">
              描述
            </label>
            <textarea
              id="product-description"
              rows={3}
              maxLength={5000}
              value={form.description}
              onChange={(event) =>
                setForm({ ...form, description: event.target.value })
              }
              className={inputClass}
              placeholder="商品卖点、规格等"
            />
            {fieldErrors.description?.[0] ? (
              <p className="mt-1 text-sm text-red-600">
                {fieldErrors.description[0]}
              </p>
            ) : null}
          </div>

          <label className="flex items-center gap-2 text-sm text-zinc-700">
            <input
              type="checkbox"
              checked={form.active}
              onChange={(event) =>
                setForm({ ...form, active: event.target.checked })
              }
              className="h-4 w-4 rounded border-zinc-300 text-emerald-600 focus:ring-emerald-500"
            />
            上架销售
          </label>

          <div className="flex items-center gap-2">
            <button
              type="submit"
              disabled={busy || categories.length === 0}
              className="inline-flex items-center rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? "保存中…" : editingId ? "保存修改" : "创建商品"}
            </button>
            {editingId ? (
              <button
                type="button"
                onClick={resetForm}
                disabled={busy}
                className="rounded-lg border border-zinc-300 px-4 py-2 text-sm text-zinc-700 transition hover:bg-zinc-50 disabled:opacity-60"
              >
                取消编辑
              </button>
            ) : null}
          </div>
        </form>
      </section>

      <section className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-zinc-200 px-5 py-4">
          <h2 className="text-lg font-medium text-zinc-900">商品列表</h2>
          <span className="text-sm text-zinc-500">共 {products.length} 件</span>
        </div>

        {error ? (
          <p
            role="alert"
            className="mx-5 mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700"
          >
            {error}
          </p>
        ) : null}

        {products.length === 0 ? (
          <p className="px-5 py-10 text-center text-sm text-zinc-500">
            还没有商品，先创建一个吧。
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-zinc-50 text-xs uppercase tracking-wide text-zinc-500">
                <tr>
                  <th className="px-5 py-3 font-medium">商品</th>
                  <th className="px-5 py-3 font-medium">分类</th>
                  <th className="px-5 py-3 font-medium">价格</th>
                  <th className="px-5 py-3 font-medium">库存</th>
                  <th className="px-5 py-3 font-medium">状态</th>
                  <th className="px-5 py-3 text-right font-medium">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {products.map((product) => (
                  <tr key={product.id} className="transition-colors hover:bg-zinc-50/70">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <ProductImage
                          src={product.imageUrl}
                          alt={product.name}
                          className="h-12 w-12 shrink-0 rounded-lg border border-zinc-200 object-cover"
                        />
                        <div className="min-w-0">
                          <div className="font-medium text-zinc-900">
                            {product.name}
                          </div>
                          <div
                            className="mt-0.5 font-mono text-xs text-zinc-400"
                            title={product.id}
                          >
                            {product.id.slice(0, 10)}…
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-zinc-600">
                      {product.category.name}
                    </td>
                    <td className="px-5 py-3 text-zinc-900">
                      {formatCents(product.price)}
                    </td>
                    <td className="px-5 py-3 text-zinc-600">{product.stock}</td>
                    <td className="px-5 py-3">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
                          product.active
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-zinc-100 text-zinc-500"
                        }`}
                      >
                        {product.active ? "上架" : "下架"}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => handleEdit(product)}
                        disabled={busy}
                        className="rounded-md px-2 py-1 text-sm font-medium text-emerald-700 transition hover:bg-emerald-50 disabled:opacity-50"
                      >
                        编辑
                      </button>
                      <button
                        type="button"
                        onClick={() => void handleDelete(product)}
                        disabled={busy}
                        className="ml-1 rounded-md px-2 py-1 text-sm font-medium text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {deletingId === product.id ? "删除中…" : "删除"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
