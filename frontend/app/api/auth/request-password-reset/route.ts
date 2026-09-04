import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { checkRateLimit, enforceRequestSize, validateBody } from "@/lib/security";
import { z } from "zod";

const requestPasswordResetSchema = z.object({
  email: z.string().trim().email("Please enter a valid email"),
});

export async function POST(request: Request) {
  try {
    const sizeCheck = await enforceRequestSize(request);
    if (!sizeCheck.ok) {
      return sizeCheck.response;
    }

    const rateLimit = checkRateLimit(request, "password-reset", 5, 60_000);
    if (!rateLimit.allowed) {
      return NextResponse.json({ message: "Too many requests" }, { status: 429 });
    }

    const body = await request.json().catch(() => null);
    const parsed = validateBody(requestPasswordResetSchema, body);
    if (!parsed.success) {
      return NextResponse.json({ message: parsed.error.issues[0]?.message || "Invalid request" }, { status: 400 });
    }

    const email = parsed.data.email;

    const response = await auth.api.requestPasswordReset({
      body: {
        email,
        redirectTo: `${process.env.BETTER_AUTH_URL || process.env.APP_URL || "http://localhost:3000"}/reset-password`,
      },
      asResponse: true,
    });

    const payload = await response.clone().json().catch(() => null);
    return NextResponse.json(payload, { status: response.status });
  } catch (error) {
    console.error("[auth/request-password-reset] failed", error);
    return NextResponse.json({ message: "Unable to send password reset email" }, { status: 500 });
  }
}
