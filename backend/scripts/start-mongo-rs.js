/**
 * Start (or reuse) a single-node MongoDB replica set on port 27018.
 */
import { spawn, execFileSync } from "node:child_process";
import { existsSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const PORT = 27018;
const BACKEND = join(__dirname, "..");
const ROOT = join(BACKEND, "..");
const DATA = join(ROOT, ".mongo-rs0");
const CANDIDATES = [
  "C:\\Program Files\\MongoDB\\Server\\8.3\\bin\\mongod.exe",
  "C:\\Program Files\\MongoDB\\Server\\8.0\\bin\\mongod.exe",
  "C:\\Program Files\\MongoDB\\Server\\7.0\\bin\\mongod.exe",
  "mongod",
];

function findMongod() {
  for (const candidate of CANDIDATES) {
    if (candidate === "mongod" || existsSync(candidate)) return candidate;
  }
  throw new Error("mongod not found. Install MongoDB Community Server.");
}

function mongoshEval(js) {
  try {
    return execFileSync(
      "mongosh",
      ["--quiet", "--port", String(PORT), "--eval", js],
      { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }
    );
  } catch (error) {
    const stdout =
      typeof error === "object" && error && "stdout" in error
        ? String(error.stdout)
        : "";
    const message = error instanceof Error ? error.message : String(error);
    return stdout || message;
  }
}

function isListening() {
  const out = mongoshEval("db.runCommand({ ping: 1 })");
  return out.includes("ok: 1") || out.includes('"ok": 1');
}

function ensureReplicaSet() {
  const status = mongoshEval(
    "try { print(rs.status().members[0].stateStr) } catch (e) { print('NEED_INIT') }"
  );
  if (status.includes("PRIMARY") || status.includes("SECONDARY")) {
    console.log(`[db:mongo] replica set ready on 127.0.0.1:${PORT}`);
    return;
  }
  console.log("[db:mongo] initiating replica set rs0...");
  const init = mongoshEval(
    "printjson(rs.initiate({_id:'rs0', members:[{_id:0, host:'127.0.0.1:27018'}]}))"
  );
  console.log(init.trim());
  for (let i = 0; i < 20; i++) {
    const state = mongoshEval(
      "try { print(rs.status().members[0].stateStr) } catch (e) { print('WAIT') }"
    );
    if (state.includes("PRIMARY")) {
      console.log(`[db:mongo] PRIMARY on 127.0.0.1:${PORT}`);
      console.log(
        "[db:mongo] MONGODB_URI=mongodb://127.0.0.1:27018/rollnexa_marketplace?replicaSet=rs0"
      );
      return;
    }
    Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 500);
  }
  throw new Error("Replica set did not become PRIMARY in time");
}

mkdirSync(DATA, { recursive: true });

if (isListening()) {
  ensureReplicaSet();
  process.exit(0);
}

const mongod = findMongod();
console.log(`[db:mongo] starting ${mongod} on port ${PORT}...`);
const child = spawn(
  mongod,
  ["--dbpath", DATA, "--replSet", "rs0", "--port", String(PORT), "--bind_ip", "127.0.0.1"],
  { detached: true, stdio: "ignore" }
);
child.unref();

for (let i = 0; i < 30; i++) {
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 500);
  if (isListening()) {
    ensureReplicaSet();
    process.exit(0);
  }
}

throw new Error(`mongod did not accept connections on ${PORT}`);
