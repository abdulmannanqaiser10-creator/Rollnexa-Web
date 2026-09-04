import "server-only";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { parse } from "dotenv";

/**
 * Fill missing/empty process.env keys from known env files.
 * Next.js already loads frontend/.env*; this also picks up root/backend files
 * and ignores empty .env.local overrides when a non-empty value exists elsewhere.
 */
function fillFromFile(filePath: string) {
  if (!existsSync(filePath)) return;

  let parsed: Record<string, string>;
  try {
    parsed = parse(readFileSync(filePath));
  } catch {
    return;
  }

  for (const [key, value] of Object.entries(parsed)) {
    if (typeof value !== "string" || value.trim() === "") continue;
    const current = process.env[key];
    if (current === undefined || current.trim() === "") {
      process.env[key] = value;
    }
  }
}

const cwd = process.cwd();
const files = [
  resolve(cwd, ".env"),
  resolve(cwd, ".env.local"),
  resolve(cwd, "../.env"),
  resolve(cwd, "../backend/.env"),
  resolve(cwd, "../../.env"),
];

for (const file of files) {
  fillFromFile(file);
}
