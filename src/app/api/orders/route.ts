import { NextResponse } from "next/server";
import { requireUserApi } from "@/lib/auth";
import { orderErrorResponse } from "@/lib/order-api";
import { createOrderFromCart, getUserOrders } from "@/lib/orders";
import { readJsonBody } from "@/lib/request";
import { createOrderSchema } from "@/lib/validation";

export const dynamic = "force-dynamic";

// GET /api/orders — 我的订单列表
export async function GET() {
  const auth = await requireUserApi();
  if ("response" in auth) {
    return auth.response;
  }

  const orders = await getUserOrders(auth.user.id);
  return NextResponse.json({ orders });
}

// POST /api/orders — 从购物车创建订单
export async function POST(request: Request) {
  const auth = await requireUserApi();
  if ("response" in auth) {
    return auth.response;
  }

  const json = await readJsonBody(request);
  if (!json.ok) {
    return NextResponse.json({ error: "请求体必须是合法的 JSON" }, { status: 400 });
  }

  const parsed = createOrderSchema.safeParse(json.body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "输入校验失败",
        fieldErrors: parsed.error.flatten().fieldErrors,
      },
      { status: 400 },
    );
  }

  // 未提供收货信息时使用昵称与占位值；结算页会传完整信息
  const shipping = {
    shipName: parsed.data.shipName ?? auth.user.name,
    shipPhone: parsed.data.shipPhone ?? "待补充",
    shipAddress: parsed.data.shipAddress ?? "待补充",
  };

  try {
    const order = await createOrderFromCart(auth.user.id, shipping);
    return NextResponse.json({ order }, { status: 201 });
  } catch (error) {
    return orderErrorResponse(error);
  }
}
