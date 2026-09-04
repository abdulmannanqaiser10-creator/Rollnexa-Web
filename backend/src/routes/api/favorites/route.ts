import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/session";
import { favoriteToggleSchema } from "@/lib/validations/inquiry";
import { getBuyerFavorites } from "@/lib/favorites/query";

function isMissingTableError(error: unknown) {
  if (typeof error !== "object" || error === null) return false;
  const code = "code" in error ? String((error as { code?: string }).code) : "";
  return code === "P2021";
}

function isUniqueConstraintError(error: unknown) {
  if (typeof error !== "object" || error === null) return false;
  const code = "code" in error ? String((error as { code?: string }).code) : "";
  return code === "P2002";
}

export async function GET() {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Please log in to view favorites" },
        { status: 401 }
      );
    }

    const { favorites, total } = await getBuyerFavorites(session.user.id);

    return NextResponse.json({
      success: true,
      data: favorites,
      total,
    });
  } catch (error) {
    console.error("[api/favorites] GET failed:", error);
    return NextResponse.json(
      { error: "Unable to load favorites" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Please log in to save favorites" },
        { status: 401 }
      );
    }

    const body = await request.json().catch(() => null);
    const parsed = favoriteToggleSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Invalid request" },
        { status: 400 }
      );
    }

    const machine = await prisma.machine.findFirst({
      where: { id: parsed.data.machineId, status: "PUBLISHED" },
      select: { id: true },
    });

    if (!machine) {
      return NextResponse.json({ error: "Machine not found" }, { status: 404 });
    }

    const userId = session.user.id;

    try {
      const existing = await prisma.favorite.findUnique({
        where: {
          userId_machineId: { userId, machineId: machine.id },
        },
        select: { id: true },
      });

      if (existing) {
        await prisma.favorite.delete({
          where: {
            id: existing.id,
            userId,
          },
        });
        return NextResponse.json({
          success: true,
          favorited: false,
          message: "Removed from favorites",
        });
      }

      try {
        await prisma.favorite.create({
          data: {
            userId,
            machineId: machine.id,
          },
        });
      } catch (createError) {
        // Race: another request created the same favorite — treat as already favorited
        if (isUniqueConstraintError(createError)) {
          return NextResponse.json({
            success: true,
            favorited: true,
            message: "Already saved to favorites",
          });
        }
        throw createError;
      }

      return NextResponse.json({
        success: true,
        favorited: true,
        message: "Saved to favorites",
      });
    } catch (error) {
      if (isMissingTableError(error)) {
        console.error(
          "[api/favorites] Favorite table missing. Run: npx prisma migrate deploy"
        );
        return NextResponse.json(
          {
            error:
              "Favorites are not available yet. Please ask an admin to run database migrations.",
          },
          { status: 503 }
        );
      }
      throw error;
    }
  } catch (error) {
    console.error("[api/favorites] POST failed:", error);
    return NextResponse.json(
      { error: "Unable to update favorites" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Please log in to manage favorites" },
        { status: 401 }
      );
    }

    const body = await request.json().catch(() => null);
    const parsed = favoriteToggleSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Invalid request" },
        { status: 400 }
      );
    }

    const result = await prisma.favorite.deleteMany({
      where: {
        userId: session.user.id,
        machineId: parsed.data.machineId,
      },
    });

    if (result.count === 0) {
      return NextResponse.json(
        { error: "Favorite not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      favorited: false,
      message: "Removed from favorites",
    });
  } catch (error) {
    if (isMissingTableError(error)) {
      return NextResponse.json(
        { error: "Favorites are not available yet." },
        { status: 503 }
      );
    }
    console.error("[api/favorites] DELETE failed:", error);
    return NextResponse.json(
      { error: "Unable to remove favorite" },
      { status: 500 }
    );
  }
}
