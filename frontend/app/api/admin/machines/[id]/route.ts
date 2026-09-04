import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/admin/auth";
import {
  buildRejectionReason,
  moderateListing,
} from "@/lib/admin/listing-moderation";
import { adminListingModerationSchema } from "@/lib/validations/admin";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const session = await requireAdminApi();
    if (!session) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await context.params;
    const body = await request.json().catch(() => null);
    const parsed = adminListingModerationSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Invalid input" },
        { status: 400 }
      );
    }

    const rejectionReason =
      parsed.data.action === "reject"
        ? buildRejectionReason({
            preset: parsed.data.rejectionPreset,
            custom: parsed.data.rejectionReason,
          })
        : null;

    const result = await moderateListing({
      machineId: id,
      adminId: session.user.id,
      action: parsed.data.action,
      rejectionReason,
    });

    if ("error" in result && result.error) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }

    const messages: Record<string, string> = {
      approve: "Listing approved successfully.",
      reject: "Listing rejected and seller notified via dashboard.",
      archive: "Listing archived.",
      mark_sold: "Listing marked as sold.",
      feature: "Listing marked as featured.",
      unfeature: "Featured status removed.",
    };

    return NextResponse.json({
      success: true,
      message: messages[parsed.data.action],
      data: result.data,
    });
  } catch (error) {
    console.error("[api/admin/machines/id] PATCH failed:", error);
    return NextResponse.json({ error: "Unable to update machine" }, { status: 500 });
  }
}
