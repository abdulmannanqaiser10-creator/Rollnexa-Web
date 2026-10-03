import type { ErrorRequestHandler } from "express";

function statusFor(error: unknown): number {
  if (error && typeof error === "object") {
    const candidate = error as {
      name?: string;
      type?: string;
      code?: string;
      statusCode?: number;
      status?: number;
    };

    if (candidate.name === "MulterError") {
      return candidate.code === "LIMIT_FILE_SIZE" ||
        candidate.code === "LIMIT_FILE_COUNT" ||
        candidate.code === "LIMIT_PART_COUNT"
        ? 413
        : 400;
    }
    // body-parser / raw-body errors
    if (candidate.type === "entity.too.large") return 413;
    if (candidate.type === "entity.parse.failed") return 400;
    if (
      candidate.type === "charset.unsupported" ||
      candidate.type === "encoding.unsupported"
    ) {
      return 415;
    }
    if (
      typeof candidate.statusCode === "number" &&
      candidate.statusCode >= 400 &&
      candidate.statusCode < 600
    ) {
      return candidate.statusCode;
    }
    if (
      typeof candidate.status === "number" &&
      candidate.status >= 400 &&
      candidate.status < 600
    ) {
      return candidate.status;
    }
  }
  return 500;
}

export const errorHandler: ErrorRequestHandler = (error, _req, res, _next) => {
  console.error("[api] unhandled error:", error);
  if (res.headersSent) return;

  const status = statusFor(error);
  res.status(status).json({
    error:
      status >= 500
        ? "Internal server error"
        : status === 413
          ? "Payload too large"
          : status === 400
            ? "Invalid request"
            : "Request failed",
    ...(process.env.NODE_ENV === "development" &&
    status >= 500 &&
    error instanceof Error &&
    error.message
      ? { message: error.message }
      : {}),
  });
};
