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
