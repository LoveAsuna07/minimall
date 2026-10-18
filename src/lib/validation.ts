import { z } from "zod";

// 分类 slug：小写字母、数字与中划线，不能以中划线开头或结尾
export const CATEGORY_SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export const categoryInputSchema = z.object({
  name: z
    .string({ required_error: "分类名称不能为空" })
    .trim()
    .min(1, "分类名称不能为空")
    .max(50, "分类名称不能超过 50 个字符"),
  slug: z
    .string({ required_error: "Slug 不能为空" })
    .trim()
    .min(1, "Slug 不能为空")
    .max(50, "Slug 不能超过 50 个字符")
    .regex(CATEGORY_SLUG_PATTERN, "Slug 只能包含小写字母、数字和中划线"),
});

export type CategoryInput = z.infer<typeof categoryInputSchema>;

// ---------- 认证 ----------

export const emailSchema = z
  .string({ required_error: "请输入邮箱" })
  .trim()
  .email("请输入有效的邮箱");

export const nameSchema = z
  .string({ required_error: "请输入昵称" })
  .trim()
  .min(1, "请输入昵称")
  .max(30, "昵称不能超过 30 个字符");

export const registerPasswordSchema = z
  .string({ required_error: "请输入密码" })
  .min(6, "密码至少 6 位")
  .max(64, "密码不能超过 64 位");

export const loginInputSchema = z.object({
  email: emailSchema,
  password: z
    .string({ required_error: "请输入密码" })
    .min(1, "请输入密码"),
});

export const registerInputSchema = z.object({
  name: nameSchema,
  email: emailSchema,
  password: registerPasswordSchema,
});

// 网页注册表单额外包含确认密码
export const registerFormSchema = registerInputSchema
  .extend({
    confirmPassword: z.string().min(1, "请再次输入密码"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "两次输入的密码不一致",
    path: ["confirmPassword"],
  });

export type LoginInput = z.infer<typeof loginInputSchema>;
export type RegisterInput = z.infer<typeof registerInputSchema>;
export type RegisterFormInput = z.infer<typeof registerFormSchema>;

// ---------- 购物车 ----------

export const addCartItemSchema = z.object({
  productId: z
    .string({ required_error: "缺少商品信息" })
    .min(1, "缺少商品信息"),
  quantity: z
    .number({ required_error: "请输入数量" })
    .int("数量必须是整数")
    .min(1, "数量至少为 1")
    .max(999, "数量不能超过 999"),
});

export const updateCartItemSchema = z.object({
  quantity: z
    .number({ required_error: "请输入数量" })
    .int("数量必须是整数")
    .min(1, "数量至少为 1")
    .max(999, "数量不能超过 999"),
});

export type AddCartItemInput = z.infer<typeof addCartItemSchema>;
export type UpdateCartItemInput = z.infer<typeof updateCartItemSchema>;

// ---------- 订单 ----------

// 下单时可选收货信息；未提供时使用用户昵称与占位值
export const createOrderSchema = z.object({
  shipName: z
    .string()
    .trim()
    .min(1, "请输入收货人姓名")
    .max(50, "收货人姓名不能超过 50 个字符")
    .optional(),
  shipPhone: z
    .string()
    .trim()
    .regex(/^1[3-9]\d{9}$/, "请输入有效的手机号")
    .optional(),
  shipAddress: z
    .string()
    .trim()
    .min(5, "收货地址至少 5 个字符")
    .max(200, "收货地址不能超过 200 个字符")
    .optional(),
});

export const orderActionSchema = z
  .object({
    action: z.enum(["pay", "cancel"]).optional(),
    status: z.enum(["PAID", "CANCELLED"]).optional(),
  })
  .refine(
    (data) =>
      !(data.action && data.status) ||
      (data.action === "pay" && data.status === "PAID") ||
      (data.action === "cancel" && data.status === "CANCELLED"),
    { message: "操作与订单状态不匹配" },
  );

export type CreateOrderInput = z.infer<typeof createOrderSchema>;
export type OrderActionInput = z.infer<typeof orderActionSchema>;

// ---------- 后台商品 ----------

const httpImageUrlSchema = z
  .string({ required_error: "请输入图片 URL" })
  .trim()
  .url("请输入有效的图片 URL")
  .refine((value) => {
    try {
      const url = new URL(value);
      return url.protocol === "http:" || url.protocol === "https:";
    } catch {
      return false;
    }
  }, "图片 URL 必须以 http:// 或 https:// 开头");

export const productInputSchema = z.object({
  name: z
    .string({ required_error: "请输入商品名称" })
    .trim()
    .min(1, "请输入商品名称")
    .max(100, "商品名称不能超过 100 个字符"),
  description: z
    .string()
    .trim()
    .max(5000, "商品描述不能超过 5000 个字符")
    .optional()
    .default(""),
  price: z
    .number({ required_error: "请输入价格" })
    .int("价格必须以分为单位")
    .min(0, "价格不能为负数")
    .max(99_999_999, "价格超出范围"),
  imageUrl: httpImageUrlSchema,
  stock: z
    .number({ required_error: "请输入库存" })
    .int("库存必须是整数")
    .min(0, "库存不能为负数")
    .max(999_999, "库存超出范围"),
  categoryId: z
    .string({ required_error: "请选择分类" })
    .min(1, "请选择分类"),
  active: z.boolean().optional().default(true),
});

export type ProductInput = z.infer<typeof productInputSchema>;

// ---------- 后台订单 ----------

export const adminOrderStatusSchema = z.object({
  status: z.enum(["PAID", "SHIPPED", "COMPLETED", "CANCELLED"]),
});

export type AdminOrderStatusInput = z.infer<typeof adminOrderStatusSchema>;
