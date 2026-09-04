import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { getConversationForUser } from "@/lib/messaging/query";

function isMissingTableError(error: unknown) {
  if (typeof error !== "object" || error === null) return false;
  const code = "code" in error ? String((error as { code?: string }).code) : "";
  return code === "P2021";
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const before = searchParams.get("before");

    const conversation = await getConversationForUser({
      conversationId: id,
      userId: session.user.id,
      before,
    });

    if (!conversation) {
      return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: conversation });
  } catch (error) {
    if (isMissingTableError(error)) {
      return NextResponse.json(
        { error: "Messaging is not available yet." },
        { status: 503 }
      );
    }
    console.error("[api/conversations/[id]] GET failed:", error);
    return NextResponse.json(
      { error: "Unable to load conversation" },
      { status: 500 }
    );
  }
}
