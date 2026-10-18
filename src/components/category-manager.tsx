"use client";

import { useRef, useState, type SubmitEvent } from "react";
import { formatDate } from "@/lib/format";

type Category = {
  id: string;
  name: string;
  slug: string;
  createdAt: string;
  updatedAt: string;
  _count?: { products: number };
};

type FieldErrors = Record<string, string[] | undefined>;

type CategoryForm = {
  name: string;
  slug: string;
};

type CategoryManagerProps = {
  initialCategories: Category[];
};

const EMPTY_FORM: CategoryForm = { name: "", slug: "" };

export function CategoryManager({ initialCategories }: CategoryManagerProps) {
  const [categories, setCategories] = useState<Category[]>(initialCategories);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [form, setForm] = useState<CategoryForm>(EMPTY_FORM);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const deletingRef = useRef(false);

  function resetForm() {
    setForm(EMPTY_FORM);
    setEditingId(null);
    setFieldErrors({});
  }

  // 创建或更新分类
  async function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    setFieldErrors({});

    const isEditing = editingId !== null;
    const url = isEditing
      ? `/api/admin/categories/${editingId}`
      : "/api/admin/categories";

    try {
      const response = await fetch(url, {
        method: isEditing ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await response.json().catch(() => null);

      if (!response.ok) {
        setError(data?.error ?? "保存失败");
        setFieldErrors(data?.fieldErrors ?? {});
        return;
      }

      const saved = data as Category;
      if (isEditing) {
        // 保留原有商品数量
        setCategories((previous) =>
          previous.map((category) =>
            category.id === saved.id
              ? { ...saved, _count: category._count }
              : category,
          ),
        );
      } else {
        // 新分类还没有商品
        setCategories((previous) => [
          { ...saved, _count: { products: 0 } },
          ...previous,
        ]);
      }

      resetForm();
    } catch {
      setError("网络错误，请稍后重试");
    } finally {
      setSaving(false);
    }
  }

  // 删除分类，需要用户二次确认；ref 防止双击重复提交
  async function handleDelete(category: Category) {
    if (deletingRef.current) {
      return;
    }
    if (!window.confirm(`确定删除分类「${category.name}」吗？`)) {
      return;
    }

    deletingRef.current = true;
    setDeletingId(category.id);
    setError(null);

    try {
      const response = await fetch(`/api/admin/categories/${category.id}`, {
        method: "DELETE",
      });
      const data = await response.json().catch(() => null);

      if (!response.ok) {
        setError(data?.error ?? "删除失败");
        return;
      }

      setCategories((previous) =>
        previous.filter((item) => item.id !== category.id),
      );
      if (editingId === category.id) {
        resetForm();
      }
    } catch {
      setError("网络错误，请稍后重试");
    } finally {
      deletingRef.current = false;
      setDeletingId(null);
    }
  }

  function handleEdit(category: Category) {
    setEditingId(category.id);
    setForm({ name: category.name, slug: category.slug });
    setFieldErrors({});
    setError(null);
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
      {/* 新增 / 编辑表单 */}
      <section className="h-fit rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-medium text-zinc-900">
          {editingId ? "编辑分类" : "新增分类"}
        </h2>
        <form className="mt-4 space-y-4" onSubmit={handleSubmit}>
          <div>
            <label
              htmlFor="category-name"
              className="block text-sm font-medium text-zinc-700"
            >
              分类名称
            </label>
            <input
              id="category-name"
              name="name"
              required
              maxLength={50}
              value={form.name}
              onChange={(event) => setForm({ ...form, name: event.target.value })}
              placeholder="例如：数码产品"
              className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
            />
            {fieldErrors.name?.[0] ? (
              <p className="mt-1 text-sm text-red-600">{fieldErrors.name[0]}</p>
            ) : null}
          </div>

          <div>
            <label
              htmlFor="category-slug"
              className="block text-sm font-medium text-zinc-700"
            >
              Slug
            </label>
            <input
              id="category-slug"
              name="slug"
              required
              maxLength={50}
              pattern="[a-z0-9]+(-[a-z0-9]+)*"
              value={form.slug}
              onChange={(event) => setForm({ ...form, slug: event.target.value })}
              placeholder="例如：digital"
              className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 font-mono text-sm text-zinc-900 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
            />
            <p className="mt-1 text-xs text-zinc-500">
              仅小写字母、数字和中划线，用于前台链接。
            </p>
            {fieldErrors.slug?.[0] ? (
              <p className="mt-1 text-sm text-red-600">{fieldErrors.slug[0]}</p>
            ) : null}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? "保存中…" : editingId ? "保存修改" : "创建分类"}
            </button>
            {editingId ? (
              <button
                type="button"
                onClick={resetForm}
                className="rounded-lg border border-zinc-300 px-4 py-2 text-sm text-zinc-700 transition hover:bg-zinc-50"
              >
                取消编辑
              </button>
            ) : null}
          </div>
        </form>
      </section>

      {/* 分类列表 */}
      <section className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-zinc-200 px-5 py-4">
          <h2 className="text-lg font-medium text-zinc-900">分类列表</h2>
          <span className="text-sm text-zinc-500">共 {categories.length} 个</span>
        </div>

        {error ? (
          <p
            role="alert"
            className="mx-5 mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700"
          >
            {error}
          </p>
        ) : null}

        {categories.length === 0 ? (
          <p className="px-5 py-10 text-center text-sm text-zinc-500">
            还没有分类，先创建一个吧。
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-zinc-50 text-xs uppercase tracking-wide text-zinc-500">
                <tr>
                  <th className="px-5 py-3 font-medium">名称</th>
                  <th className="px-5 py-3 font-medium">Slug</th>
                  <th className="px-5 py-3 font-medium">商品数</th>
                  <th className="px-5 py-3 font-medium">创建时间</th>
                  <th className="px-5 py-3 text-right font-medium">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {categories.map((category) => (
                  <tr key={category.id} className="transition-colors hover:bg-zinc-50/70">
                    <td className="px-5 py-3">
                      <div className="font-medium text-zinc-900">{category.name}</div>
                      <div
                        className="mt-0.5 font-mono text-xs text-zinc-400"
                        title={category.id}
                      >
                        {category.id.slice(0, 10)}…
                      </div>
                    </td>
                    <td className="px-5 py-3 font-mono text-zinc-600">{category.slug}</td>
                    <td className="px-5 py-3 text-zinc-600">
                      {category._count?.products ?? 0}
                    </td>
                    <td className="px-5 py-3 text-zinc-500">
                      {formatDate(category.createdAt)}
                    </td>
                    <td className="px-5 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => handleEdit(category)}
                        className="rounded-md px-2 py-1 text-sm font-medium text-emerald-700 transition hover:bg-emerald-50"
                      >
                        编辑
                      </button>
                      <button
                        type="button"
                        onClick={() => void handleDelete(category)}
                        disabled={deletingId !== null}
                        className="ml-1 rounded-md px-2 py-1 text-sm font-medium text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {deletingId === category.id ? "删除中…" : "删除"}
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
