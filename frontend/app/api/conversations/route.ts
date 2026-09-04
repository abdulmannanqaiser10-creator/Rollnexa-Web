import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { openConversationSchema } from "@/lib/validations/messaging";
import {
  listConversationsForUser,
  openOrCreateConversation,
} from "@/lib/messaging/query";

function isMissingTableError(error: unknown) {
  if (typeof error !== "object" || error === null) return false;
  const code = "code" in error ? String((error as { code?: string }).code) : "";
  return code === "P2021";
}

export async function GET() {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const data = await listConversationsForUser(session.user.id);
    return NextResponse.json({ success: true, data });
  } catch (error) {
    if (isMissingTableError(error)) {
      return NextResponse.json(
        { error: "Messaging is not available yet. Please run database migrations." },
        { status: 503 }
      );
    }
    console.error("[api/conversations] GET failed:", error);
    return NextResponse.json(
      { error: "Unable to load conversations" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Please log in to contact the seller" }, { status: 401 });
    }

    const body = await request.json().catch(() => null);
    const parsed = openConversationSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Invalid request" },
        { status: 400 }
      );
    }

    const result = await openOrCreateConversation({
      buyerId: session.user.id,
      machineId: parsed.data.machineId,
      initialMessage: parsed.data.message,
    });

    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }

    return NextResponse.json({
      success: true,
      data: {
        conversationId: result.conversationId,
        created: result.created,
      },
    });
  } catch (error) {
    if (isMissingTableError(error)) {
      return NextResponse.json(
        { error: "Messaging is not available yet. Please run database migrations." },
        { status: 503 }
      );
    }
    console.error("[api/conversations] POST failed:", error);
    return NextResponse.json(
      { error: "Unable to start conversation" },
      { status: 500 }
    );
  }
}
