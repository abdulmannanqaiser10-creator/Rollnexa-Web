/**
 * Pre-dev checks: free stale port 3000, generate Prisma client, sync schema.
 */
import { execSync } from "node:child_process";
import { existsSync, rmSync } from "node:fs";
import { platform } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const BACKEND = join(__dirname, "..");
const ROOT = join(BACKEND, "..");
const DEV_PORT = 3000;
const API_PORT = Number(process.env.PORT || 5000);

function log(message) {
  console.log(`[dev:prepare] ${message}`);
}

function sleep(ms) {
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
}

function isDevServerProcess(pid) {
  try {
    if (platform() === "win32") {
      const out = execSync(`tasklist /FI "PID eq ${pid}" /FO CSV /NH`, {
        encoding: "utf8",
      });
      return /node|tsx/i.test(out);
    }
    const out = execSync(`ps -p ${pid} -o comm=`, { encoding: "utf8" });
    return /node|tsx/i.test(out);
  } catch {
    return false;
  }
}

function freePort(port) {
  const pids = new Set();

  try {
    if (platform() === "win32") {
      const out = execSync(`netstat -ano | findstr :${port}`, { encoding: "utf8" });
      for (const line of out.split(/\r?\n/)) {
        if (!line.includes("LISTENING")) continue;
        const parts = line.trim().split(/\s+/);
        const pid = parts[parts.length - 1];
        if (pid && /^\d+$/.test(pid)) pids.add(pid);
      }
    } else {
      const out = execSync(`lsof -ti :${port}`, { encoding: "utf8" }).trim();
      if (out) {
        for (const pid of out.split(/\n/)) {
          if (/^\d+$/.test(pid)) pids.add(pid);
        }
      }
    }
  } catch {
    return;
  }

  for (const pid of pids) {
    if (!isDevServerProcess(pid)) continue;
    log(`stopping stale dev process ${pid} on port ${port}`);
    try {
      if (platform() === "win32") {
        execSync(`taskkill /PID ${pid} /F`, { stdio: "ignore" });
      } else {
        execSync(`kill ${pid}`, { stdio: "ignore" });
      }
      sleep(500);
    } catch {
      // process may have already exited
    }
  }
}

function ensureMongoReplicaSet() {
  try {
    execSync("node scripts/start-mongo-rs.js", {
      cwd: BACKEND,
      stdio: "inherit",
      shell: true,
      env: process.env,
    });
  } catch (error) {
    log(
      `MongoDB replica set is required for Prisma (auth writes). Start failed: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
    throw error;
  }
}

function main() {
  freePort(DEV_PORT);
  freePort(API_PORT);
  sleep(1000);
  ensureMongoReplicaSet();

  const legacyGenerated = join(ROOT, "frontend", "app", "generated", "prisma");
  try {
    if (existsSync(legacyGenerated)) {
      rmSync(legacyGenerated, { recursive: true, force: true });
      log("removed legacy frontend/app/generated/prisma");
    }
  } catch (error) {
    log(
      `could not remove legacy Prisma output (may be locked): ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }

  execSync("node scripts/prisma-generate-safe.js", {
    cwd: BACKEND,
    stdio: "inherit",
    shell: true,
    env: process.env,
  });

  execSync("npm run db:push", {
    cwd: BACKEND,
    stdio: "inherit",
    shell: true,
    env: process.env,
  });

  log("ready");
}

main();
