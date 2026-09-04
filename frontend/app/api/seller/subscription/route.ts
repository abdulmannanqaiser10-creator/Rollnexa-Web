import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { getSellerSubscriptionView } from "@/lib/subscriptions/service";

export async function GET() {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (session.user.role !== "SELLER") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const subscription = await getSellerSubscriptionView(session.user.id);
    return NextResponse.json({ success: true, subscription });
  } catch (error) {
    console.error("[api/seller/subscription] GET failed:", error);
    return NextResponse.json({ error: "Unable to load subscription" }, { status: 500 });
  }
}
