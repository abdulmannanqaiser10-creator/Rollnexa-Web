import { NextResponse } from "next/server";
import {
  isCloudinaryConfigured,
  uploadMachineImageBuffer,
} from "@/lib/cloudinary";
import { MACHINE_IMAGE_LIMITS } from "@/lib/validations/machine";
import {
  MACHINE_UPLOAD_MAX_BYTES,
  assertSameOrigin,
  checkRateLimit,
  detectImageMime,
  enforceRequestSize,
  rateLimitResponse,
  requireApiSession,
} from "@/lib/security";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const originCheck = assertSameOrigin(request);
    if (!originCheck.ok) return originCheck.response;

    const rateLimit = checkRateLimit(request, "machine-upload", 30, 60_000);
    if (!rateLimit.allowed) {
      return rateLimitResponse(rateLimit.resetAt);
    }

    const sizeCheck = await enforceRequestSize(request, MACHINE_UPLOAD_MAX_BYTES);
    if (!sizeCheck.ok) {
      return sizeCheck.response;
    }

    const { response } = await requireApiSession("SELLER");
    if (response) return response;

    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Image file is required" }, { status: 400 });
    }

    const allowedTypes = new Set<string>(MACHINE_IMAGE_LIMITS.accept);
    if (!allowedTypes.has(file.type as string)) {
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
    const detectedMime = detectImageMime(buffer);
    if (!detectedMime || detectedMime !== file.type) {
      return NextResponse.json(
        { error: "Image content does not match an allowed image type" },
        { status: 400 }
      );
    }

    const safeName =
      file.name.replace(/[^a-zA-Z0-9._-]/g, "-").slice(0, 120) || "machine-image";
    const uploaded = await uploadMachineImageBuffer(buffer, safeName, detectedMime);

    return NextResponse.json({
      success: true,
      message: isCloudinaryConfigured()
        ? "Images uploaded successfully."
        : "Image saved to server storage. Add Cloudinary credentials for cloud storage.",
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
