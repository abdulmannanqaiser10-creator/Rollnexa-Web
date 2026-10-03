import type { Request as ExpressRequest, Response as ExpressResponse, NextFunction } from "express";
import { runWithRequest } from "@/lib/request-context";

type RouteHandler = (request: Request) => Promise<Response>;

type RouteModule = {
  GET?: RouteHandler;
  POST?: RouteHandler;
  PUT?: RouteHandler;
  PATCH?: RouteHandler;
  DELETE?: RouteHandler;
};

async function expressToWebRequest(req: ExpressRequest): Promise<Request> {
  const protocol = req.protocol || "http";
  const host = req.get("host") || "localhost";
  const url = `${protocol}://${host}${req.originalUrl}`;

  const headers = new Headers();
  for (const [key, value] of Object.entries(req.headers)) {
    if (!value) continue;
    headers.set(key, Array.isArray(value) ? value.join(", ") : value);
  }

  if (req.method === "GET" || req.method === "HEAD") {
    return new Request(url, { method: req.method, headers });
  }

  const contentType = req.get("content-type") || "";
  if (contentType.includes("multipart/form-data") && req.body && typeof req.body === "object") {
    const formData = new FormData();
    for (const [key, value] of Object.entries(req.body as Record<string, unknown>)) {
      if (value === undefined || value === null) continue;
      if (value && typeof value === "object" && "buffer" in (value as object)) {
        const file = value as Express.Multer.File;
        formData.append(
          key,
          new Blob([file.buffer], { type: file.mimetype }),
          file.originalname
        );
      } else {
        formData.append(key, String(value));
      }
    }
    return new Request(url, { method: req.method, headers, body: formData });
  }

  let body: string | Buffer | undefined;
  const rawBody = (req as ExpressRequest & { rawBody?: Buffer }).rawBody;
  if (rawBody && rawBody.length > 0) body = rawBody;
  else if (req.body !== undefined && req.body !== null) {
    if (typeof req.body === "string" || req.body instanceof Buffer) {
      body = req.body;
    } else if (Object.keys(req.body).length > 0) {
      body = JSON.stringify(req.body);
      if (!headers.has("content-type")) {
        headers.set("content-type", "application/json");
      }
    }
  }

  return new Request(url, { method: req.method, headers, body });
}

async function sendWebResponse(webResponse: Response, res: ExpressResponse) {
  res.status(webResponse.status);
  webResponse.headers.forEach((value, key) => {
    if (key.toLowerCase() === "set-cookie") {
      res.appendHeader(key, value);
    } else {
      res.setHeader(key, value);
    }
  });

  const buffer = Buffer.from(await webResponse.arrayBuffer());
  res.send(buffer);
}

export function adaptRouteModule(module: RouteModule) {
  return async (req: ExpressRequest, res: ExpressResponse, next: NextFunction) => {
    try {
      const method = req.method.toUpperCase() as keyof RouteModule;
      const handler = module[method];
      if (!handler) {
        res.status(405).json({ error: "Method not allowed" });
        return;
      }

      const webRequest = await expressToWebRequest(req);
      await runWithRequest(webRequest, async () => {
        const webResponse = await handler(webRequest);
        await sendWebResponse(webResponse, res);
      });
    } catch (error) {
      next(error);
    }
  };
}
