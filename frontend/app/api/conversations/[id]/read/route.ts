import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { markConversationRead } from "@/lib/messaging/query";

function isMissingTableError(error: unknown) {
  if (typeof error !== "object" || error === null) return false;
  const code = "code" in error ? String((error as { code?: string }).code) : "";
  return code === "P2021";
}

export async function PATCH(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const { id } = await params;
    const result = await markConversationRead({
      conversationId: id,
      userId: session.user.id,
    });

    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    if (isMissingTableError(error)) {
      return NextResponse.json(
        { error: "Messaging is not available yet." },
        { status: 503 }
      );
    }
    console.error("[api/conversations/[id]/read] PATCH failed:", error);
    return NextResponse.json(
      { error: "Unable to mark messages as read" },
      { status: 500 }
    );
  }
}
