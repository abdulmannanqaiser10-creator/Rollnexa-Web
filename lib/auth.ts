import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { prisma } from "./db";

function sanitizeRole(role: unknown): "BUYER" | "SELLER" {
  return role === "SELLER" ? "SELLER" : "BUYER";
}

if (!process.env.DATABASE_URL) {
  console.error(
    "[auth] DATABASE_URL is missing. Check .env and ensure .env.local does not override it with an empty value."
  );
}

export const auth = betterAuth({
  baseURL: process.env.BETTER_AUTH_URL,
  secret: process.env.BETTER_AUTH_SECRET,
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  emailAndPassword: {
    enabled: true,
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // 1 day
  },
  user: {
    additionalFields: {
      role: {
        type: "string",
        required: false,
        defaultValue: "BUYER",
        input: true,
      },
    },
  },
  databaseHooks: {
    user: {
      create: {
        before: async (user) => {
          const raw = user as typeof user & { role?: string | null };
          return {
            data: {
              ...raw,
              role: sanitizeRole(raw.role),
            },
          };
        },
        after: async (user) => {
          try {
            await prisma.profile.create({
              data: { userId: user.id },
            });
          } catch (error) {
            console.error("[auth] Failed to create profile for user", user.id, error);
          }
        },
      },
    },
  },
});

export type SessionUser = typeof auth.$Infer.Session.user;
