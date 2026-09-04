import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

const bodySchema = z.object({
  name: z.string().trim().min(2, "Full name is required").max(80).optional(),
  avatar: z.string().trim().url("Invalid avatar URL").optional().or(z.literal("")),
  phone: z.string().trim().max(40).optional(),
  companyName: z.string().trim().max(120).optional(),
  bio: z.string().trim().max(600).optional(),
  city: z.string().trim().max(80).optional(),
  country: z.string().trim().max(80).optional(),
});

async function getAuthedSession() {
  return auth.api.getSession({
    headers: await headers(),
  });
}

export async function GET() {
  try {
    const session = await getAuthedSession();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const [user, profile] = await Promise.all([
      prisma.user.findUnique({
        where: { id: session.user.id },
        select: { name: true, email: true, image: true },
      }),
      prisma.profile.findUnique({
        where: { userId: session.user.id },
        select: {
          avatar: true,
          phone: true,
          companyName: true,
          bio: true,
          city: true,
          country: true,
        },
      }),
    ]);

    return NextResponse.json({
      ok: true,
      data: {
        name: user?.name ?? "",
        email: user?.email ?? "",
        avatar: profile?.avatar ?? user?.image ?? "",
        phone: profile?.phone ?? "",
        companyName: profile?.companyName ?? "",
        bio: profile?.bio ?? "",
        city: profile?.city ?? "",
        country: profile?.country ?? "",
      },
    });
  } catch (error) {
    console.error("[profile] Failed to load profile:", error);
    return NextResponse.json(
      { error: "Failed to load profile" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await getAuthedSession();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const json = await request.json().catch(() => null);
    const parsed = bodySchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Invalid request" },
        { status: 400 }
      );
    }

    const data = parsed.data;

    if (typeof data.name === "string" && data.name.length > 0) {
      await prisma.user.update({
        where: { id: session.user.id },
        data: { name: data.name },
      });
    }

    await prisma.profile.upsert({
      where: { userId: session.user.id },
      create: {
        userId: session.user.id,
        avatar: data.avatar || null,
        phone: data.phone || null,
        companyName: data.companyName || null,
        bio: data.bio || null,
        city: data.city || null,
        country: data.country || null,
      },
      update: {
        avatar: data.avatar || null,
        phone: data.phone || null,
        companyName: data.companyName || null,
        bio: data.bio || null,
        city: data.city || null,
        country: data.country || null,
      },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[profile] Failed to update profile:", error);
    return NextResponse.json(
      { error: "Failed to update profile" },
      { status: 500 }
    );
  }
}

// Backward compatibility for existing callers that used POST.
export async function POST(request: Request) {
  return PATCH(request);
}
