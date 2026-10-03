import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import multer from "multer";
import { env } from "@/config/env";
import { errorHandler } from "@/middleware/error";
import { securityMiddleware } from "@/middleware/security";
import { registerApiRoutes } from "@/utils/register-api-routes";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 8 * 1000 * 1000,
    files: 20,
    fields: 60,
    fieldSize: 128 * 1024,
    parts: 90,
  },
});

function allowedCorsOrigin(origin: string | undefined): boolean {
  if (!origin) return true;
  return env.corsOrigins.includes(origin);
}

export async function createApp() {
  const app = express();

  app.disable("x-powered-by");
  app.set("trust proxy", 1);
  app.set("etag", false);

  app.use(securityMiddleware);

  app.use(
    cors({
      origin(origin, callback) {
        if (allowedCorsOrigin(origin)) {
          callback(null, true);
          return;
        }
        // Do not throw: a blocked origin must not surface as a 500 with a
        // stack trace. Withholding CORS headers is enough for the browser.
        callback(null, false);
      },
      credentials: true,
      methods: ["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
      maxAge: 600,
    })
  );

  app.use(cookieParser());
  app.use((req, res, next) => {
    if (req.is("multipart/form-data")) {
      upload.any()(req, res, (err) => {
        if (err) {
          const tooLarge =
            err instanceof multer.MulterError && err.code === "LIMIT_FILE_SIZE";
          res.status(tooLarge ? 413 : 400).json({
            error: tooLarge ? "File is too large" : "Invalid upload",
          });
          return;
        }
        next();
      });
      return;
    }
    next();
  });
  app.use(express.json({ limit: "1mb" }));
  app.use(express.urlencoded({ extended: true, limit: "64kb" }));

  app.get("/health", (_req, res) => {
    res.json({ ok: true, service: "rollnexa-api" });
  });

  await registerApiRoutes(app);

  app.use("/api", (_req, res) => {
    res.status(404).json({ error: "Not found" });
  });

  app.use((_req, res) => {
    res.status(404).send("Not found");
  });

  app.use(errorHandler);

  return app;
}
