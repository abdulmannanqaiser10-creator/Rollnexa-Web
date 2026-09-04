/**
 * Run `prisma generate` with Windows-safe retries when query_engine DLL is locked.
 */
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const BACKEND = join(__dirname, "..");
const GENERATED = join(BACKEND, "generated", "prisma");
const MAX_ATTEMPTS = 4;

function log(message) {
  console.log(`[prisma:generate] ${message}`);
}

function sleep(ms) {
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
}

function cleanStaleTmpFiles(dir) {
  if (!fs.existsSync(dir)) return;

  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      cleanStaleTmpFiles(fullPath);
      continue;
    }
    if (!entry.name.includes(".tmp")) continue;
    try {
      fs.unlinkSync(fullPath);
      log(`removed stale ${fullPath.replace(BACKEND, "").replace(/^[/\\]/, "")}`);
    } catch {
      // locked or already gone
    }
  }
}

function runGenerate() {
  return spawnSync("npx", ["prisma", "generate"], {
    cwd: BACKEND,
    stdio: "inherit",
    shell: true,
    env: process.env,
  });
}

function clientLooksReady() {
  const clientEntry = join(GENERATED, "client.ts");
  const engineDll = join(GENERATED, "query_engine-windows.dll.node");
  const engineSo = join(GENERATED, "libquery_engine-darwin.dylib.node");
  const engineBin = join(GENERATED, "libquery_engine-debian-openssl-3.0.x.so.node");

  if (!fs.existsSync(clientEntry)) return false;
  return (
    fs.existsSync(engineDll) ||
    fs.existsSync(engineSo) ||
    fs.existsSync(engineBin)
  );
}

cleanStaleTmpFiles(GENERATED);

for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
  const result = runGenerate();
  if (result.status === 0) {
    process.exit(0);
  }

  if (attempt === MAX_ATTEMPTS) {
    if (clientLooksReady()) {
      log(
        "Prisma client already generated; query engine DLL is locked (likely by a running Next.js dev server). Using existing client."
      );
      process.exit(0);
    }

    log(
      "Prisma generate failed after retries. If a Next.js/dev server is running, stop it first (or re-run npm run dev, which generates before starting Next)."
    );
    process.exit(result.status ?? 1);
  }

  log(`attempt ${attempt} failed; waiting before retry...`);
  cleanStaleTmpFiles(GENERATED);
  sleep(750 * attempt);
}
