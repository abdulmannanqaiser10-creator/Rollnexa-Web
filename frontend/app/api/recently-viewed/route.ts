import { z } from "zod";
import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import {
  clearRecentlyViewed,
  getRecentlyViewedMachines,
  removeRecentlyViewed,
  trackRecentlyViewed,
} from "@/lib/recently-viewed/query";

const machineIdSchema = z.object({
  machineId: z.string().uuid("Invalid machine"),
});

export async function GET() {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Please log in to view recently viewed machines" },
        { status: 401 }
      );
    }

    const { items, total } = await getRecentlyViewedMachines(session.user.id);
    return NextResponse.json({ success: true, data: items, total });
  } catch (error) {
    console.error("[api/recently-viewed] GET failed:", error);
    return NextResponse.json(
      { error: "Unable to load recently viewed machines" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      // Soft-auth: guests simply skip tracking
      return NextResponse.json({ success: true, tracked: false });
    }

    const body = await request.json().catch(() => null);
    const parsed = machineIdSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Invalid request" },
        { status: 400 }
      );
    }

    const result = await trackRecentlyViewed(
      session.user.id,
      parsed.data.machineId
    );

    if (!result.ok) {
      return NextResponse.json({ error: "Machine not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, tracked: true });
  } catch (error) {
    console.error("[api/recently-viewed] POST failed:", error);
    // Fail soft so machine details UX is never blocked by callers ignoring this
    return NextResponse.json(
      { error: "Unable to save recently viewed" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Please log in to manage recently viewed" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const clearAll = searchParams.get("all") === "1";

    if (clearAll) {
      const count = await clearRecentlyViewed(session.user.id);
      return NextResponse.json({
        success: true,
        cleared: count,
        message: "Recently viewed history cleared",
      });
    }

    const body = await request.json().catch(() => null);
    const parsed = machineIdSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Invalid request" },
        { status: 400 }
      );
    }

    const removed = await removeRecentlyViewed(
      session.user.id,
      parsed.data.machineId
    );

    if (!removed) {
      return NextResponse.json({ error: "Record not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: "Removed from recently viewed",
    });
  } catch (error) {
    console.error("[api/recently-viewed] DELETE failed:", error);
    return NextResponse.json(
      { error: "Unable to update recently viewed" },
      { status: 500 }
    );
  }
}
