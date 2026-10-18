import { NextResponse } from "next/server";
import { requireUserApi } from "@/lib/auth";
import { orderErrorResponse } from "@/lib/order-api";
import {
  cancelOrder,
  getUserOrder,
  payOrder,
} from "@/lib/orders";
import { readJsonBody } from "@/lib/request";
import { orderActionSchema } from "@/lib/validation";

export const dynamic = "force-dynamic";

type OrderRouteContext = {
  params: Promise<{ id: string }>;
};

// GET /api/orders/:id — 订单详情
export async function GET(
  _request: Request,
  context: OrderRouteContext,
) {
  const auth = await requireUserApi();
  if ("response" in auth) {
    return auth.response;
  }

  const { id } = await context.params;
  const order = await getUserOrder(auth.user.id, id);

  if (!order) {
    return NextResponse.json({ error: "订单不存在" }, { status: 404 });
  }

  return NextResponse.json({ order });
}

// PUT /api/orders/:id — 模拟支付或取消订单
export async function PUT(
  request: Request,
  context: OrderRouteContext,
) {
  const auth = await requireUserApi();
  if ("response" in auth) {
    return auth.response;
  }

  const { id } = await context.params;

  const json = await readJsonBody(request);
  if (!json.ok) {
    return NextResponse.json({ error: "请求体必须是合法的 JSON" }, { status: 400 });
  }

  const parsed = orderActionSchema.safeParse(json.body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "输入校验失败",
        fieldErrors: parsed.error.flatten().fieldErrors,
      },
      { status: 400 },
    );
  }

  // 空请求体默认执行支付；也兼容 { status: "PAID" | "CANCELLED" }
  const action =
    parsed.data.action ??
    (parsed.data.status === "CANCELLED" ? "cancel" : "pay");

  try {
    const order =
      action === "cancel"
        ? await cancelOrder(auth.user.id, id)
        : await payOrder(auth.user.id, id);

    return NextResponse.json({ order });
  } catch (error) {
    return orderErrorResponse(error);
  }
}
