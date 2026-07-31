import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import {
  isCloudinaryConfigured,
  uploadMachineImageBuffer,
} from "@/lib/cloudinary";
import { MACHINE_IMAGE_LIMITS } from "@/lib/validations/machine";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role !== "SELLER") {
      return NextResponse.json(
        { error: "Only sellers can upload machine images" },
        { status: 403 }
      );
    }

    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Image file is required" }, { status: 400 });
    }

    if (
      !MACHINE_IMAGE_LIMITS.accept.includes(
        file.type as (typeof MACHINE_IMAGE_LIMITS.accept)[number]
      )
    ) {
      return NextResponse.json(
        { error: "Only JPEG, PNG, and WebP images are allowed" },
        { status: 400 }
      );
    }

    if (file.size <= 0) {
      return NextResponse.json({ error: "Image file is empty" }, { status: 400 });
    }

    if (file.size > MACHINE_IMAGE_LIMITS.maxBytes) {
      return NextResponse.json(
        { error: "Each image must be 5MB or smaller" },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const uploaded = await uploadMachineImageBuffer(
      buffer,
      file.name || "machine",
      file.type
    );

    return NextResponse.json({
      success: true,
      message: isCloudinaryConfigured()
        ? "Images uploaded successfully."
        : "Image saved locally. Add Cloudinary credentials for cloud storage.",
      image: {
        url: uploaded.url,
        publicId: uploaded.publicId,
        storage: uploaded.storage,
      },
    });
  } catch (error) {
    console.error("[upload] Machine image upload failed:", error);
    return NextResponse.json(
      { error: "Image upload failed. Please try again." },
      { status: 500 }
    );
  }
}
