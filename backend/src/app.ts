import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import multer from "multer";
import { env } from "@/config/env";
import { errorHandler } from "@/middleware/error";
import { registerApiRoutes } from "@/utils/register-api-routes";

const upload = multer({ storage: multer.memoryStorage() });

export async function createApp() {
  const app = express();

  app.use(
    cors({
      origin(origin, callback) {
        if (!origin) {
          callback(null, true);
          return;
        }
        if (env.corsOrigins.includes(origin)) {
          callback(null, true);
          return;
        }
        callback(new Error(`CORS blocked for origin: ${origin}`));
      },
      credentials: true,
    })
  );

  app.use(cookieParser());
  app.use((req, res, next) => {
    if (req.is("multipart/form-data")) {
      upload.any()(req, res, next);
      return;
    }
    next();
  });
  app.use(express.json({ limit: "2mb" }));
  app.use(express.urlencoded({ extended: true }));

  app.get("/health", (_req, res) => {
    res.json({ ok: true, service: "rollnexa-api" });
  });

  await registerApiRoutes(app);
  app.use(errorHandler);

  return app;
}
