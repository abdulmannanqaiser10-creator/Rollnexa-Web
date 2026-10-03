import { getSession } from "@/lib/session";
import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { getSellerPayments } from "@/lib/payments/service";

export async function GET() {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (session.user.role !== "SELLER") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const payments = await getSellerPayments(session.user.id);
    return NextResponse.json({ success: true, payments });
  } catch (error) {
    console.error("[api/seller/payments] GET failed:", error);
    return NextResponse.json({ error: "Unable to load payments" }, { status: 500 });
  }
}
