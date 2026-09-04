import { Router, type Express } from "express";
import { readdirSync, statSync } from "node:fs";
import { dirname, join, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { pathToFileURL } from "node:url";
import { adaptRouteModule } from "@/utils/next-route-adapter";

const API_ROOT = join(fileURLToPath(new URL(".", import.meta.url)), "../routes/api");

function toExpressPath(relativeDir: string): string {
  const segments = relativeDir.split(sep).filter(Boolean);
  const expressSegments = segments.map((segment) => {
    if (segment.startsWith("[...") && segment.endsWith("]")) {
      return "*";
    }
    if (segment.startsWith("[") && segment.endsWith("]")) {
      return `:${segment.slice(1, -1)}`;
    }
    return segment;
  });
  return `/api/${expressSegments.join("/")}`;
}

function walkRouteDirs(dir: string, relative = ""): string[] {
  const entries = readdirSync(dir);
  const routes: string[] = [];

  if (entries.includes("route.ts")) {
    routes.push(relative);
  }

  for (const entry of entries) {
    if (entry === "route.ts") continue;
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      routes.push(...walkRouteDirs(full, join(relative, entry)));
    }
  }

  return routes;
}

export async function registerApiRoutes(app: Express) {
  const router = Router();
  const routeDirs = walkRouteDirs(API_ROOT);

  for (const relative of routeDirs.sort((a, b) => b.length - a.length)) {
    const routeFile = join(API_ROOT, relative, "route.ts");
    const expressPath = toExpressPath(relative);
    const moduleUrl = pathToFileURL(routeFile).href;
    const imported = await import(moduleUrl);
    const handler = adaptRouteModule(imported);
    router.all(expressPath, handler);
    console.log(`[api] mounted ${expressPath}`);
  }

  app.use(router);
}
