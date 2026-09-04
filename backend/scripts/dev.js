/**
 * Start Rollnexa dev: prepare Prisma, then Express API + Next.js frontend.
 */
import { execSync, spawn } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const BACKEND = join(__dirname, "..");
const ROOT = join(BACKEND, "..");
const FRONTEND = join(ROOT, "frontend");

execSync("node scripts/prepare-dev.js", {
  cwd: BACKEND,
  stdio: "inherit",
  shell: true,
  env: process.env,
});

/** @type {Array<{ name: string; child: import("node:child_process").ChildProcess }>} */
const children = [];

function spawnService(name, cwd, script, extraEnv = {}) {
  const child = spawn("npm", ["run", script], {
    cwd,
    stdio: "inherit",
    shell: true,
    env: {
      ...process.env,
      ...extraEnv,
      FRONTEND_URL: process.env.FRONTEND_URL || "http://localhost:3000",
    },
  });
  children.push({ name, child });
  child.on("exit", (code, signal) => {
    if (signal) {
      shutdown(signal);
      return;
    }
    if (code && code !== 0) {
      console.error(`[dev] ${name} exited with code ${code}`);
      shutdown("SIGTERM");
      process.exit(code);
    }
  });
  return child;
}

function shutdown(signal) {
  for (const { child } of children) {
    if (!child.killed) child.kill(signal);
  }
}

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));

spawnService("api", BACKEND, "dev", { PORT: process.env.PORT || "5000" });
Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 1500);
spawnService("frontend", FRONTEND, "dev");
