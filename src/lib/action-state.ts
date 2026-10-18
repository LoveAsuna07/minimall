// Server Action 的通用返回结构
export type CartActionState = {
  ok: boolean;
  message?: string;
};

export const initialCartState: CartActionState = {
  ok: false,
};

// 登录/注册表单的返回结构
export type AuthActionState = {
  ok: boolean;
  message?: string;
  fieldErrors?: Record<string, string[] | undefined>;
};

export const initialAuthState: AuthActionState = {
  ok: false,
};
