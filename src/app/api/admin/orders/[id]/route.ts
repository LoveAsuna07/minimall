import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/auth";
import { orderErrorResponse } from "@/lib/order-api";
import { adminUpdateOrderStatus } from "@/lib/orders";
import { readJsonBody } from "@/lib/request";
import { adminOrderStatusSchema } from "@/lib/validation";

export const dynamic = "force-dynamic";

type AdminOrderRouteContext = {
  params: Promise<{ id: string }>;
};

// PUT /api/admin/orders/:id — 更新订单状态
export async function PUT(
  request: Request,
  context: AdminOrderRouteContext,
) {
  const auth = await requireAdminApi();
  if ("response" in auth) {
    return auth.response;
  }

  const { id } = await context.params;

  const json = await readJsonBody(request);
  if (!json.ok) {
    return NextResponse.json({ error: "请求体必须是合法的 JSON" }, { status: 400 });
  }

  const parsed = adminOrderStatusSchema.safeParse(json.body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "输入校验失败",
        fieldErrors: parsed.error.flatten().fieldErrors,
      },
      { status: 400 },
    );
  }

  try {
    const order = await adminUpdateOrderStatus(id, parsed.data.status);
    return NextResponse.json({ order });
  } catch (error) {
    return orderErrorResponse(error);
  }
}
