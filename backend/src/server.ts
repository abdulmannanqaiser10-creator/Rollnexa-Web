import "./config/env";
import { createApp } from "@/app";
import { env } from "@/config/env";
import { connectDatabase } from "@/lib/db";

async function main() {
  await connectDatabase();
  const app = await createApp();

  const server = app.listen(env.port, () => {
    console.log(`[api] Rollnexa Express API listening on http://localhost:${env.port}`);
  });

  server.on("error", (error: NodeJS.ErrnoException) => {
    if (error.code === "EADDRINUSE") {
      console.error(
        `[api] Port ${env.port} is already in use. Stop the other process or run dev prepare again.`
      );
    } else {
      console.error("[api] Server error:", error);
    }
    process.exit(1);
  });
}

main().catch((error) => {
  console.error("[api] failed to start:", error);
  process.exit(1);
});
