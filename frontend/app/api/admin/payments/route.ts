import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/admin/auth";
import { listAdminPayments } from "@/lib/payments/service";
import { adminPaymentsQuerySchema } from "@/lib/validations/subscription";

export async function GET(request: Request) {
  try {
    const session = await requireAdminApi();
    if (!session) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const parsed = adminPaymentsQuerySchema.safeParse({
      status: searchParams.get("status") ?? "ALL",
      plan: searchParams.get("plan") ?? undefined,
      q: searchParams.get("q") ?? undefined,
    });

    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid query" }, { status: 400 });
    }

    const payments = await listAdminPayments({
      status: parsed.data.status,
      planSlug: parsed.data.plan,
      q: parsed.data.q,
    });

    return NextResponse.json({ success: true, payments });
  } catch (error) {
    console.error("[api/admin/payments] GET failed:", error);
    return NextResponse.json({ error: "Unable to load payments" }, { status: 500 });
  }
}
