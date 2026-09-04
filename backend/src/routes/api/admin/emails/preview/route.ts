import { NextResponse } from "next/server";
import { requireRole } from "@/lib/session";
import { sendEmailPreview } from "@/lib/emails/service";

export async function GET(request: Request) {
  try {
    const session = await requireRole("ADMIN");
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type") || "welcome";
    const to = searchParams.get("to");
    if (!to) {
      return NextResponse.json({ error: "Recipient email is required" }, { status: 400 });
    }

    const result = await sendEmailPreview({
      to,
      type: type as "welcome" | "verification" | "reset" | "announcement",
      data: {
        title: searchParams.get("title") || "Rollnexa preview",
        description: searchParams.get("description") || "This is a preview email",
      },
    });

    if (!result.success) {
      return NextResponse.json({ error: result.error || "Preview failed" }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: "Preview email queued" });
  } catch (error) {
    console.error("[api/admin/emails/preview] failed", error);
    return NextResponse.json({ error: "Unable to generate preview" }, { status: 500 });
  }
}
