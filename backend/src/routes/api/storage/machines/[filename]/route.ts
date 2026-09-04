import { NextResponse } from "next/server";
import {
  isSafeMachineUploadFilename,
  readLocalMachineImage,
} from "@/lib/storage/machine-uploads";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ filename: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  try {
    const { filename } = await context.params;

    if (!isSafeMachineUploadFilename(filename)) {
      return NextResponse.json({ error: "Invalid image" }, { status: 400 });
    }

    const file = await readLocalMachineImage(filename);
    if (!file) {
      return NextResponse.json({ error: "Image not found" }, { status: 404 });
    }

    return new NextResponse(file.buffer, {
      status: 200,
      headers: {
        "Content-Type": file.mimeType,
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch (error) {
    console.error("[storage/machines] Failed to serve image:", error);
    return NextResponse.json({ error: "Unable to load image" }, { status: 500 });
  }
}
