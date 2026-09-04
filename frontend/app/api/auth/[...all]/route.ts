import { auth } from "@/lib/auth";
import { toNextJsHandler } from "better-auth/next-js";

const handler = toNextJsHandler(auth);

async function withAuthLogging(
  method: "GET" | "POST",
  request: Request
): Promise<Response> {
  try {
    const response = await handler[method](request);
    if (response.status >= 400) {
      const clone = response.clone();
      const body = await clone.text().catch(() => "");
      console.error(
        `[auth] ${method} ${new URL(request.url).pathname} -> ${response.status}`,
        body.slice(0, 500)
      );
    }
    return response;
  } catch (error) {
    console.error(
      `[auth] ${method} ${new URL(request.url).pathname} crashed:`,
      error
    );
    throw error;
  }
}

export async function GET(request: Request) {
  return withAuthLogging("GET", request);
}

export async function POST(request: Request) {
  return withAuthLogging("POST", request);
}
