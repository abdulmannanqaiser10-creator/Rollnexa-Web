import type { ErrorRequestHandler } from "express";

export const errorHandler: ErrorRequestHandler = (error, _req, res, _next) => {
  console.error("[api] unhandled error:", error);
  if (res.headersSent) return;
  res.status(500).json({
    error: "Internal server error",
    message:
      process.env.NODE_ENV === "development" && error instanceof Error
        ? error.message
        : undefined,
  });
};
