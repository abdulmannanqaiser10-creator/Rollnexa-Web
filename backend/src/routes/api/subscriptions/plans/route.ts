import { NextResponse } from "next/server";
import { getActivePlans } from "@/lib/subscriptions/plans";

export async function GET() {
  try {
    const plans = await getActivePlans();
    return NextResponse.json({ success: true, plans });
  } catch (error) {
    console.error("[api/subscriptions/plans] GET failed:", error);
    return NextResponse.json({ error: "Unable to load plans" }, { status: 500 });
  }
}
