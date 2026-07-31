import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { sendMessageSchema } from "@/lib/validations/messaging";
import { sendMessage } from "@/lib/messaging/query";

function isMissingTableError(error: unknown) {
  if (typeof error !== "object" || error === null) return false;
  const code = "code" in error ? String((error as { code?: string }).code) : "";
  return code === "P2021";
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json().catch(() => null);
    const parsed = sendMessageSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Invalid message" },
        { status: 400 }
      );
    }

    const result = await sendMessage({
      conversationId: id,
      senderId: session.user.id,
      content: parsed.data.content,
      attachmentUrl: parsed.data.attachmentUrl,
      attachmentType: parsed.data.attachmentType,
    });

    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }

    return NextResponse.json({ success: true, data: result.message });
  } catch (error) {
    if (isMissingTableError(error)) {
      return NextResponse.json(
        { error: "Messaging is not available yet." },
        { status: 503 }
      );
    }
    console.error("[api/conversations/[id]/messages] POST failed:", error);
    return NextResponse.json({ error: "Unable to send message" }, { status: 500 });
  }
}
