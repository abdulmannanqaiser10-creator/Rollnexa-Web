import { NextResponse } from "next/server";
import { requireRole } from "@/lib/session";
import { sendAnnouncementEmail, sendEmailPreview } from "@/lib/emails/service";

export async function POST(request: Request) {
  try {
    const session = await requireRole("ADMIN");
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const body = (await request.json().catch(() => null)) as {
      type?: string;
      to?: string;
      title?: string;
      description?: string;
    } | null;
    const type = body?.type || "announcement";
    const recipient = body?.to?.toString().trim();
    const title = body?.title?.toString().trim();
    const description = body?.description?.toString().trim();

    if (type === "announcement") {
      if (!title || !description) {
        return NextResponse.json({ error: "Title and description are required" }, { status: 400 });
      }
      await sendAnnouncementEmail({
        recipientEmails: recipient ? [recipient] : [],
        title,
        description,
        ctaLabel: "Read announcement",
        ctaUrl: `${process.env.BETTER_AUTH_URL || process.env.APP_URL || "http://localhost:3000"}`,
      });
      return NextResponse.json({ success: true, message: "Announcement email queued" });
    }

    if (!recipient) {
      return NextResponse.json({ error: "Recipient email is required" }, { status: 400 });
    }

    const preview = await sendEmailPreview({
      to: recipient,
      type: type as "welcome" | "verification" | "reset" | "announcement",
      data: {
        title,
        description,
      },
    });

    return NextResponse.json({ success: preview.success, message: preview.success ? "Preview sent" : preview.error });
  } catch (error) {
    console.error("[api/admin/emails/send] failed", error);
    return NextResponse.json({ error: "Unable to process email request" }, { status: 500 });
  }
}
