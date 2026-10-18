import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/auth";
import { getAllOrders } from "@/lib/orders";

export const dynamic = "force-dynamic";

// GET /api/admin/orders — 所有订单
export async function GET() {
  const auth = await requireAdminApi();
  if ("response" in auth) {
    return auth.response;
  }

  const orders = await getAllOrders();
  return NextResponse.json({ orders });
}
